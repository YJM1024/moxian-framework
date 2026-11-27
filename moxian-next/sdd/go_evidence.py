"""Check the observed results from a Go test JSON report."""

import json
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import BinaryIO


_PACKAGE_RESULTS = frozenset({"pass", "fail", "skip"})
_TEST_RESULTS = _PACKAGE_RESULTS | {"bench"}
_ACTIVE_TEST = frozenset({"run", "pause", "cont"})
_TEST_METADATA = frozenset({"attr", "artifacts"})
_FAILURE_SUBJECT_LIMITS = {"build": 3, "package": 3, "test": 6}
_GAP_LIMIT = 12
_OUTPUT_LIMIT = 4
_LINE_LIMIT = 320

_OutputKey = tuple[str, str, str | None]


def _clip(line: str) -> str:
    prefix = "".join(char if char.isprintable() or char == "\t" else "�" for char in line[:_LINE_LIMIT])
    return prefix + ("…" if len(line) > _LINE_LIMIT else "")


@dataclass
class _Preview:
    first: list[str] = field(default_factory=list)
    last: str = ""
    omitted: bool = False

    def add(self, line: str) -> None:
        line = _clip(line)
        if line in self.first or line == self.last:
            return
        if len(self.first) < _OUTPUT_LIMIT - 1:
            self.first.append(line)
        else:
            self.omitted = self.omitted or bool(self.last)
            self.last = line

    def lines(self) -> list[str]:
        return [*self.first, *(["…"] if self.omitted else []), *([self.last] if self.last else [])]


@dataclass
class _Failure:
    message: str
    end_line: int
    output: _Preview = field(default_factory=_Preview)
    errors: _Preview = field(default_factory=_Preview)


@dataclass
class _Findings:
    bounded: bool = False
    messages: list[str] = field(default_factory=list)
    subjects: dict[_OutputKey, _Failure] = field(default_factory=dict)
    omitted: bool = False

    def add(self, message: str, key: _OutputKey | None = None, end_line: int = 0) -> None:
        if not self.bounded:
            self.messages.append(message)
        elif key is not None:
            if key in self.subjects:
                return
            used = sum(existing[0] == key[0] for existing in self.subjects)
            if used < _FAILURE_SUBJECT_LIMITS[key[0]]:
                self.subjects[key] = _Failure(_clip(message), end_line)
            else:
                self.omitted = True
        else:
            message = _clip(message)
            if message in self.messages:
                return
            if len(self.messages) < _GAP_LIMIT:
                self.messages.append(message)
            else:
                self.omitted = True

    def summary(self, stderr: Iterable[bytes]) -> list[str]:
        lines = []
        for subject in self.subjects.values():
            lines.append(subject.message)
            lines.extend(f"  {line}" for line in (subject.errors.lines() or subject.output.lines()))
        preview = _Preview()
        for raw_line in stderr:
            line = raw_line.decode("utf-8", errors="replace").strip()
            if line:
                preview.add(line)
        if preview.first:
            lines.append("Go process stderr:")
            lines.extend(f"  {line}" for line in preview.lines())
        lines.extend(self.messages)
        if self.omitted:
            lines.append("Additional Go evidence failures omitted.")
        return lines


@dataclass
class _Package:
    result: str | None = None
    end_line: int = 0
    tests: dict[str, str] = field(default_factory=dict)


def _unique_fields(pairs: list[tuple[str, object]]) -> dict[str, object]:
    fields = {}
    for key, value in pairs:
        if key in fields:
            raise ValueError(f"duplicate JSON field {key!r}")
        fields[key] = value
    return fields


def _reject_constant(value: str) -> None:
    raise ValueError(f"invalid JSON value {value}")


def _name(event: dict[str, object], key: str) -> str:
    value = event.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"expected a nonempty {key} string")
    return value


def _record_test(package: _Package, test: str, action: str) -> None:
    previous = package.tests.get(test)
    if action == "run":
        if previous is not None:
            raise ValueError(f"test {test!r} ran more than once")
    elif action == "pause":
        if previous != "run":
            raise ValueError(f"test {test!r} paused without an active run")
    elif action == "cont":
        if previous != "pause":
            raise ValueError(f"test {test!r} continued without a pause")
    elif previous not in {"run", "cont"}:
        raise ValueError(f"test {test!r} reported {action} without a unique active run")
    package.tests[test] = action


