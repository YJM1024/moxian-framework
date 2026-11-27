import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch


PROJECT = Path(__file__).resolve().parents[1]


class CliTests(unittest.TestCase):
    def invoke(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-B", "-m", "sdd", *args],
            cwd=PROJECT,
            capture_output=True,
            encoding="utf-8",
            timeout=10,
        )

    def test_lists_all_eleven_roles(self) -> None:
        result = self.invoke("roles")
        self.assertEqual(result.returncode, 0, result.stderr)
        entries = [line.split("\t") for line in result.stdout.splitlines()]
        self.assertEqual(
            [slug for slug, _ in entries],
            [
                "product", "ux", "architecture", "frontend", "backend", "data",
                "qa", "review", "security", "release", "sre",
            ],
        )
        self.assertEqual(entries[0], ["product", "产品与需求"])
        self.assertTrue(all(name for _, name in entries))
        self.assertEqual(result.stderr, "")

    def test_prints_only_the_selected_role(self) -> None:
        expected = (PROJECT / "sdd" / "roles" / "ux.md").read_text(encoding="utf-8")
        result = self.invoke("role", "ux")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, expected)
        self.assertEqual(result.stderr, "")

    def test_catalog_preserves_every_role_section_and_has_no_duplicate_ids(self) -> None:
        catalog = self.invoke("topics")
        self.assertEqual(catalog.returncode, 0, catalog.stderr)
        entries = [line.split("\t") for line in catalog.stdout.splitlines()]
        self.assertEqual(len(entries), 44)
        self.assertEqual(len({number for number, _, _ in entries}), len(entries))
        for slug in {slug for _, slug, _ in entries}:
            expected = (PROJECT / "sdd" / "roles" / f"{slug}.md").read_text()
            numbers = [number for number, role, _ in entries if role == slug]
            result = self.invoke("topic", *numbers)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, expected[expected.index("## "):])

    def test_reads_selected_cross_role_topics_in_request_order(self) -> None:
        catalog = self.invoke("topics", "qa", "backend", "qa")
        self.assertEqual(catalog.returncode, 0, catalog.stderr)
        self.assertEqual(len(catalog.stdout.splitlines()), 8)
        result = self.invoke("topic", "7.1", "5.2", "7.1")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.count("## "), 2)
        self.assertLess(result.stdout.index("## 7.1"), result.stdout.index("## 5.2"))
        for args in (("topics", "../qa"), ("topic", "7.1", "absent")):
            with self.subTest(args=args):
                invalid = self.invoke(*args)
                self.assertEqual(invalid.returncode, 2)
                self.assertEqual(invalid.stdout, "")

    def test_prints_workflow_body_without_frontmatter(self) -> None:
        skill = PROJECT / "sdd" / "skills" / "spec-driven-delivery" / "SKILL.md"
        lines = skill.read_text(encoding="utf-8").splitlines(keepends=True)
        self.assertEqual(lines[0], "---\n")
        body = "".join(lines[lines.index("---\n", 1) + 1:]).lstrip("\n")
        self.assertTrue(body.strip())
        result = self.invoke("workflow")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, body)
        self.assertEqual(result.stderr, "")

    @unittest.skipUnless(os.environ.get("SDD_INSTALLED_CLI"), "requires an installed sdd entry point")
    def test_installed_workflow_matches_source(self) -> None:
        installed = Path(os.environ["SDD_INSTALLED_CLI"]).resolve()
        env = dict(os.environ)
        env.pop("PYTHONPATH", None)
        env["PYTHONNOUSERSITE"] = "1"
        with TemporaryDirectory() as directory:
            packaged = subprocess.run(
                [str(installed), "workflow"],
                cwd=directory,
                env=env,
                capture_output=True,
                encoding="utf-8",
                timeout=10,
            )

        source = self.invoke("workflow")
        self.assertEqual(source.returncode, 0, source.stderr)
        self.assertEqual(packaged.returncode, 0, packaged.stderr)
        self.assertEqual(packaged.stdout, source.stdout)
        self.assertEqual(packaged.stderr, "")

    def test_rejects_an_unknown_role_as_invalid_usage(self) -> None:
        result = self.invoke("role", "../qa")
        self.assertEqual(result.returncode, 2)
        self.assertEqual(result.stdout, "")
        self.assertIn("../qa", result.stderr)

    def test_check_go_requires_each_named_test(self) -> None:
        package = "example.com/sdd/cli-fixture"
        events = [
            {"Action": "start"},
            {"Action": "run", "Test": "TestFirst"},
            {"Action": "pass", "Test": "TestFirst", "Elapsed": 0},
            {"Action": "run", "Test": "TestSecond"},
            {"Action": "pass", "Test": "TestSecond", "Elapsed": 0},
            {"Action": "pass", "Elapsed": 0.01},
        ]
        with TemporaryDirectory() as directory:
            path = Path(directory) / "events.jsonl"
            lines = [
                json.dumps({"Time": "2026-11-27T00:00:00Z", "Package": package, **event})
                for event in events
            ]
            path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            command = ["check-go", "--events", str(path), "--exit-code", "0", "--package", package]
            passed = self.invoke(*command, "--test", "TestFirst", "--test", "TestSecond")
            missing = self.invoke(*command, "--test", "TestMissing", "--test", "TestSecond")

        self.assertEqual(passed.returncode, 0, passed.stderr)
        self.assertIn(package, passed.stdout)
        self.assertEqual(passed.stderr, "")
        self.assertEqual(missing.returncode, 1)
        self.assertEqual(missing.stdout, "")
        self.assertIn("TestMissing", missing.stderr)

    def test_live_go_binds_real_exit_and_raw_events_to_the_same_invocation(self) -> None:
        from contextlib import redirect_stderr, redirect_stdout
        from io import StringIO
        from sdd.cli import main

        name = "example.org/contract"
        rows = [{"Action": action, "Package": name, **({"Test": "TestAPI"} if test else {})}
                for action, test in (("start", False), ("run", True), ("pass", True), ("pass", False))]
        raw = b"".join(json.dumps(row).encode() + b"\n" for row in rows)
        with TemporaryDirectory() as sandbox:
            events = Path(sandbox) / "events.jsonl"
            for status, required, expected in ((0, "TestAPI", 0), (9, "TestAPI", 1), (0, "TestOther", 1)):
                def run(command, stdout, stderr):
                    stdout.write(raw)
                    return subprocess.CompletedProcess(command, status)

                with self.subTest(status=status, required=required), patch("sdd.cli.subprocess.run", side_effect=run) as go:
                    with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
                        result = main(["test-go", "--package", name, "--test", required,
                                       "--events", str(events), "--", "./service", "-count=1"])
                    self.assertEqual(result, expected)
                    self.assertEqual(go.call_count, 1)
                    self.assertEqual(go.call_args.args[0], ["go", "test", "-json", "./service", "-count=1"])
                    self.assertEqual(events.read_bytes(), raw)

    def test_live_go_failure_summarizes_stderr_and_keeps_raw_stdout_optional(self) -> None:
        from contextlib import redirect_stderr, redirect_stdout
        from io import StringIO
        from sdd.cli import main

        package = "example.org/service"
        rows = [
            {"Action": "start"},
            {"Action": "run", "Test": "TestService"},
            {"Action": "output", "Test": "TestService", "Output": "service_test.go:10: assertion failed\n"},
            {"Action": "fail", "Test": "TestService"},
            {"Action": "fail"},
        ]
        raw = b"".join(json.dumps({"Package": package, **row}).encode() + b"\n" for row in rows)

        def run(command, stdout, stderr):
            stdout.write(raw)
            stderr.write(b"go: plain non-JSON diagnostic\n")
            return subprocess.CompletedProcess(command, 1)

        command = ["test-go", "--package", package, "--test", "TestService"]
        with TemporaryDirectory() as sandbox:
            events = Path(sandbox) / "events.jsonl"
            with patch("sdd.cli.subprocess.run", side_effect=run):
                for flags in ([], ["--events", str(events)]):
                    stderr = StringIO()
                    with redirect_stdout(StringIO()), redirect_stderr(stderr):
                        self.assertEqual(main([*command, *flags, "--", "./..."]), 1)
                    output = stderr.getvalue()
                    self.assertTrue(output.startswith(f"test-go: Test {package!r} 'TestService' failed.\n"))
                    self.assertIn("service_test.go:10: assertion failed", output)
                    self.assertIn("go: plain non-JSON diagnostic", output)
                    self.assertNotIn('"Action"', output)
            self.assertEqual(events.read_bytes(), raw)
            checked = self.invoke(
                "check-go", "--events", str(events), "--exit-code", "1",
                "--package", package, "--test", "TestService",
            )
            self.assertEqual(checked.returncode, 1)
            self.assertIn("service_test.go:10: assertion failed", checked.stderr)
            self.assertNotIn('"Action"', checked.stderr)

    def test_live_go_reports_stderr_when_no_events_and_reports_start_failure(self) -> None:
        from contextlib import redirect_stderr
        from io import StringIO
        from sdd.cli import main

        def run(command, stdout, stderr):
            stderr.write(b"go: no main module found\n")
            return subprocess.CompletedProcess(command, 1)

        command = ["test-go", "--package", "example.org/service", "--test", "TestService"]
        with patch("sdd.cli.subprocess.run", side_effect=run), redirect_stderr(StringIO()) as stderr:
            self.assertEqual(main(command), 1)
            self.assertIn("go: no main module found", stderr.getvalue())
            self.assertIn("did not run", stderr.getvalue())
            self.assertNotIn("Invalid Go JSONL", stderr.getvalue())

        with patch("sdd.cli.subprocess.run", side_effect=FileNotFoundError("go unavailable")):
            with redirect_stderr(StringIO()) as stderr:
                self.assertEqual(main(command), 1)
                self.assertIn("Could not start go test: go unavailable", stderr.getvalue())
