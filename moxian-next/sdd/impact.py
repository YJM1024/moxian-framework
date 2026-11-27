"""Select existing project checks using a repository's impact policy."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
from pathlib import Path, PureWindowsPath
import subprocess
import sys

from .contracts import section


class ImpactError(ValueError):
    pass


@dataclass(frozen=True)
class Check:
    cwd: Path
    argv: tuple[str, ...]


@dataclass(frozen=True)
class Rule:
    paths: tuple[str, ...]
    contracts: tuple[str, ...]
    checks: tuple[str, ...]


def _object(value, required: set[str], optional: set[str], label: str) -> dict:
    if not isinstance(value, dict):
        raise ImpactError(f"{label} 必须是对象")
    missing = required - value.keys()
    extra = value.keys() - required - optional
    if missing or extra:
        raise ImpactError(f"{label} 缺少字段 {sorted(missing)}，未知字段 {sorted(extra)}")
    return value


def _strings(value, label: str, *, required: bool = False, allow_empty: bool = False) -> tuple[str, ...]:
    if not isinstance(value, list) or (required and not value):
        raise ImpactError(f"{label} 必须是{'非空' if required else ''}字符串数组")
    if any(not isinstance(item, str) or "\0" in item or (not allow_empty and not item.strip()) for item in value):
        raise ImpactError(f"{label} 包含无效字符串")
    for item in value:
        item.encode("utf-8")
    return tuple(value)


def _relative(value, label: str, *, prefixes: bool = False) -> str:
    if not isinstance(value, str) or "\0" in value or "\\" in value or PureWindowsPath(value).drive:
        raise ImpactError(f"{label} 必须使用 Git 根目录下的相对路径，收到 {value!r}")
    path = value.removesuffix("/") if prefixes else value
    if any(part in ("", ".", "..") for part in path.split("/")):
        raise ImpactError(f"{label} 必须使用 Git 根目录下的相对路径，收到 {value!r}")
    return value


def _pairs(pairs: list[tuple[str, object]]) -> dict:
    data: dict = {}
    for key, value in pairs:
        if key in data:
            raise ImpactError(f"策略包含重复字段 {key!r}")
        data[key] = value
    return data


def _load_policy(path: Path, root: Path) -> tuple[dict[str, Check], list[Rule], tuple[str, ...]]:
    content = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=_pairs)
    policy = _object(content, {"checks", "rules"}, {"shared"}, "策略")
    if not isinstance(policy["checks"], dict) or not policy["checks"]:
        raise ImpactError("checks 必须是非空对象，包含项目的全量检查入口")
    checks = {}
    for name, entry in policy["checks"].items():
        if not name.strip() or "\0" in name:
            raise ImpactError(f"无效的检查名 {name!r}")
        name.encode("utf-8")
        spec = _object(entry, {"cwd", "argv"}, set(), f"检查 {name!r}")
        cwd = spec["cwd"] if spec["cwd"] == "." else _relative(spec["cwd"], "cwd")
        directory = (root / cwd).resolve()
        if not directory.is_relative_to(root) or not directory.is_dir():
            raise ImpactError(f"检查 {name!r} 的 cwd 必须是 Git 根目录内的现有目录，收到 {cwd!r}")
        argv = _strings(spec["argv"], f"检查 {name!r} 的 argv", required=True, allow_empty=True)
        if not argv[0]:
            raise ImpactError(f"检查 {name!r} 的 argv 须指定可执行程序")
        checks[name] = Check(directory, argv)

    if not isinstance(policy["rules"], list):
        raise ImpactError("rules 必须是数组")
    rules = []
    for index, entry in enumerate(policy["rules"], 1):
        label = f"规则 {index}"
        spec = _object(entry, {"checks"}, {"paths", "contracts"}, label)
        paths = _strings(spec.get("paths", []), f"{label} 的 paths")
        contracts = _strings(spec.get("contracts", []), f"{label} 的 contracts")
        names = _strings(spec["checks"], f"{label} 的 checks", required=True)
        if not paths and not contracts:
            raise ImpactError(f"{label} 须声明 paths 或 contracts")
        for selector in paths:
            _relative(selector, f"{label} 的 paths", prefixes=True)
        for locator in contracts:
            file, separator, anchor = locator.partition("#")
            _relative(file, f"{label} 的 contracts")
            if separator and not anchor.strip():
                raise ImpactError(f"{label} 的契约锚点为空，收到 {locator!r}")
        if unknown := set(names) - checks.keys():
            raise ImpactError(f"{label} 引用了未知检查 {sorted(unknown)}")
        rules.append(Rule(paths, contracts, names))

    shared = _strings(policy.get("shared", []), "shared")
    for selector in shared:
        _relative(selector, "shared", prefixes=True)
    return checks, rules, shared


def _git(cwd: Path, *args: str) -> bytes:
    result = subprocess.run(["git", *args], cwd=cwd, capture_output=True, check=False)
    if result.returncode:
        raise ImpactError(os.fsdecode(result.stderr).strip() or f"Git 命令 {args[0]} 失败")
    return result.stdout


def _changes(root: Path, base: str) -> list[tuple[str, tuple[str, ...]]]:
    # A diff against a commit compares file contents. Unresolved index entries
    # can appear as M or disappear entirely when the file matches the baseline.
    conflicted = _git(root, "diff", "--cached", "--name-only", "--diff-filter=U", "--no-relative", "-z", "--")
    unresolved = set(os.fsdecode(conflicted).split("\0")[:-1])
    diff = _git(
        root, "diff", "--name-status", "-z", "--find-renames", "--no-relative",
        "--no-ext-diff", "--no-textconv", "--ignore-submodules=none", base, "--",
    )
    fields = iter(os.fsdecode(diff).split("\0")[:-1])
    changes = []
    for status in fields:
        width = 2 if status[:1] in {"R", "C"} else 1
        paths = tuple(next(fields, "") for _ in range(width))
        if status[:1] not in {"A", "C", "D", "M", "R", "T", "U", "X", "B"} or not all(paths):
            raise ImpactError("Git 返回了无法识别的变更记录")
        if width != 1 or paths[0] not in unresolved:
            changes.append((status, paths))
    changes.extend(("U", (path,)) for path in sorted(unresolved))
    untracked = _git(root, "ls-files", "--others", "--exclude-standard", "-z")
    changes.extend(("?", (path,)) for path in os.fsdecode(untracked).split("\0")[:-1])
    return changes


def _matches(path: str, selectors: tuple[str, ...]) -> bool:
    return any(path.startswith(prefix) if prefix.endswith("/") else path == prefix for prefix in selectors)


def _select(
    root: Path, policy_path: Path, changes: list[tuple[str, tuple[str, ...]]],
    rules: list[Rule], shared: tuple[str, ...],
) -> tuple[set[str], list[str], list[str]]:
    contracts: dict[str, dict[str, set[str]]] = {}
    for rule in rules:
        for locator in rule.contracts:
            file, _, anchor = locator.partition("#")
            contracts.setdefault(file, {}).setdefault(anchor, set()).update(rule.checks)

    selected: set[str] = set()
    locators: dict[str, set[str]] = {}
    details = []
    fallback = []
    shared += tuple(
        path.relative_to(root).as_posix()
        for path in (policy_path, policy_path.resolve())
        if path.is_relative_to(root)
    )
    for status, paths in changes:
        for path in paths:
            if status == "U":
                fallback.append(f"Git 索引仍有合并冲突 U {path!r}")
            elif status in {"X", "B"}:
                fallback.append(f"变更状态不明确 {status} {path!r}")
            elif _matches(path, shared):
                fallback.append(f"共享路径 {path!r}")
            elif path in contracts and any(contracts[path]):
                fallback.append(f"契约文件 {path!r} 变更，影响章节未确定")
                locators.setdefault(path, set()).update(contracts[path])
            else:
                matching = [rule for rule in rules if _matches(path, rule.paths)]
                if not matching and path not in contracts:
                    fallback.append(f"未映射路径 {path!r}")
                    continue
                direct = {name for rule in matching for name in rule.checks}
                if direct:
                    details.append(f"路径 {path!r} -> {', '.join(sorted(direct))}")
                    selected.update(direct)
                for rule in matching:
                    for locator in rule.contracts:
                        file, _, anchor = locator.partition("#")
                        locators.setdefault(file, set()).add(anchor)
                if path in contracts:
                    locators.setdefault(path, set()).add("")

    for file, requested in sorted(locators.items()):
        try:
            contract = (root / file).resolve()
            available = contract.is_relative_to(root) and contract.is_file()
        except (OSError, RuntimeError):
            available = False
        if not available:
            for anchor in sorted(requested):
                locator = f"{file}#{anchor}" if anchor else file
                fallback.append(f"无法定位契约文件 {locator!r}")
            continue

        spans: dict[str, range] = {}
        consumers_by_anchor = contracts[file]
        for anchor in sorted(consumers_by_anchor):
            if not anchor:
                continue
            try:
                if Path(file).suffix.casefold() not in {".md", ".markdown"}:
                    raise ValueError("只支持确认 Markdown 章节")
                start, body = section(f"{contract}#{anchor}")
                spans[anchor] = range(start, start + len(body.splitlines()))
            except (OSError, ValueError):
                fallback.append(f"无法确认契约章节 {file + '#' + anchor!r}")

        unresolved = any(anchor and anchor not in spans for anchor in consumers_by_anchor)
        for anchor in sorted(requested):
            names = {
                name
                for other, consumers in consumers_by_anchor.items()
                if unresolved or not anchor or not other
                or spans[anchor].start in spans[other] or spans[other].start in spans[anchor]
                for name in consumers
            }
            locator = f"{file}#{anchor}" if anchor else file
            details.append(f"契约 {locator!r} -> {', '.join(sorted(names))}")
            selected.update(names)
    return selected, list(dict.fromkeys(details)), list(dict.fromkeys(fallback))


def _run(selected: dict[Check, list[str]]) -> int:
    exit_code = 0
    for check, names in selected.items():
        label = ", ".join(names)
        print(f"运行 {label}", flush=True)
        try:
            status = subprocess.run(check.argv, cwd=check.cwd, check=False).returncode
        except OSError as error:
            print(f"无法启动检查 {label}（{error}）", file=sys.stderr)
            status = 127 if isinstance(error, FileNotFoundError) else 126
        print(f"检查 {label} 退出码 {status}")
        if status and not exit_code:
            exit_code = 128 - status if status < 0 else status
    return exit_code


def _impact(args: argparse.Namespace) -> int:
    try:
        root = Path(os.fsdecode(_git(args.root, "rev-parse", "--show-toplevel")).removesuffix("\n")).resolve()
        policy_path = args.policy.absolute()
        checks, rules, shared = _load_policy(policy_path, root)
        try:
            base = _git(root, "rev-parse", "--verify", "--end-of-options", args.base + "^{commit}").decode().strip()
        except ImpactError as error:
            raise ImpactError(f"无法解析基线 {args.base!r}（{error}）") from error
        changes = _changes(root, base)
        selected, details, fallback = _select(root, policy_path, changes, rules, shared)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"影响选测失败（{error}）", file=sys.stderr)
        return 2

    if not args.execute:
        print("影响选测预览")
    print(f"基线 {base}")
    if not changes:
        print("最终工作树相对基线没有变更，无需选测")
        return 0

    for status, paths in changes:
        print(f"{status} {' -> '.join(repr(path) for path in paths)}")
    for detail in details:
        print(detail)
    if fallback:
        print("回退到策略声明的全量检查")
        for reason in fallback:
            print(f"- {reason}")
        selected = set(checks)

    commands: dict[Check, list[str]] = {}
    for name, check in checks.items():
        if name in selected:
            commands.setdefault(check, []).append(name)
    for check, names in commands.items():
        cwd = check.cwd.relative_to(root).as_posix()
        print(f"检查 {', '.join(names)} (cwd={cwd!r}) {list(check.argv)!r}")
    if args.execute:
        return _run(commands)
    return 0


def register(subparsers) -> None:
    parser = subparsers.add_parser("impact", help="按项目策略选择受影响的原生检查")
    parser.add_argument("--policy", type=Path, required=True, help="可信的 JSON 策略文件")
    parser.add_argument("--base", required=True, help="用于对比最终工作树的 Git 提交")
    parser.add_argument("--root", type=Path, default=Path("."), help="目标 Git 工作树内的目录")
    parser.add_argument("--run", dest="execute", action="store_true", help="运行选中的检查")
    parser.set_defaults(run=_impact)
