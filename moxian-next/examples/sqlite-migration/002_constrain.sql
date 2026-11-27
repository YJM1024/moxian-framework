-- Run from a connection with no active transaction. On error the caller rolls back.
BEGIN IMMEDIATE;
CREATE TABLE ticket_v2 (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent'))
);
INSERT INTO ticket_v2 (id, title, priority)
    SELECT id, title, COALESCE(priority, 'normal') FROM ticket;
DROP TABLE ticket;
ALTER TABLE ticket_v2 RENAME TO ticket;
COMMIT;
