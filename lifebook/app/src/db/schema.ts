/**
 * SQLite schema + migrations.
 *
 * Source of truth: /Users/mattwright/pandora/Obsidian/PROJECTS/Hugh Manatee/
 *                  20-architecture/ARCHITECTURE.md (data-model section).
 *
 * Keep the SQL in that doc and this file in sync. If you change one,
 * change the other in the same PR.
 */

import * as SQLite from "expo-sqlite";

const DB_NAME = "hughmanatee.db";

let _db: SQLite.SQLiteDatabase | null = null;

const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        first_name TEXT NOT NULL,
        birth_year INTEGER,
        hometown TEXT,
        voice_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        duration_sec INTEGER,
        title TEXT,
        anchor_phrase TEXT,
        audio_path TEXT,
        prompt_version TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL,
        speaker TEXT NOT NULL CHECK (speaker IN ('user', 'hugh')),
        text TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        duration_ms INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_turns_session ON turns(session_id, ordinal);

      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('person', 'place', 'object', 'date', 'event')),
        value TEXT NOT NULL,
        first_mentioned_turn INTEGER REFERENCES turns(id)
      );

      CREATE INDEX IF NOT EXISTS idx_entities_session ON entities(session_id);

      CREATE VIRTUAL TABLE IF NOT EXISTS turns_fts USING fts5(
        text, content='turns', content_rowid='id'
      );

      -- Keep FTS in sync with turns
      CREATE TRIGGER IF NOT EXISTS turns_ai AFTER INSERT ON turns BEGIN
        INSERT INTO turns_fts(rowid, text) VALUES (new.id, new.text);
      END;
      CREATE TRIGGER IF NOT EXISTS turns_ad AFTER DELETE ON turns BEGIN
        INSERT INTO turns_fts(turns_fts, rowid, text) VALUES('delete', old.id, old.text);
      END;
      CREATE TRIGGER IF NOT EXISTS turns_au AFTER UPDATE ON turns BEGIN
        INSERT INTO turns_fts(turns_fts, rowid, text) VALUES('delete', old.id, old.text);
        INSERT INTO turns_fts(rowid, text) VALUES (new.id, new.text);
      END;
    `,
  },
];

/**
 * Initialize the database. Idempotent — safe to call on every app start.
 */
export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  for (const m of MIGRATIONS) {
    const row = await db.getFirstAsync<{ version: number }>(
      "SELECT version FROM _migrations WHERE version = ?",
      m.version,
    );
    if (row) continue;
    await db.execAsync(m.sql);
    await db.runAsync(
      "INSERT INTO _migrations (version, applied_at) VALUES (?, ?)",
      m.version,
      Math.floor(Date.now() / 1000),
    );
  }

  _db = db;
  return db;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return _db;
}

/**
 * Danger: wipes ALL app data. Used by the "Delete all data" setting.
 * TODO: also call clearProfile() secure-store key and wipe audio directory
 * from the caller — this only resets SQLite.
 */
export async function nukeDb(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    DELETE FROM entities;
    DELETE FROM turns;
    DELETE FROM sessions;
    DELETE FROM profile;
    DELETE FROM turns_fts;
  `);
}
