# AI Flow Tests

Scripts that exercise the 4 AI endpoints against a running dev server.

## Prereqs

1. Start the shell dev server (it reads `.env.local` automatically):

   ```bash
   cd /Users/mattwright/pandora/jwm-demo/shell
   bun run dev   # listens on :3100
   ```

2. Confirm the TopBar shows "AI: Live" (or curl `http://localhost:3100/api/ai/status`).

## Run all

```bash
cd /Users/mattwright/pandora/jwm-demo/shell
bun scripts/test-ai/query.ts
bun scripts/test-ai/estimator.ts
bun scripts/test-ai/ncr.ts
bun scripts/test-ai/anomaly.ts
```

## Overriding host

All scripts honor `JWM_SHELL_URL` (default `http://localhost:3100`).