def _record_event(
    event: object, packages: dict[str, _Package], findings: _Findings, number: int,
) -> None:
    if not isinstance(event, dict):
        raise ValueError("expected a JSON object")
    action = _name(event, "Action")
    if action in {"output", "build-output"} and not isinstance(event.get("Output"), str):
        raise ValueError(f"{action} requires an Output string")
    if action in {"build-output", "build-fail"}:
        import_path = _name(event, "ImportPath")
        if action == "build-fail":
            findings.add(f"Build failed for {import_path!r}.", ("build", import_path, None), number)
        return

    package_name = _name(event, "Package")
    test = _name(event, "Test") if "Test" in event else None
    if action == "fail":
        subject = f"Package {package_name!r}" if test is None else f"Test {package_name!r} {test!r}"
        failed_build = event.get("FailedBuild")
        cause = f" (build failed for {failed_build!r})" if isinstance(failed_build, str) else ""
        failure = f"{subject} failed{cause}."
        if not findings.bounded:
            findings.add(failure)
    if action == "start":
        if test is not None:
            raise ValueError("a package start cannot identify a test")
        if package_name in packages:
            raise ValueError(f"package {package_name!r} started more than once")
        packages[package_name] = _Package()
        return

    package = packages.get(package_name)
    if package is None:
        raise ValueError(f"package {package_name!r} has no start event")
    if package.result is not None:
        raise ValueError(f"package {package_name!r} has events after its terminal result")
    if action == "output":
        return
    if test is None and action in _PACKAGE_RESULTS:
        package.result = action
        package.end_line = number
    elif test is not None and action in _ACTIVE_TEST | _TEST_RESULTS:
        _record_test(package, test, action)
    elif test is None or action not in _TEST_METADATA:
        raise ValueError(f"unexpected {action!r} event for package {package_name!r}")
    if action == "fail" and findings.bounded:
        kind = "package" if test is None else "test"
        findings.add(failure, (kind, package_name, test), number)


def _decode_event(line: bytes) -> object:
    return json.loads(
        line.decode("utf-8"),
        object_pairs_hook=_unique_fields,
        parse_constant=_reject_constant,
    )


def _go_frame(line: str) -> bool:
    return line == "FAIL" or line.startswith((
        "=== RUN ", "=== PAUSE ", "=== CONT ", "=== NAME ", "=== PASS ", "=== FAIL ",
        "=== SKIP ", "--- PASS:", "--- FAIL:", "--- SKIP:", "FAIL\t",
    ))


def _collect_output(report: BinaryIO, subjects: dict[_OutputKey, _Failure]) -> None:
    # Look back only for subjects that actually failed. Successful packages
    # and tests can emit arbitrarily many lines without entering the summary.
    report.seek(0)
    last_failure = max(subject.end_line for subject in subjects.values())
    packages = {key[1] for key in subjects if key[0] != "build"}
    started_packages = set()
    started_tests = set()
    for number, raw_line in enumerate(report, start=1):
        if number >= last_failure:
            break
        try:
            event = _decode_event(raw_line)
        except (ValueError, RecursionError):
            continue
        if not isinstance(event, dict):
            continue
        action = event.get("Action")
        if action == "build-output":
            key = ("build", event.get("ImportPath"), None)
            if not isinstance(key[1], str):
                continue
        else:
            package = event.get("Package")
            if not isinstance(package, str) or package not in packages:
                continue
            if action == "start" and "Test" not in event:
                started_packages.add(package)
                continue
            if package not in started_packages:
                continue
            test = event.get("Test")
            if "Test" in event and not isinstance(test, str):
                continue
            key = ("package" if test is None else "test", package, test)
            if action == "run" and key in subjects:
                started_tests.add(key)
            if action != "output" or (test is not None and key not in started_tests):
                continue
        subject = subjects.get(key)
        output = event.get("Output")
        output_type = event.get("OutputType")
        if (
            subject is None or number >= subject.end_line
            or not isinstance(output, str) or output_type == "frame"
        ):
            continue
        for line in output.splitlines():
            line = line.strip()
            if not line:
                continue
            if output_type in ("error", "error-continue") or line.startswith(("panic: ", "fatal error: ")):
                subject.errors.add(line)
            elif not _go_frame(line):
                subject.output.add(line)


