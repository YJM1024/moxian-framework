import json
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest


PROJECT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("git"), "requires Git")
class ImpactTests(unittest.TestCase):
    def setUp(self) -> None:
        fixture = TemporaryDirectory()
        self.addCleanup(fixture.cleanup)
        self.root = Path(fixture.name).resolve() / "repo"
        self.root.mkdir()
        self.policy = self.root.parent / "impact.json"
        self.log = self.root.parent / "checks.jsonl"
        self.git("init", "-q")
        self.write("payments/source.py", "payment\n")
        self.write("consumer/test_api.py", "consumer\n")
        self.write("batch/task.py", "batch\n")
        self.write("docs/api.md", "# 1. Orders API\n<a id=\"orders\"></a>\n\n## History\n\n# Returns\n")
        self.write("docs/openapi.yaml", "paths: {}\n")
        self.write("ci/settings.json", "{}\n")
        self.write(".gitignore", "ignored.txt\n")
        self.git("add", ".")
        self.commit()

        self.rules = [
            {"paths": ["payments/"], "contracts": ["docs/api.md#orders"], "checks": ["payments"]},
            {"paths": ["consumer/"], "contracts": ["docs/api.md#1."], "checks": ["consumer", "alias"]},
            {"paths": ["batch/"], "contracts": ["docs/api.md#returns"], "checks": ["batch"]},
        ]
        self.checks = {
            "payments": self.native("payments", "payments"),
            "consumer": self.native("consumer", "consumer"),
            "alias": self.native("consumer", "consumer"),
            "batch": self.native(".", "batch"),
        }
        self.save_policy()

    def git(self, *args: str) -> str:
        return subprocess.run(
            ["git", *args], cwd=self.root, check=True, capture_output=True, encoding="utf-8",
        ).stdout

    def commit(self) -> None:
        self.git(
            "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
            "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "fixture",
        )

    def write(self, path: str, content: str) -> None:
        file = self.root / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(content, encoding="utf-8")

    def native(self, cwd: str, label: str, code: int = 0) -> dict:
        command = (
            "import json, pathlib, sys\n"
            "with pathlib.Path(sys.argv[1]).open('a') as log:\n"
            "    print(json.dumps([pathlib.Path.cwd().name, *sys.argv[3:]]), file=log)\n"
            "raise SystemExit(int(sys.argv[2]))\n"
        )
        return {
            "cwd": cwd,
            "argv": [sys.executable, "-c", command, str(self.log), str(code), label, "", "$(echo literal)"],
        }

    def save_policy(self) -> None:
        self.policy.write_text(
            json.dumps({"checks": self.checks, "rules": self.rules, "shared": ["ci/"]}),
            encoding="utf-8",
        )

    def invoke(
        self, *opts: str, base: str = "HEAD", root: Path | None = None,
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-B", "-m", "sdd", "impact",
             "--root", str(root or self.root), "--base", base, "--policy", str(self.policy), *opts],
            cwd=PROJECT, capture_output=True, encoding="utf-8", timeout=10,
        )

    def results(self) -> list[list[str]]:
        return [json.loads(line) for line in self.log.read_text(encoding="utf-8").splitlines()]

    def test_source_selects_contract_consumers_and_runs_equal_commands_once(self) -> None:
        self.write("payments/source.py", "changed\n")
        plan = self.invoke(root=self.root / "payments")
        self.assertEqual(plan.returncode, 0, plan.stderr)
        self.assertIn("契约 'docs/api.md#orders' -> alias, consumer, payments", plan.stdout)
        self.assertNotIn("检查 batch", plan.stdout)
        self.assertFalse(self.log.exists())

        executed = self.invoke("--run")
        self.assertEqual(executed.returncode, 0, executed.stderr)
        self.assertEqual(self.results(), [
            ["payments", "payments", "", "$(echo literal)"],
            ["consumer", "consumer", "", "$(echo literal)"],
        ])

    def test_compares_final_tree_to_explicit_base_with_staged_then_reverted_edit(self) -> None:
        self.write("payments/source.py", "staged\n")
        self.git("add", "payments/source.py")
        self.write("payments/source.py", "payment\n")
        self.write("ignored.txt", "ignored\n")
        clean = self.invoke("--run")
        self.assertEqual(clean.returncode, 0, clean.stderr)
        self.assertIn("没有变更", clean.stdout)
        self.assertFalse(self.log.exists())

        old_base = self.git("rev-parse", "HEAD").strip()
        self.git("reset", "HEAD", "--", "payments/source.py")
        self.write("batch/task.py", "committed change\n")
        self.git("add", "batch/task.py")
        self.commit()
        checked = self.invoke("--run", base=old_base)
        self.assertEqual(checked.returncode, 0, checked.stderr)
        self.assertIn(f"基线 {old_base}", checked.stdout)
        self.assertEqual([result[1] for result in self.results()], ["batch"])

    def test_staged_rename_covers_both_sides_and_tracks_add_delete_and_untracked(self) -> None:
        self.git("mv", "payments/source.py", "batch/moved.py")
        (self.root / "consumer/test_api.py").unlink()
        self.write("consumer/staged.py", "staged add\n")
        self.git("add", "consumer/staged.py")
        untracked = "payments/untracked\nfile.py" if sys.platform != "win32" else "payments/untracked file.py"
        self.write(untracked, "untracked\n")
        plan = self.invoke()
        self.assertEqual(plan.returncode, 0, plan.stderr)
        self.assertIn("R100 'payments/source.py' -> 'batch/moved.py'", plan.stdout)
        self.assertIn("D 'consumer/test_api.py'", plan.stdout)
        self.assertIn("A 'consumer/staged.py'", plan.stdout)
        self.assertIn(f"? {untracked!r}", plan.stdout)
        self.assertIn("路径 'payments/source.py' -> payments", plan.stdout)
        self.assertIn("路径 'batch/moved.py' -> batch", plan.stdout)
        self.assertNotIn("回退", plan.stdout)

    def test_unstaged_rename_selects_removed_and_untracked_sides(self) -> None:
        (self.root / "payments/source.py").rename(self.root / "batch/moved.py")
        executed = self.invoke("--run")
        self.assertEqual(executed.returncode, 0, executed.stderr)
        self.assertIn("D 'payments/source.py'", executed.stdout)
        self.assertIn("? 'batch/moved.py'", executed.stdout)
        self.assertEqual([result[1] for result in self.results()], ["payments", "consumer", "batch"])

    def test_section_consumers_include_subsections(self) -> None:
        self.rules[1]["contracts"] = ["docs/api.md#History"]
        self.save_policy()
        self.write("payments/source.py", "changed\n")
        executed = self.invoke("--run")
        self.assertEqual(executed.returncode, 0, executed.stderr)
        self.assertEqual([result[1] for result in self.results()], ["payments", "consumer"])

    def test_whole_file_contract_can_select_without_source_path_rule(self) -> None:
        self.rules.append({"contracts": ["docs/openapi.yaml"], "checks": ["consumer"]})
        self.save_policy()
        self.write("docs/openapi.yaml", "paths: {/orders: {}}\n")
        executed = self.invoke("--run")
        self.assertEqual(executed.returncode, 0, executed.stderr)
        self.assertNotIn("回退", executed.stdout)
        self.assertIn("契约 'docs/openapi.yaml' -> consumer", executed.stdout)
        self.assertEqual([result[1] for result in self.results()], ["consumer"])

    def test_shared_unknown_and_ambiguous_contract_changes_run_full_native_set(self) -> None:
        for path, reason in (
            ("ci/settings.json", "共享路径"),
            ("ci-extra/unmapped.py", "未映射路径"),
            ("docs/api.md", "影响章节未确定"),
        ):
            with self.subTest(path=path):
                file = self.root / path
                original = file.read_text(encoding="utf-8") if file.exists() else None
                self.write(path, "changed\n")
                result = self.invoke("--run")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("回退到策略声明的全量检查", result.stdout)
                self.assertIn(reason, result.stdout)
                self.assertEqual([row[1] for row in self.results()], ["payments", "consumer", "batch"])
                self.log.unlink()
                if original is None:
                    file.unlink()
                else:
                    self.write(path, original)

    def test_full_run_preserves_failure_and_continues_next_native_check(self) -> None:
        self.checks["payments"] = self.native("payments", "payments", 9)
        self.save_policy()
        self.write("ci/settings.json", "changed\n")
        result = self.invoke("--run")
        self.assertEqual(result.returncode, 9, result.stderr)
        self.assertIn("检查 payments 退出码 9", result.stdout)
        self.assertEqual([row[1] for row in self.results()], ["payments", "consumer", "batch"])

    def test_unresolved_merge_runs_full_checks_even_when_file_matches_head(self) -> None:
        self.git("checkout", "-qb", "other")
        self.write("payments/source.py", "other\n")
        self.git("add", "payments/source.py")
        self.commit()
        self.git("checkout", "-q", "-")
        self.write("payments/source.py", "current\n")
        self.git("add", "payments/source.py")
        self.commit()
        with self.assertRaises(subprocess.CalledProcessError):
            self.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
                     "merge", "other")
        self.assertIn("UU payments/source.py", self.git("status", "--porcelain"))

        for contents in (None, "current\n"):
            with self.subTest(contents=contents):
                self.log.unlink(missing_ok=True)
                if contents is not None:
                    self.write("payments/source.py", contents)
                result = self.invoke("--run")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("回退到策略声明的全量检查", result.stdout)
                self.assertIn("U 'payments/source.py'", result.stdout)
                self.assertEqual([row[1] for row in self.results()], ["payments", "consumer", "batch"])

        self.log.unlink(missing_ok=True)
        self.git("add", "payments/source.py")
        resolved = self.invoke("--run")
        self.assertEqual(resolved.returncode, 0, resolved.stderr)
        self.assertIn("没有变更", resolved.stdout)
        self.assertFalse(self.log.exists())

    def test_missing_contract_file_falls_back(self) -> None:
        self.rules[0]["contracts"] = ["docs/missing.md#orders"]
        self.save_policy()
        self.write("payments/source.py", "changed\n")
        result = self.invoke("--run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("无法定位契约文件 'docs/missing.md#orders'", result.stdout)
        self.assertEqual([row[1] for row in self.results()], ["payments", "consumer", "batch"])

    def test_invalid_sibling_anchor_and_unknown_anchor_format_fall_back(self) -> None:
        self.write("payments/source.py", "changed\n")
        for rule, locator in (
            (self.rules[1], "docs/api.md#ordres"),
            (self.rules[0], "docs/openapi.yaml#/paths/orders"),
        ):
            with self.subTest(locator=locator):
                original = rule["contracts"]
                rule["contracts"] = [locator]
                self.save_policy()
                result = self.invoke("--run")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn(f"无法确认契约章节 {locator!r}", result.stdout)
                self.assertEqual([row[1] for row in self.results()], ["payments", "consumer", "batch"])
                self.log.unlink()
                rule["contracts"] = original

    def test_bad_base_config_and_command_fail_explicitly(self) -> None:
        bad_base = self.invoke("--run", base="bad-base")
        self.assertEqual(bad_base.returncode, 2)
        self.assertIn("bad-base", bad_base.stderr)
        self.assertFalse(self.log.exists())

        original_checks = self.rules[0]["checks"]
        self.rules[0]["checks"] = ["missing-check"]
        self.save_policy()
        bad_config = self.invoke("--run")
        self.assertEqual(bad_config.returncode, 2)
        self.assertIn("missing-check", bad_config.stderr)
        self.assertFalse(self.log.exists())

        self.rules[0]["checks"] = original_checks
        self.checks["payments"]["argv"] = [str(self.root / "missing-executable")]
        self.save_policy()
        self.write("payments/source.py", "changed\n")
        failed_command = self.invoke("--run")
        self.assertEqual(failed_command.returncode, 127)
        self.assertIn("无法启动检查 payments", failed_command.stderr)
        self.assertEqual([row[1] for row in self.results()], ["consumer"])
