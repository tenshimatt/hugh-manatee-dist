# 05 — Voice listening-test protocol

How to pick the final 3 voices for Hugh from 5 candidates, using actual elderly testers. This is the only gate between "placeholder voices in `PLACEHOLDER_VOICES`" and real production voice IDs.

**Budget:** 1 afternoon. **Testers:** 3–5 people age 60+. **Output:** 3 validated voice IDs + a short write-up.

---

## Why it matters

The voice *is* the product. Hugh's warmth, pace, and accent decide whether a 72-year-old opens the app a second time. We cannot pick these from a designer's ear or from reading voice-library descriptions. Subtle things — a rising lilt that reads "sales-y" to an 85-year-old, an accent that evokes a doctor's office, a pace that feels rushed to someone with mild hearing loss — only surface in real listening.

## Before the session

1. **Shortlist 5 candidates.** Per runbook `04-elevenlabs-setup.md`, save 5 voices to your ElevenLabs VoiceLab covering: 1 warm female (RP/neutral), 1 steady male (American Midwest or Scottish), 1 bright female (Canadian or Southern US), 1 older male (grandfather quality), 1 wild card.

2. **Create one CAI agent per candidate**, each loaded with Hugh's system prompt. This is already described in `04-elevenlabs-setup.md` step 3.

3. **Generate 30-second samples per voice.** For each agent, run a brief session and record the audio output locally. The script:
   - **Opener** (from `agent/opening-scripts.md`, first-session variant): *"Hi {name}. I'm Hugh. It's nice to meet you. Everything we talk about stays here on your phone — just between us. Whenever you're ready, tell me about a memory."*
   - **Sensory follow-up** (from `agent/question-library.yaml`, senses_and_weather): *"What did winter sound like where you grew up?"*
   - **Family follow-up** (from question-library early_childhood): *"What did your mother's hands look like?"*

   Three short utterances, one breath each. Don't concatenate into one long take — leave natural pauses.

4. **Label the files neutrally.** `sample-01.mp3` through `sample-05.mp3`. Do not name them "warm-female-RP" etc. — you'll bias yourself and accidentally the tester.

5. **Randomize the order per tester.** Use a different play-order for each person, tracked in a small spreadsheet.

6. **Prepare the environment.** Quiet room, reasonable speaker (not phone speaker — the frequencies that make a voice feel "warm" die on tinny speakers). Aim for the listening conditions an elderly user would realistically have.

## The session — 10 minutes per tester

1. **Set expectations briefly.** "I'm working on an app that records memories using a gentle AI voice. I'd like you to listen to five short samples and tell me how they feel. There's no right answer."

2. **Play each sample once.** Don't announce which number. Let it finish. Wait 2 seconds.

3. **Ask the single question:** *"Would you trust this voice with your memories?"*
   - If the answer is "yes" / "no", ask: *"What made you say that?"*
   - Note the first-word answer AND body language. A quick "yes" with leaning-in is not the same as a delayed "I suppose".
   - Score each voice on a 1–5 scale (1 = "I'd close the app" → 5 = "I'd talk to this for an hour").

4. **Do not give your opinion.** Do not react to theirs. Smile neutrally between samples. Any nudging contaminates the signal.

5. **At the end, ask one comparison question:** *"If you could only have one, which?"* Note their pick.

## After

1. **Aggregate the scores.** Top 3 voices by median score = production set. If there's a tie for #3, take the one with the higher "if you could only have one" count. If still tied, keep both and drop the wild card.

2. **Kill the losers.** Delete the discarded voices from ElevenLabs VoiceLab so they don't confuse the codebase later.

3. **Update the app.** Replace `PLACEHOLDER_VOICES` in `app/src/lib/profile.ts` with the three surviving voice_id + agent_id + label + one-line description. Descriptions should echo the quality the testers named (e.g. "Like a librarian I trust").

4. **Update the Worker.** Update the `ELEVENLABS_AGENTS` secret (JSON map) so the Worker can resolve the three production voice_ids.

5. **Write up the session** at `50-research/YYYY-MM-DD-voice-listening-test.md`:
   - Tester demographics (age range, gender balance, any relevant context — hearing-aid users? native non-English speakers? etc.)
   - Median score per voice
   - Surprise answers (the ones that made you update your mental model)
   - What you killed and why

## Gotchas

- **Do not let your ear overrule theirs.** You will hear Hugh through the lens of having built the app. Testers hear him cold. Their reaction is the one that matters.

- **Don't use family members who want to help you.** They'll be charitable. Recruit people who will tell you a voice is annoying.

- **Don't A/B against a human voice.** It's not a fair comparison and distorts scores.

- **Watch out for accent bias.** Testers may rate a familiar accent higher regardless of voice quality. Note the tester's own accent/region and correct for it in the write-up.

- **Avoid recording testers.** Feels surveilled, changes answers. A notebook is enough.

- **Time-bound ruthlessly.** 10 min/tester × 5 testers = 50 min. If you start negotiating with a tester about the samples ("well, also if you think about it…"), you've lost the signal. Thank them and move on.

## When to redo this

- Major ElevenLabs platform update that changes voice rendering.
- If beta-user session-length drops sharply after a voice config change (i.e. the voice is the regression).
- When adding a new accent/language for a new market.
