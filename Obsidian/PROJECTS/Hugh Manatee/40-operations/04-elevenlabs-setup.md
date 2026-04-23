# 04 — ElevenLabs Conversational AI setup

How to stand up the ElevenLabs agents that give Hugh his voice. This is a one-time setup that every beta tester depends on.

## What you'll have at the end

- An ElevenLabs account on a plan that includes Conversational AI
- 3–5 saved voices in your VoiceLab (Hugh candidates)
- One CAI agent per voice, each loaded with Hugh's system prompt
- An `ELEVENLABS_API_KEY` + `ELEVENLABS_AGENTS` JSON, stored as Worker secrets

## Cost awareness — read before clicking

ElevenLabs Conversational AI is **priced per minute of voice interaction**. Check the current rate at [elevenlabs.io/pricing](https://elevenlabs.io/pricing) — typically **$0.08–0.12/minute** depending on plan. Hugh's target usage is ~15 minutes/day per active user.

Napkin math: 15 min/day × 30 days = 450 min/mo × $0.10 = **~$45/month per active user**. This is not sustainable as a free app. A pricing decision ([[PRD#10-open-questions]]) has to happen before inviting beta testers beyond close family.

## Step-by-step

### 1. Account + plan (10 min)

1. Go to [elevenlabs.io](https://elevenlabs.io) and sign up.
2. Subscribe to a plan that includes **Conversational AI**. As of 2026, CAI requires the **Creator tier or above** ($22/mo entry). Free tier does not include CAI.
3. Verify the account. Add billing.

### 2. Pick candidate voices (20 min)

1. Go to **VoiceLab** → **Voice Library** ([elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library)).
2. Filter: *Use case: Conversational*. Sort by relevance.
3. Listen for these qualities — Hugh is:
   - **Warm** without being syrupy
   - **Unhurried** (this is huge — if the voice sounds rushed in previews, it'll feel frantic in a real session)
   - **Distinct in age** (not youth-cast; Hugh sounds like a gentle ~40–55 y/o adult, not a 20-something)
4. Aim for **5 candidates** covering:
   - Female, warm, RP/neutral British or American
   - Male, steady, American Midwest or Scottish/Irish
   - Female, brighter, Canadian or Southern US
   - Male, older, British or American — a "grandfather" quality
   - Wild card — whatever surprises you
5. Click **Add to VoiceLab** on each. That copies them into your workspace so you can reference a stable voice_id.
6. Note the `voice_id` of each (shown in VoiceLab → pick voice → Settings).

### 3. Create a CAI agent per voice (10 min × 3–5)

For each voice:

1. Go to **Conversational AI** → **Agents** ([elevenlabs.io/app/conversational-ai](https://elevenlabs.io/app/conversational-ai)) → **Create Agent**.
2. **Name:** `Hugh — <voice name>` (e.g. `Hugh — Nora`, `Hugh — Arthur`).
3. **Voice:** pick the corresponding VoiceLab entry.
4. **LLM:** pick the lowest-latency streaming option available to your plan. As of 2026-04, good choices:
   - **Claude Sonnet 4.6** (best turn-taking quality, ~400ms first token)
   - **GPT-4o** (comparable latency, slightly more verbose)
   - **Gemini Flash** (cheaper, sometimes over-eager)

   Start with Claude Sonnet 4.6. If latency is > 800ms in your region, try GPT-4o.
5. **First message:** leave EMPTY. We render the deterministic opener client-side (see `agent/opening-scripts.md`). Don't let the agent generate it.
6. **System prompt:** paste the contents of `/Users/mattwright/pandora/lifebook/agent/system-prompt.md`. Then add a second block titled `# Follow-up rules` with the first ~40 lines of `agent/follow-up-rules.md` (the single rule + entity-types + pause rules). Save.
7. **Dynamic variables:** declare these so the app can pass per-session context:
   - `first_name` (string)
   - `birth_year` (number, optional)
   - `hometown` (string, optional)
   - `last_memory_topic` (string, optional)
   - `suggested_seeds` (array of strings, optional)
   - `era_hooks` (array of strings, optional)
8. **Safety settings:** if offered, enable strict content-safety and disable self-harm redirection override (we handle that in the prompt, gently).
9. **Retention:** set transcript retention to **0 days** if your plan supports it (Enterprise currently). On Creator/Pro, document the retention window in the app's privacy policy.
10. **Save**. Copy the `agent_id`.

### 4. Build the voice → agent map

Create a JSON object mapping each voice_id to its agent_id:

```json
{
  "voice-warm-female-01": "agent_abc123...",
  "voice-warm-male-01": "agent_def456...",
  "voice-bright-female-01": "agent_ghi789..."
}
```

This becomes the `ELEVENLABS_AGENTS` Worker secret (stored as a JSON string).

### 5. Generate an API key (2 min)

1. **Profile → API Keys → Create API Key.**
2. Name: `hugh-manatee-worker`.
3. **Permissions:** Conversational AI read + write (needed to fetch signed session URLs).
4. Copy the key immediately — you can't re-view it.

### 6. Set Worker secrets (5 min)

From `/Users/mattwright/pandora/lifebook/worker/`:

```
npx wrangler secret put ELEVENLABS_API_KEY        # paste the key
npx wrangler secret put ELEVENLABS_AGENTS         # paste the JSON map
```

Verify:
```
npx wrangler secret list
```

### 7. Smoke test (10 min)

1. `cd /Users/mattwright/pandora/lifebook/worker && npx wrangler dev`
2. In another shell:
   ```
   curl -X POST http://localhost:8787/agent/config \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Matt",
       "birth_year": 1982,
       "hometown": "Glasgow",
       "voice_id": "voice-warm-female-01"
     }'
   ```
3. You should see `{ agent_id, signed_url, first_turn, runtime_context }`.
4. `signed_url` should be a `wss://api.elevenlabs.io/...` URL with a signature query param.
5. `first_turn` should start "Hi Matt. I'm Hugh. It's nice to meet you. ..."

If `signed_url` is missing or empty, check the ElevenLabs API key permissions.

## Listening test protocol (before locking 3 voices for beta)

Run this with 3–5 people in the target demographic (age 60+):

1. Record a 30-second voice sample per candidate:
   - The opener from `agent/opening-scripts.md` (first-ever session)
   - Two typical follow-ups from `agent/question-library.yaml` (pick from `senses_and_weather` and `family` → `early_childhood`)
2. Play samples in random order. Don't tell the tester which is which.
3. Ask ONE question: *"Would you trust this voice with your memories?"*
4. Note: body language matters as much as the answer. A smile and leaning in = yes. A polite "it's fine" = no.
5. Keep the top 3. Delete the losers from VoiceLab so they don't confuse future dev.

Only after the listening test should the voices in `app/src/lib/profile.ts`'s `PLACEHOLDER_VOICES` be replaced with real voice_id/agent_id values.

## Troubleshooting

- **"Invalid agent_id"** — you pasted a voice_id instead. Agent IDs start with `agent_`.
- **First turn audio is half a second late** — the app is probably rendering the opener text and then also playing the agent's first message. Make sure step 3.5 (first message empty) is set on every agent.
- **Interruptions don't work** — barge-in is on by default in CAI. If it's off, check agent settings → Conversation behavior → Allow user interruptions.
- **Transcript returns English words even when user speaks another language** — set the agent language or enable auto-detect in agent settings.

## When you re-do this

The ElevenLabs API and UI change. If any step doesn't match what you see on screen:

1. Find the equivalent step by name, not by path.
2. Update this runbook with the new path + date + your initials.
3. Keep the "why" paragraphs — only the "where to click" parts rot.
