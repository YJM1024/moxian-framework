"""Read a complete, explicitly identified section of a local Markdown contract."""

import argparse
from pathlib import Path
import re
import sys


_HEADING = re.compile(r"^ {0,3}(#{1,6})[ \t]+(.+?)\s*$")
_FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")
_ANCHOR = re.compile(r"""^\s*<a\s+id=(["'])([^"']+)\1\s*>\s*</a>\s*$""", re.IGNORECASE)


def section(reference: str) -> tuple[int, str]:
    filename, separator, fragment = reference.rpartition("#")
    if not separator or not filename or not fragment.strip():
        raise ValueError("用 PATH#标题、标题首个编号或相邻的 HTML id 指定项目条款")
    lines = Path(filename).read_text(encoding="utf-8-sig").splitlines(keepends=True)
    headings = []
    fence = ""
    for line_no, line in enumerate(lines):
        mark = _FENCE.match(line)
        if fence:
            if mark and mark[1][0] == fence[0] and len(mark[1]) >= len(fence) and not mark[2].strip():
                fence = ""
            continue
        if mark:
            fence = mark[1]
            continue
        match = _HEADING.match(line)
        if match:
            title = re.sub(r"[ \t]+#+$", "", match[2]).strip()
            names = {title.casefold(), title.split()[0].casefold()} if title else set()
            headings.append((line_no, len(match[1]), names))
        elif headings and (anchor := _ANCHOR.match(line)):
            index = headings[-1][0]
            if all(not text.strip() or _ANCHOR.match(text) for text in lines[index + 1:line_no]):
                headings[-1][2].add(anchor[2].casefold())
    matches = [(index, depth) for index, depth, names in headings if fragment.casefold() in names]
    if len(matches) != 1:
        raise ValueError(f"{reference} 匹配到 {len(matches)} 个章节，请核对来源或使用唯一完整标题")
    start, depth = matches[0]
    end = next((index for index, level, _ in headings if index > start and level <= depth), len(lines))
    return start + 1, "".join(lines[start:end])


def _show(args: argparse.Namespace) -> int:
    try:
        results = [(ref, *section(ref)) for ref in dict.fromkeys(args.references)]
    except (OSError, ValueError) as exc:
        print(f"contract: {exc}", file=sys.stderr)
        return 1
    for ref, line, body in results:
        print(f"{ref} (L{line})")
        print(body.rstrip("\n"))
    return 0


def register(commands) -> None:
    parser = commands.add_parser("contract", help="读取既有 Markdown 项目契约中的完整章节")
    parser.add_argument("references", nargs="+", metavar="PATH#SECTION")
    parser.set_defaults(run=_show)
