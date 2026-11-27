import json
import tempfile
import unittest
from pathlib import Path

from sdd.go_evidence import check_go, summarize_go


PACKAGE = "example.org/orders"
OTHER_PACKAGE = "example.org/other"


def event(action, test=None, package=PACKAGE, **fields):
    value = {"Action": action, "Package": package, **fields}
    if test is not None:
        value["Test"] = test
    return value


def successful_run(test="TestExport", package=PACKAGE):
    return [
        event("start", package=package),
        event("run", test, package),
        event("pass", test, package),
        event("pass", package=package),
    ]


class GoEvidenceTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "go-test.jsonl"

    def check(self, events, tests=("TestExport",), exit_code=0):
        self.path.write_text(
            "\n".join(json.dumps(item, ensure_ascii=False) for item in events),
            encoding="utf-8",
        )
        return check_go(self.path, exit_code, PACKAGE, tests)

    def test_accepts_interleaved_packages_unicode_parallel_subtest_and_unrelated_skips(self):
        subtest = "TestExport/中文_文件/全部"
        events = [
            {"Action": "build-output", "ImportPath": OTHER_PACKAGE, "Output": "compiler note\n"},
            event("start"),
            event("start", package=OTHER_PACKAGE),
            event("run", "TestExport"),
            event("attr", "TestExport", Key="scope", Value="all"),
            event("run", subtest),
            event("pause", subtest),
            event("skip", package=OTHER_PACKAGE),
            event("run", "TestExport/optional"),
            event("skip", "TestExport/optional"),
            event("cont", subtest),
            event("artifacts", subtest, Path="/tmp/test-artifacts"),
            event("output", subtest, Output="actual output\n\n"),
            event("pass", subtest, Elapsed=0),
            event("pass", "TestExport"),
            event("pass"),
        ]
        raw = "\r\n \r\n".join(json.dumps(item, ensure_ascii=False) for item in events)
        self.path.write_bytes(("\r\n" + raw + "\n \t\n").encode("utf-8"))
        self.assertEqual(check_go(str(self.path), 0, PACKAGE, ["TestExport", subtest]), [])
        self.assertIn("did not run", " ".join(check_go(self.path, 0, PACKAGE, ["路径"])))

    def test_accepts_native_cache_replay_and_complete_final_record(self):
        events = successful_run()
        events.insert(-1, event("output", Output=f"ok\t{PACKAGE}\t(cached)\n"))
        self.assertEqual(self.check(events), [])

    def test_rejects_nonzero_exit_even_with_passing_events(self):
        self.assertIn("exit code 0", " ".join(self.check(successful_run(), exit_code=1)))

    def test_rejects_zero_hit_and_does_not_count_output_or_other_packages(self):
        events = [
            event("start"),
            event("output", "TestExport", Output="testing: warning: no tests to run\n"),
            event("pass"),
        ] + successful_run(package=OTHER_PACKAGE)
        failures = self.check(events)
        self.assertIn("Required test 'TestExport' did not run", " ".join(failures))
        self.assertIn("Required package", " ".join(self.check(successful_run(package=OTHER_PACKAGE))))

    def test_rejects_required_test_skip_and_required_package_skip(self):
        events = successful_run()
        events[2]["Action"] = "skip"
        self.assertIn("was skipped", " ".join(self.check(events)))
        self.assertIn("did not pass", " ".join(self.check([event("start"), event("skip")])))

    def test_rejects_test_package_and_build_failure_anywhere_in_report(self):
        events = successful_run() + [
            {"Action": "build-fail", "ImportPath": f"{OTHER_PACKAGE} [{OTHER_PACKAGE}.test]"},
            event("start", package=OTHER_PACKAGE),
            event("run", "TestOther", OTHER_PACKAGE),
            event("fail", "TestOther", OTHER_PACKAGE),
            event("fail", package=OTHER_PACKAGE, FailedBuild=OTHER_PACKAGE),
        ]
        failures = " ".join(self.check(events))
        self.assertIn("Build failed", failures)
        self.assertIn(f"Test '{OTHER_PACKAGE}' 'TestOther' failed", failures)
        self.assertIn(f"Package '{OTHER_PACKAGE}' failed", failures)

    def test_rejects_incomplete_package_and_test_lifecycles(self):
        cases = [
            (successful_run()[:-1], "has no terminal result"),
            (successful_run()[1:], "has no start event"),
            (successful_run() + [event("start", package=OTHER_PACKAGE)], "has no terminal result"),
            ([event("start"), event("pass", "TestExport"), event("pass")], "without a unique active run"),
            (successful_run()[:-1] + [event("run", "TestUnfinished"), event("pass")], "TestUnfinished"),
        ]
        for events, diagnostic in cases:
            with self.subTest(diagnostic=diagnostic, events=events):
                self.assertIn(diagnostic, " ".join(self.check(events)))

    def test_rejects_ambiguous_test_and_package_repetitions(self):
        run = successful_run()
        for events, diagnostic in [
            (run + run, "started more than once"),
            (run[:3] + run[1:], "ran more than once"),
            (run[:3] + run[2:], "without a unique active run"),
            (run + [event("pass")], "events after its terminal result"),
        ]:
            with self.subTest(diagnostic=diagnostic):
                self.assertIn(diagnostic, " ".join(self.check(events)))

    def test_rejects_bad_json_utf8_and_event_shapes_even_after_target_passed(self):
        for broken in [
            b'{"Action":"pass"',
            b'{"Action":"pass","Action":"fail"}',
            b'{"Action":"output","Output":NaN}',
            b'\xff',
            b'[]',
            b'{"Action":true}',
            b'{"Action":"build-fail"}',
            b'{"Action":"build-output","ImportPath":"other","Output":[]}',
            b'{"Action":"run","Package":"other","Test":4}',
            b'{"Action":"unknown","Package":"other"}',
        ]:
            with self.subTest(broken=broken):
                self.check(successful_run())
                with self.path.open("ab") as report:
                    report.write(b"\n" + broken)
                failures = check_go(self.path, 0, PACKAGE, ["TestExport"])
                self.assertIn("Invalid Go JSONL at line 5", " ".join(failures))

    def test_benchmark_output_does_not_supply_passing_required_tests(self):
        events = successful_run()[:-1] + [
            event("run", "BenchmarkExport"),
            event("output", Output="BenchmarkExport-10\t1\t200 ns/op\n"),
            event("run", "BenchmarkLogging"),
            event("bench", "BenchmarkLogging"),
            event("pass"),
        ]
        self.assertEqual(self.check(events), [])
        self.assertIn("did not pass", " ".join(self.check(events, ["BenchmarkExport"])))

    def test_rejects_empty_report_missing_file_and_missing_target_tests(self):
        self.assertIn("Could not read", " ".join(check_go(self.path, 0, PACKAGE, ["TestExport"])))
        self.assertIn("Required package", " ".join(self.check([])))
        self.assertIn("At least one", " ".join(self.check(successful_run(), [])))
        self.assertIn("At least one", " ".join(self.check(successful_run(), "TestExport")))

    def test_summary_prioritizes_assertions_and_keeps_successful_output_out(self):
        failing = "TestExport/not_a_contract"
        events = successful_run("TestUnrelated", OTHER_PACKAGE)
        events[2:2] = [
            event("output", "TestUnrelated", OTHER_PACKAGE, Output="unrelated successful output\n")
        ] * 1000
        events += [
            event("start"),
            event("run", "TestExport"),
            event("run", failing),
            event("output", failing, Output="=== RUN   TestExport/not_a_contract\n"),
            *(event("output", failing, Output=f"debug {index}\n") for index in range(10)),
            event("output", failing, OutputType="error", Output="policy_test.go:42: wanted 1, got 2\n"),
            event("output", failing, OutputType="error-continue", Output="  comparison detail\n"),
            *(event("output", failing, Output=f"debug {index}\n") for index in range(10, 20)),
            event("fail", failing),
            event("run", "TestExport/optional"),
            event("output", "TestExport/optional", Output="user skipped optional test\n"),
            event("skip", "TestExport/optional"),
            event("fail", "TestExport"),
            event("fail"),
        ]
        self.check(events)
        lines = summarize_go(self.path, 1, PACKAGE, ["TestMissing", "TestExport/optional"])
        self.assertEqual(lines[:3], [
            f"Test {PACKAGE!r} {failing!r} failed.",
            "  policy_test.go:42: wanted 1, got 2",
            "  comparison detail",
        ])
        self.assertIn(f"Package {PACKAGE!r} failed.", lines)
        summary = "\n".join(lines)
        self.assertIn("Required test 'TestMissing' did not run", summary)
        self.assertIn("Required test 'TestExport/optional' was skipped", summary)
        self.assertNotIn("successful output", summary)
        self.assertNotIn("user skipped", summary)
        self.assertNotIn("debug", summary)
        self.assertNotIn("=== RUN", summary)

    def test_summary_bounds_build_and_legacy_test_output_and_deduplicates_subjects(self):
        import_path = f"{OTHER_PACKAGE} [{OTHER_PACKAGE}.test]"
        build_o = {"Action": "build-output", "ImportPath": import_path}
        build_f = {"Action": "build-fail", "ImportPath": import_path}
        events = successful_run() + [
            {**build_o, "Output": "./other.go:19:5: undefined: something\n"},
            build_f,
            {**build_o, "Output": "ambiguous duplicate build report\n"},
            build_f,
            event("start", package=OTHER_PACKAGE),
            event("run", "TestAppend", OTHER_PACKAGE),
            event("output", "TestAppend", OTHER_PACKAGE, Output="=== RUN   TestAppend\n"),
            *(event("output", "TestAppend", OTHER_PACKAGE, Output=f"logs {i} {'x' * 800}\n")
              for i in range(30)),
            event("output", "TestAppend", OTHER_PACKAGE, Output="other_test.go:30: assertion failed\n"),
            event("output", "TestAppend", OTHER_PACKAGE, Output="--- FAIL: TestAppend (0.01s)\n"),
            event("fail", "TestAppend", OTHER_PACKAGE),
            event("fail", "TestAppend", OTHER_PACKAGE),
            event("fail", package=OTHER_PACKAGE, FailedBuild=import_path),
        ]
        self.check(events)
        lines = summarize_go(self.path, 1, PACKAGE, ["TestExport"])
        self.assertEqual(lines.count(f"Build failed for {import_path!r}."), 1)
        self.assertEqual(lines.count(f"Test {OTHER_PACKAGE!r} 'TestAppend' failed."), 1)
        self.assertIn("  ./other.go:19:5: undefined: something", lines)
        self.assertIn("  other_test.go:30: assertion failed", lines)
        self.assertIn("  …", lines)
        self.assertLessEqual(max(map(len, lines)), 323)
        summary = "\n".join(lines)
        self.assertNotIn("ambiguous duplicate build report", summary)
        self.assertNotIn("--- FAIL:", summary)
        self.assertIn("without a unique active run", summary)

    def test_summary_keeps_native_aborted_test_context_without_claiming_test_failed(self):
        self.check([
            event("start"),
            event("run", "TestExport"),
            event("output", "TestExport", Output="panic: test timed out after 50ms\n"),
            event("fail"),
        ])
        lines = summarize_go(self.path, 1, PACKAGE, ["TestExport"])
        self.assertIn(f"Package {PACKAGE!r} failed.", lines)
        self.assertIn(f"Test {PACKAGE!r} 'TestExport' has no terminal result.", lines)
        self.assertIn("  panic: test timed out after 50ms", lines)
        self.assertNotIn(f"Test {PACKAGE!r} 'TestExport' failed.", lines)

    def test_summary_bounds_many_failures_and_stderr_without_changing_checker(self):
        events = successful_run() + [event("start", package=OTHER_PACKAGE)]
        for index in range(30):
            test = f"TestFailure{index}"
            events.extend([event("run", test, OTHER_PACKAGE), event("fail", test, OTHER_PACKAGE)])
        events.extend([
            event("fail", package=OTHER_PACKAGE),
            {"Action": "build-output", "ImportPath": "example.org/broken", "Output": "undefined: variable\n"},
            {"Action": "build-fail", "ImportPath": "example.org/broken"},
        ])
        self.assertGreater(len(self.check(events)), 30)
        lines = summarize_go(
            self.path, 1, PACKAGE, [f"TestMissing{i}" for i in range(30)],
            [f"go: diagnostic {i}\n".encode() for i in range(100)],
        )
        self.assertLess(len(lines), 30)
        self.assertIn(f"Package {OTHER_PACKAGE!r} failed.", lines)
        self.assertIn("  undefined: variable", lines)
        self.assertIn("  go: diagnostic 0", lines)
        self.assertIn("  go: diagnostic 99", lines)
        self.assertIn("Additional Go evidence failures omitted.", lines)


if __name__ == "__main__":
    unittest.main()
