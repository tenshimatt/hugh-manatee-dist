# Hugh — agent config

The voice, rules, and prompt library for **Hugh**, the single AI voice in the Hugh Manatee app.

These files are the source of truth for Hugh's behavior. The mobile app does not hardcode prompts; it loads them from here (or from a hosted copy synced from here) and passes them to an ElevenLabs Conversational AI agent at runtime.

## Files

| File | What it is | Who consumes it |
|---|---|---|
| `system-prompt.md` | Hugh's persona, voice, and rules. Loaded as the agent system prompt. | ElevenLabs agent |
| `opening-scripts.md` | First-session and returning-user openers. | App, passed as first agent turn |
| `question-library.yaml` | Structured prompt seeds by theme × life stage, plus era hooks. | App, filtered and passed as runtime context |
| `follow-up-rules.md` | How Hugh decides what to ask next. Reference + guidance — incorporated into the system prompt. | ElevenLabs agent (merged into system prompt at build) |

## How it wires up at runtime

1. App starts a session. Collects local state: `first_name`, `birth_year`, `hometown`, `last_memory_topic`, user's opening preference (*recent* / *past* / *no preference*).
2. App filters `question-library.yaml`:
   - Picks a theme cluster (e.g. `home_and_place` + `school_years`) based on preference and birth year.
   - Selects 3–5 seed prompts from the cluster.
   - Looks up `era_hooks` for the user's childhood decade.
3. App opens ElevenLabs agent session with:
   - Agent ID (configured per voice)
   - System prompt = `system-prompt.md` + merged excerpts from `follow-up-rules.md`
   - Dynamic context variables:
     ```json
     {
       "first_name": "...",
       "birth_year": 1948,
       "hometown": "...",
       "last_memory_topic": "...",
       "suggested_seeds": ["...", "..."],
       "era_hooks": ["...", "..."]
     }
     ```
   - First agent utterance = the appropriate opener from `opening-scripts.md` (rendered client-side, not generated — we want the opener deterministic).
4. Agent takes over. User talks. Agent responds with Hugh's voice.
5. App streams the transcript to local SQLite. Nothing leaves the device beyond the ElevenLabs voice stream itself.

## Design principles (why the prompts look like this)

- **Audio-only.** No lists, no formatting, no screen affordances. Every Hugh utterance has to stand alone as speech.
- **Elder-first.** Short turns, long pauses, sensory prompts over feeling prompts, no pressure, no fake enthusiasm.
- **Concrete over conceptual.** Hugh asks about objects, sounds, smells, places, people by name. Not about themes, arcs, or meaning.
- **The user sets the pace.** Hugh waits. Hugh does not fill silence. Hugh does not push.
- **Privacy, stated once.** Not a recurring reassurance. Said plainly at the opener, then never again unless asked.

## Voice selection (the 3–5 curated ElevenLabs voices)

TBD — we want to pick 3–5 voices that feel right for Hugh: warm, unhurried, genders balanced, accents varied. Per-voice agent ID will live in the app config, not here. Candidates and rationale will be added once we've done listening tests with real elderly users.

## Iteration

The prompts are the product. Treat this directory like code:

- Changes go through PRs with a rationale.
- Tone and word-choice changes need at least one voice-test before merge — the ear catches things the eye misses.
- Major persona changes bump `system-prompt.md`'s implicit version. The app should log which version of the prompt was used for each session, so we can correlate prompt changes with transcript quality.

## What belongs here vs. in code

- **Here:** persona, voice, prompts, rules.
- **Not here:** voice IDs, ElevenLabs API keys, app routing, storage logic, collage generation. Those live in the app and backend.

If you're adding something and you're not sure, ask: "is this about what Hugh says, or about how the app runs?" Say → here. Run → code.
