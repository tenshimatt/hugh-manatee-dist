/**
 * Sessions + turns CRUD.
 *
 * A "session" is one open-and-talk. Turns are appended live from the
 * ElevenLabs transcript stream. The session ends when the user stops
 * or the app closes the conversation screen.
 */

import * as uuid from "uuid";
import { getDb } from "./schema";

export interface Session {
  id: string;
  started_at: number;
  ended_at: number | null;
  duration_sec: number | null;
  title: string | null;
  anchor_phrase: string | null;
  audio_path: string | null;
  prompt_version: string;
}

export interface Turn {
  id: number;
  session_id: string;
  ordinal: number;
  speaker: "user" | "hugh";
  text: string;
  started_at: number;
  duration_ms: number | null;
}

export interface SessionSummary {
  id: string;
  started_at: number;
  duration_sec: number | null;
  title: string | null;
  turn_count: number;
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export async function createSession(opts: {
  prompt_version: string;
  audio_path?: string | null;
}): Promise<Session> {
  const db = getDb();
  const id = uuid.v4() as string;
  const started_at = nowSec();
  await db.runAsync(
    `INSERT INTO sessions (id, started_at, prompt_version, audio_path)
     VALUES (?, ?, ?, ?)`,
    id,
    started_at,
    opts.prompt_version,
    opts.audio_path ?? null,
  );
  return {
    id,
    started_at,
    ended_at: null,
    duration_sec: null,
    title: null,
    anchor_phrase: null,
    audio_path: opts.audio_path ?? null,
    prompt_version: opts.prompt_version,
  };
}

export async function appendTurn(
  session_id: string,
  speaker: "user" | "hugh",
  text: string,
  duration_ms?: number,
): Promise<void> {
  const db = getDb();
  const { ordinal } = (await db.getFirstAsync<{ ordinal: number }>(
    "SELECT COALESCE(MAX(ordinal), -1) + 1 AS ordinal FROM turns WHERE session_id = ?",
    session_id,
  )) ?? { ordinal: 0 };

  await db.runAsync(
    `INSERT INTO turns (session_id, ordinal, speaker, text, started_at, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
    session_id,
    ordinal,
    speaker,
    text,
    nowSec(),
    duration_ms ?? null,
  );
}

export async function endSession(
  id: string,
  opts: { title?: string; anchor?: string; audio_path?: string } = {},
): Promise<void> {
  const db = getDb();
  const row = await db.getFirstAsync<{ started_at: number }>(
    "SELECT started_at FROM sessions WHERE id = ?",
    id,
  );
  const ended = nowSec();
  const duration = row ? ended - row.started_at : null;

  await db.runAsync(
    `UPDATE sessions
     SET ended_at = ?,
         duration_sec = ?,
         title = COALESCE(?, title),
         anchor_phrase = COALESCE(?, anchor_phrase),
         audio_path = COALESCE(?, audio_path)
     WHERE id = ?`,
    ended,
    duration,
    opts.title ?? null,
    opts.anchor ?? null,
    opts.audio_path ?? null,
    id,
  );
}

export async function listSessions(): Promise<SessionSummary[]> {
  const db = getDb();
  const rows = await db.getAllAsync<SessionSummary>(
    `SELECT s.id, s.started_at, s.duration_sec, s.title,
            (SELECT COUNT(*) FROM turns t WHERE t.session_id = s.id) AS turn_count
     FROM sessions s
     WHERE s.ended_at IS NOT NULL
     ORDER BY s.started_at DESC`,
  );
  return rows;
}

export async function getSession(
  id: string,
): Promise<{ session: Session; turns: Turn[] } | null> {
  const db = getDb();
  const session = await db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE id = ?",
    id,
  );
  if (!session) return null;
  const turns = await db.getAllAsync<Turn>(
    "SELECT * FROM turns WHERE session_id = ? ORDER BY ordinal ASC",
    id,
  );
  return { session, turns };
}

export async function deleteSession(id: string): Promise<void> {
  const db = getDb();
  // FK cascade handles turns + entities
  await db.runAsync("DELETE FROM sessions WHERE id = ?", id);
}

export async function getLastSessionAnchor(): Promise<string | null> {
  const db = getDb();
  const row = await db.getFirstAsync<{ anchor_phrase: string | null }>(
    `SELECT anchor_phrase FROM sessions
     WHERE ended_at IS NOT NULL AND anchor_phrase IS NOT NULL
     ORDER BY ended_at DESC LIMIT 1`,
  );
  return row?.anchor_phrase ?? null;
}
