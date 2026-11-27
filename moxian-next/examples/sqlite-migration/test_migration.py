import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class PriorityMigration(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        db = Path(temp.name) / "issues.db"
        self.old = sqlite3.connect(db, isolation_level=None)
        self.new = sqlite3.connect(db, isolation_level=None)
        self.addCleanup(self.old.close)
        self.addCleanup(self.new.close)
        self.old.executescript(
            "CREATE TABLE ticket (id INTEGER PRIMARY KEY, title TEXT NOT NULL);"
            "INSERT INTO ticket (id, title) VALUES (1, 'Existing');"
        )

    def apply(self, filename):
        try:
            self.new.executescript((ROOT / filename).read_text(encoding="utf-8"))
        except sqlite3.DatabaseError:
            self.new.rollback()
            raise

    def test_old_and_new_clients_during_and_after_upgrade(self):
        self.apply("001_expand.sql")
        self.old.execute("INSERT INTO ticket (id, title) VALUES (2, 'Old writer')")
        self.new.execute(
            "INSERT INTO ticket (id, title, priority) VALUES (3, 'New writer', 'urgent')"
        )
        self.assertEqual(
            self.new.execute(
                "SELECT COALESCE(priority, 'normal') FROM ticket WHERE id = 2"
            ).fetchone(),
            ("normal",),
        )
        self.apply("002_constrain.sql")
        self.old.execute("INSERT INTO ticket (id, title) VALUES (4, 'Old after upgrade')")
        self.assertEqual(
            self.old.execute("SELECT title FROM ticket WHERE id = 3").fetchone(),
            ("New writer",),
        )
        self.assertEqual(
            self.new.execute("SELECT id, priority FROM ticket ORDER BY id").fetchall(),
            [(1, "normal"), (2, "normal"), (3, "urgent"), (4, "normal")],
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.new.execute("UPDATE ticket SET priority='unknown' WHERE id=1")

    def test_unknown_historical_value_aborts_without_losing_data(self):
        self.apply("001_expand.sql")
        self.new.execute("UPDATE ticket SET priority='legacy' WHERE id=1")
        with self.assertRaises(sqlite3.IntegrityError):
            self.apply("002_constrain.sql")
        self.assertEqual(self.old.execute("SELECT * FROM ticket").fetchall(),
                         [(1, "Existing", "legacy")])
        self.assertIsNone(self.old.execute(
            "SELECT name FROM sqlite_master WHERE name='ticket_v2'"
        ).fetchone())
        self.new.execute("UPDATE ticket SET priority='urgent' WHERE id=1")
        self.apply("002_constrain.sql")
        self.assertEqual(self.old.execute("SELECT priority FROM ticket").fetchone(),
                         ("urgent",))
