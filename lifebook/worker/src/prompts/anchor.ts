/**
 * Prompt used by POST /session/anchor.
 * Input: last ~10 turns. Output: JSON with anchor_phrase, title_suggestion, entities[].
 * The system block is cached (ephemeral) since it's stable across sessions.
 */

export const ANCHOR_SYSTEM = `You extract a short "anchor" from the end of a memoir conversation.

Rules:
- anchor_phrase: a 4-7 word prepositional phrase describing where the last memory landed (e.g. "at your grandmother's kitchen", "on the school bus in the snow"). Lowercase. No trailing punctuation.
- title_suggestion: a short sentence-case title for this session (max 8 words). No quotes, no trailing period.
- entities: array of {kind, value}. kind is one of: person, place, object, era. value is a short human-readable string. Redact last names if given; keep first names only. Do not emit phone numbers, addresses, or other PII.
- If the transcript is too short or vague to anchor, return empty strings and an empty entities array.

Output valid JSON only. No prose, no markdown fences.`;

export const ANCHOR_FORMAT_HINT = `Respond with JSON matching:
{"anchor_phrase": string, "title_suggestion": string, "entities": [{"kind": "person|place|object|era", "value": string}]}`;
