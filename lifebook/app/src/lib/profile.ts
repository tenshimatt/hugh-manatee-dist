/**
 * User profile shape and helpers.
 *
 * Single-row profile stored in SQLite (id=1). Voice + agent IDs come from the
 * onboarding voice picker and are used by the ElevenLabs CAI client.
 */

export interface Profile {
  id: 1;
  first_name: string;
  birth_year: number | null;
  hometown: string | null;
  voice_id: string;
  agent_id: string;
  created_at: number;
  updated_at: number;
}

export interface ProfileDraft {
  first_name: string;
  birth_year?: number | null;
  hometown?: string | null;
  voice_id: string;
  agent_id: string;
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Available voice choices shown on the onboarding voice picker.
 *
 * TODO: replace these placeholder IDs with real ElevenLabs voice + agent IDs
 * once the Worker /agent/config endpoint is wired up.
 * Real mapping should come from agent/question-library.yaml or a Worker
 * metadata endpoint so we don't hardcode voice marketing copy in the app.
 */
export interface VoiceOption {
  voice_id: string;
  agent_id: string;
  label: string;
  description: string;
}

export const PLACEHOLDER_VOICES: VoiceOption[] = [
  {
    voice_id: "voice-warm-female-01",
    agent_id: "agent-warm-female-01",
    label: "Nora",
    description: "Warm, calm. A friend over tea.",
  },
  {
    voice_id: "voice-warm-male-01",
    agent_id: "agent-warm-male-01",
    label: "Arthur",
    description: "Steady, gentle. An older friend.",
  },
  {
    voice_id: "voice-bright-female-01",
    agent_id: "agent-bright-female-01",
    label: "June",
    description: "Brighter, curious. Asks good questions.",
  },
];
