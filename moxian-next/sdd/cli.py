"""Command-line entry points for delivery guidance and evidence checks."""

import argparse
from collections.abc import Sequence
from importlib.resources import files
from pathlib import Path
import re
import subprocess
import sys
import tempfile


ROLES = {
    "product": "产品与需求",
    "ux": "用户体验与视觉设计",
    "architecture": "架构与技术统筹",
    "frontend": "前端工程",
    "backend": "后端工程",
    "data": "数据工程与持久化",
    "qa": "测试与质量工程",
    "review": "代码评审与交付验收",
    "security": "安全与隐私",
    "release": "基础设施、构建与发布",
    "sre": "可靠性与运行反馈",
}


def _list_roles(_args: argparse.Namespace) -> int:
    for slug, name in ROLES.items():
        print(f"{slug}\t{name}")
    return 0


def _show_markdown(command: str, filename: str, *, strip_frontmatter: bool = False) -> int:
    resource = files("sdd")
    for part in filename.split("/"):
        resource = resource.joinpath(part)
    try:
        body = resource.read_text(encoding="utf-8")
        if strip_frontmatter:
            opening, _, document = body.partition("\n")
            _, closing, markdown = document.partition("\n---\n")
            if opening != "---" or not closing or not markdown.strip():
                raise ValueError("缺少以 --- 标记的开头元数据或正文")
            body = markdown.lstrip("\n")
    except (OSError, ValueError) as exc:
        print(f"{command}: 无法显示 sdd/{filename} ({exc})", file=sys.stderr)
        return 1
    sys.stdout.write(body)
    return 0


def _show_role(args: argparse.Namespace) -> int:
    return _show_markdown("role", f"roles/{args.slug}.md")


def _show_workflow(_args: argparse.Namespace) -> int:
    return _show_markdown("workflow", "skills/spec-driven-delivery/SKILL.md", strip_frontmatter=True)


def _read_topics(slugs: Sequence[str]) -> dict[str, tuple[str, str, str]]:
    topics = {}
    header = re.compile(r"^## (\d+\.\d+) (.+)$", re.MULTILINE)
    for slug in dict.fromkeys(slugs):
        body = files("sdd").joinpath("roles").joinpath(f"{slug}.md").read_text(encoding="utf-8")
        sections = list(header.finditer(body))
        if not sections:
            raise ValueError(f"角色 {slug} 没有编号条目")
        for index, heading in enumerate(sections):
            number, title = heading.groups()
            if number in topics:
                raise ValueError(f"条目编号重复 {number}")
            end = sections[index + 1].start() if index + 1 < len(sections) else len(body)
            topics[number] = (slug, title, body[heading.start():end].rstrip())
    return topics


def _show_topics(args: argparse.Namespace) -> int:
    for slug in args.roles:
        if slug not in ROLES:
            print(f"topics: 未知角色 {slug}", file=sys.stderr)
            return 2
    try:
        topics = _read_topics(args.roles or list(ROLES))
    except (ValueError, OSError) as exc:
        print(f"topics: {exc}", file=sys.stderr)
        return 1
    for number, (slug, title, _) in topics.items():
        print(f"{number}\t{slug}\t{title}")
    return 0


def _show_selected_topics(args: argparse.Namespace) -> int:
    try:
        topics = _read_topics(list(ROLES))
    except (ValueError, OSError) as exc:
        print(f"topic: {exc}", file=sys.stderr)
        return 1
    selected = list(dict.fromkeys(args.numbers))
    missing = [number for number in selected if number not in topics]
    if missing:
        print(f"topic: 未知条目 {', '.join(missing)}", file=sys.stderr)
        return 2
    print("\n\n".join(topics[number][2] for number in selected))
    return 0


def _check_go(args: argparse.Namespace) -> int:
    from .go_evidence import summarize_go

    gaps = summarize_go(args.events, args.exit_code, args.package, args.test)
    if gaps:
        for gap in gaps:
            print(f"check-go: {gap}", file=sys.stderr)
        return 1
    print(f"Go 证据通过 · {args.package}")
    return 0


def _test_go(args: argparse.Namespace) -> int:
    from .go_evidence import summarize_go

    flags = args.go_args
    if flags and flags[0] != "--":
        print("test-go: 请在 Go 参数前使用 --", file=sys.stderr)
        return 2
    # Check a private file from this exact child process before publishing it.
    # Parallel runs may publish to the same name without mixing their events.
    try:
        parent = args.events.parent if args.events else None
        with tempfile.TemporaryDirectory(dir=parent) as directory:
            events = Path(directory) / "go.jsonl"
            with tempfile.TemporaryFile() as stderr:
                with events.open("wb") as output:
                    try:
                        run = subprocess.run(
                            ["go", "test", "-json", *flags[1:]], stdout=output, stderr=stderr,
                        )
                    except OSError as exc:
                        print(f"test-go: Could not start go test: {exc}", file=sys.stderr)
                        return 1
                stderr.seek(0)
                gaps = summarize_go(events, run.returncode, args.package, args.test, stderr)
            if args.events:
                events.replace(args.events)
    except (OSError, ValueError) as exc:
        print(f"test-go: {exc}", file=sys.stderr)
        return 1
    for gap in gaps:
        print(f"test-go: {gap}", file=sys.stderr)
    if gaps:
        return 1
    print(f"Go 证据通过 · {args.package}")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    from . import contracts, impact

    parser = argparse.ArgumentParser(prog="sdd", description="查看交付流程、专业职责和工程证据")
    commands = parser.add_subparsers(dest="command", required=True)
    contracts.register(commands)
    impact.register(commands)

    workflow = commands.add_parser("workflow", help="读取共同交付流程")
    workflow.set_defaults(run=_show_workflow)

    roles = commands.add_parser("roles", help="列出角色标识与名称")
    roles.set_defaults(run=_list_roles)

    role = commands.add_parser("role", help="读取指定角色正文")
    role.add_argument("slug", choices=tuple(ROLES))
    role.set_defaults(run=_show_role)

    topics = commands.add_parser("topics", help="查看一个或多个角色的条目标题")
    topics.add_argument("roles", nargs="*", metavar="ROLE", help="角色标识，默认全部")
    topics.set_defaults(run=_show_topics)

    topic = commands.add_parser("topic", help="按编号读取完整要求、来源和验收判据")
    topic.add_argument("numbers", nargs="+", metavar="ID")
    topic.set_defaults(run=_show_selected_topics)

    go = commands.add_parser("check-go", help="核对已有 Go 测试事件")
    go.add_argument("--events", required=True, type=Path, metavar="PATH", help="go test -json 的输出文件")
    go.add_argument("--exit-code", required=True, type=int, metavar="INT", help="原测试进程的退出码")
    go.set_defaults(run=_check_go)

    live = commands.add_parser("test-go", help="运行一次原生 go test 并核对必查用例")
    live.add_argument("--events", type=Path, metavar="PATH", help="保存此次原始 JSONL（包括失败）")
    live.add_argument("go_args", nargs=argparse.REMAINDER, metavar="-- GO_ARGS")
    live.set_defaults(run=_test_go)
    for command in (go, live):
        command.add_argument("--package", required=True, metavar="PKG", help="Go 事件中的包名")
        command.add_argument("--test", required=True, action="append", metavar="NAME", help="必查测试名，可重复指定")

    args = parser.parse_args(argv)
    return args.run(args)
