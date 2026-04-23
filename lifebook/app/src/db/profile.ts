/**
 * Profile CRUD. Single row, id=1.
 *
 * The voice_id + agent_id are also cached in expo-secure-store so the
 * conversation screen can connect to ElevenLabs without a round-trip
 * through SQLite on cold start.
 */

import * as SecureStore from "expo-secure-store";
import { getDb } from "./schema";
import type { Profile, ProfileDraft } from "../lib/profile";
import { now } from "../lib/profile";

const SECURE_VOICE_KEY = "hugh.voice_id";
const SECURE_AGENT_KEY = "hugh.agent_id";

export async function getProfile(): Promise<Profile | null> {
  const db = getDb();
  const row = await db.getFirstAsync<Profile>(
    "SELECT * FROM profile WHERE id = 1",
  );
  return row ?? null;
}

export async function setProfile(draft: ProfileDraft): Promise<Profile> {
  const db = getDb();
  const t = now();
  const existing = await getProfile();

  if (existing) {
    await db.runAsync(
      `UPDATE profile
       SET first_name = ?, birth_year = ?, hometown = ?, voice_id = ?, agent_id = ?, updated_at = ?
       WHERE id = 1`,
      draft.first_name,
      draft.birth_year ?? null,
      draft.hometown ?? null,
      draft.voice_id,
      draft.agent_id,
      t,
    );
  } else {
    await db.runAsync(
      `INSERT INTO profile (id, first_name, birth_year, hometown, voice_id, agent_id, created_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      draft.first_name,
      draft.birth_year ?? null,
      draft.hometown ?? null,
      draft.voice_id,
      draft.agent_id,
      t,
      t,
    );
  }

  await SecureStore.setItemAsync(SECURE_VOICE_KEY, draft.voice_id);
  await SecureStore.setItemAsync(SECURE_AGENT_KEY, draft.agent_id);

  const saved = await getProfile();
  if (!saved) throw new Error("Profile save failed");
  return saved;
}

export async function clearProfile(): Promise<void> {
  const db = getDb();
  await db.runAsync("DELETE FROM profile");
  await SecureStore.deleteItemAsync(SECURE_VOICE_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(SECURE_AGENT_KEY).catch(() => {});
}

export async function getCachedVoiceIds(): Promise<{
  voice_id: string | null;
  agent_id: string | null;
}> {
  const [v, a] = await Promise.all([
    SecureStore.getItemAsync(SECURE_VOICE_KEY),
    SecureStore.getItemAsync(SECURE_AGENT_KEY),
  ]);
  return { voice_id: v, agent_id: a };
}
