# Hugh Manatee — factory rules

> **Loaded into every Archon workflow context.** How the autonomous
> implement / review / merge process works for Hugh Manatee. Operating
> constraints, not product scope. Product scope is `mission.md`.

## Hard rules — NO EXCEPTIONS

1. **Every Plane ticket created by the workflow carries `PRD: §X.Y`** at
   the top of its description. The `plane-create-ticket.sh` script
   refuses to file a ticket without `prd_section`. This is the audit
   trail anchor. If a ticket has no `§` to cite, the WORK is wrong, not
   the script.

2. **Tests written BEFORE implementation.** For every Plane ticket, a
   Maestro YAML (iOS e2e) and/or Jest unit spec is committed and verified
   RED before any implementation code is written. The implement-loop
   cannot edit test files.

3. **Three human gates** — `prd`, `plan`, `pr`. Each pauses up to 24h
   waiting for `:approve:` (Plane comment). Reject by commenting
   `:reject: <reason>`.

4. **No code-only changes without a passing test** — no PR opens unless
   the smoke suite passes inside the workflow's worktree. CI re-runs on
   the PR.

5. **No commits to `main` except via PR.** The workflow always opens a
   PR; it does not push directly. Branch name is `archon/<feature-slug>`.

6. **Workflow-created PRs reference both Plane + PRD** in the body —
   `Plane tickets: HUGH-N` and `PRD: §X.Y`.

## Implementation conduct

- Single agent at a time on a given worktree. No parallel writes.
- Architecture-reviewer + security-reviewer run **in parallel** during
  the plan phase, then results merge back into a single gate-plan.
- Implement loop is bounded to **25 cycles** (test → code → test). If
  not green by then, the loop stops with `archon-failed` and surfaces
  the failure.
- The implement loop **cannot edit** files in `tests/`, `.maestro/`,
  `mission.md`, `factory-rules.md`, `CLAUDE.md`, or
  `docs/`. Those are spec, not code.

## Review conduct

- Architect-reviewer challenges the plan — DOES NOT co-sign. Outputs a
  list of concerns at severity blocker / major / minor. Empty list is
  acceptable; pretending to find issues is not.
- Security-reviewer focuses ONLY on: auth-token handling, secrets in
  logs, SQLite injection, ElevenLabs API key exposure, App Store
  privacy-manifest compliance, GDPR-adjacent on-device data practices.
  Does not opine on style.
- Final-reviewer (post-implement) checks: every concern raised pre-plan
  was addressed OR explicitly deferred to a follow-up Plane ticket.

## Merge conduct

- The workflow's `gate-pr` step pauses for human approval before
  opening the PR. If the human comments `:reject:`, the workflow halts
  and the branch is preserved for manual fix-up.
- Auto-merge is NOT enabled. Human merges via GitHub UI after CI green.

## Cost discipline

- Architect-review: Opus 4.7. All workers: DeepSeek-V4-Pro or Flash.
  Don't escalate models unless the lower model demonstrably produces
  wrong output.
- A workflow run that exceeds **$10 in tokens** auto-halts and posts to
  the Plane ticket.

## Logging + audit

- Every workflow run logs to `/var/log/archon/hugh-manatee-<ticket>.log`
  on CT 111
- Every gate decision (approve/reject + reason) is posted as a Plane
  comment so the audit trail stays in the ticket
- The PR description summarises the full chain: PRD §, plan file,
  Plane tickets, test files, validation results, reviewer concerns

## Stop conditions

The workflow halts immediately and labels the ticket `archon-failed` if:

- Mission triage rejects (out-of-scope)
- A gate is rejected by the human
- Tests can't be made green within 25 implement cycles
- Final review verdict is `needs-changes` and there's no obvious fix
- Any script exits non-zero with a message starting `✗`
- Expo build fails (EAS CLI exit non-zero)

## When this file changes

Same governance as `mission.md`. Material edits → discussion → edit →
update memory rule `archon_hugh_manatee_workflow.md` to match.

**Last reviewed: 2026-04-27**
