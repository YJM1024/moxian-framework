import tempfile
import unittest
from pathlib import Path

from sdd.contracts import section


class ContractTests(unittest.TestCase):
    def test_reads_conditions_and_nested_sections_including_code(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "spec.md"
            block = ('## PRD-1 Files\n<a id="files"></a>\nSuccess.\n'
                     '### Recovery\nRetry.\n~~~~text\n## Not a heading\n~~~~\n'
                     '\nReject a missing session.\n')
            path.write_text('# Contract\n' + block + '## PRD-10 Other\nUnrelated.\n')
            for key in ('files', 'PRD-1', 'PRD-1 Files'):
                self.assertEqual(section(f'{path}#{key}'), (2, block))
            with self.assertRaisesRegex(ValueError, '0 个章节'):
                section(f'{path}#Not a heading')

    def test_missing_and_ambiguous_require_a_better_reference(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'spec.md'
            path.write_text('## 1 Scope\nA\n## 1 Transfer\nB\n')
            with self.assertRaisesRegex(ValueError, '2 个章节'):
                section(f'{path}#1')
            self.assertEqual(section(f'{path}#1 Transfer')[1], '## 1 Transfer\nB\n')