def check_go(
    path: Path | str, exit_code: int, package: str, tests: Sequence[str]
) -> list[str]:
    """Return the gaps in one unmerged, non-retried ``go test -json`` report.

    Supply the original process exit code and at least one exact ``Test`` name.
    Subtest names include the full path as emitted by Go. Required tests must
    have a run and a passing result, including when Go replays native cache
    results. Unrelated skips are allowed. Any reported test, package or build
    failure invalidates the result, even in an unrelated package.

    The report itself cannot establish its origin, revision, environment,
    completeness of the intended package list, or sufficiency of assertions.
    """
    findings = _Findings()
    _check_go(path, exit_code, package, tests, findings)
    return findings.messages


def summarize_go(
    path: Path | str, exit_code: int, package: str, tests: Sequence[str],
    stderr: Iterable[bytes] = (),
) -> list[str]:
    """Return a bounded CLI summary, including output associated with failures."""
    findings = _Findings(bounded=True)
    _check_go(path, exit_code, package, tests, findings)
    if exit_code == 0 and not findings.messages and not findings.subjects:
        return []
    return findings.summary(stderr)


def _check_go(
    path: Path | str, exit_code: int, package: str, tests: Sequence[str], findings: _Findings,
) -> None:
    if type(exit_code) is not int or exit_code != 0:
        findings.add(f"Expected Go process exit code 0, received {exit_code!r}.")
    if not isinstance(package, str) or not package.strip():
        findings.add("An exact Go package name is required.")
        return
    if (
        isinstance(tests, (str, bytes, bytearray))
        or not isinstance(tests, Sequence)
        or not tests
        or any(not isinstance(test, str) or not test.strip() for test in tests)
    ):
        findings.add("At least one exact required test name is needed.")
        return

    packages: dict[str, _Package] = {}
    try:
        with Path(path).open("rb") as report:
            for number, line in enumerate(report, start=1):
                if not line.strip():
                    continue
                try:
                    _record_event(_decode_event(line), packages, findings, number)
                except (ValueError, RecursionError) as error:
                    findings.add(f"Invalid Go JSONL at line {number}: {error}.")
            _check_terminals(packages, findings)
            if findings.subjects:
                _collect_output(report, findings.subjects)
    except (OSError, ValueError) as error:
        findings.add(f"Could not read Go JSONL: {error}.")
        return

    target = packages.get(package)
    if target is None:
        findings.add(f"Required package {package!r} did not run.")
        return
    if target.result != "pass" and not (findings.bounded and target.result == "fail"):
        findings.add(f"Required package {package!r} did not pass.")
    for test in dict.fromkeys(tests):
        result = target.tests.get(test)
        if result is None:
            findings.add(f"Required test {test!r} did not run in {package!r}.")
        elif result == "skip":
            findings.add(f"Required test {test!r} was skipped in {package!r}.")
        elif result != "pass" and not (findings.bounded and result == "fail"):
            findings.add(f"Required test {test!r} did not pass in {package!r}.")


def _check_terminals(packages: dict[str, _Package], findings: _Findings) -> None:
    for package_name, state in packages.items():
        if state.result is None:
            findings.add(f"Package {package_name!r} has no terminal result.")
        for test, action in state.tests.items():
            # Go may emit run and output for a benchmark without a terminal
            # bench event. Benchmarks do not count as passing required tests.
            if action not in _ACTIVE_TEST or (action == "run" and test.startswith("Benchmark")):
                continue
            message = f"Test {package_name!r} {test!r} has no terminal result."
            if state.result == "fail":
                findings.add(message, ("test", package_name, test), state.end_line)
            else:
                findings.add(message)
