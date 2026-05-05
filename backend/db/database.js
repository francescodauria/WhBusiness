const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DB_DIR, 'whbusiness.db'));

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    phone      TEXT    NOT NULL UNIQUE,
    name       TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    wam_id      TEXT    UNIQUE,
    contact_id  INTEGER NOT NULL REFERENCES contacts(id),
    direction   TEXT    NOT NULL CHECK(direction IN ('inbound','outbound')),
    type        TEXT    NOT NULL DEFAULT 'text',
    body        TEXT,
    status      TEXT    NOT NULL DEFAULT 'sent',
    timestamp   INTEGER NOT NULL DEFAULT (unixepoch()),
    raw_payload TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id, timestamp DESC);
`);

// ---------- helpers ----------

function upsertContact(phone, name) {
  const existing = db.prepare('SELECT * FROM contacts WHERE phone = ?').get(phone);
  if (existing) {
    if (name && name !== existing.name) {
      db.prepare('UPDATE contacts SET name = ? WHERE id = ?').run(name, existing.id);
    }
    return db.prepare('SELECT * FROM contacts WHERE id = ?').get(existing.id);
  }
  const info = db.prepare('INSERT INTO contacts (phone, name) VALUES (?, ?)').run(phone, name || null);
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid);
}

function saveMessage({ wam_id, contact_id, direction, type, body, status, timestamp, raw_payload }) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO messages (wam_id, contact_id, direction, type, body, status, timestamp, raw_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(wam_id, contact_id, direction, type, body, status, timestamp, raw_payload);
  return info.lastInsertRowid;
}

function updateMessageStatus(wam_id, status) {
  db.prepare('UPDATE messages SET status = ? WHERE wam_id = ?').run(status, wam_id);
}

function getContacts() {
  return db.prepare(`
    SELECT c.*,
           m.body           AS last_message,
           m.timestamp      AS last_message_at,
           m.direction      AS last_direction,
           COUNT(CASE WHEN m2.direction = 'inbound' AND m2.status = 'received' THEN 1 END) AS unread
    FROM   contacts c
    LEFT JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE contact_id = c.id ORDER BY timestamp DESC LIMIT 1
    )
    LEFT JOIN messages m2 ON m2.contact_id = c.id
    GROUP BY c.id
    ORDER BY last_message_at DESC NULLS LAST
  `).all();
}

function getMessages(contact_id, limit, before) {
  limit = limit || 50;
  if (before) {
    return db.prepare(`
      SELECT * FROM messages WHERE contact_id = ? AND timestamp < ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(contact_id, before, limit).reverse();
  }
  return db.prepare(`
    SELECT * FROM messages WHERE contact_id = ?
    ORDER BY timestamp DESC LIMIT ?
  `).all(contact_id, limit).reverse();
}

function getStats() {
  const total_contacts = db.prepare('SELECT COUNT(*) AS n FROM contacts').get().n;
  const total_messages = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n;
  const inbound        = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE direction='inbound'").get().n;
  const outbound       = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE direction='outbound'").get().n;
  const today_ts       = Math.floor(new Date().setHours(0,0,0,0) / 1000);
  const today_msgs     = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE timestamp >= ?').get(today_ts).n;
  return { total_contacts, total_messages, inbound, outbound, today_msgs };
}

module.exports = { db, upsertContact, saveMessage, updateMessageStatus, getContacts, getMessages, getStats };
