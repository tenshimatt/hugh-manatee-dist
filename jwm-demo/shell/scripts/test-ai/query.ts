#!/usr/bin/env bun
const HOST = process.env.JWM_SHELL_URL || "http://localhost:3100";

async function main() {
  const question = "Which architectural jobs are at risk this week?";
  console.log(`POST ${HOST}/api/ai/query`);
  console.log(`Q: ${question}`);

  // Non-streaming JSON (what AIChat currently uses)
  const res = await fetch(`${HOST}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  console.log("\n--- JSON response ---");
  console.log(JSON.stringify(data, null, 2));

  // SSE streaming
  console.log("\n--- SSE streaming ---");
  const sse = await fetch(`${HOST}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ question }),
  });
  const reader = sse.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let tokens = 0;
  process.stdout.write("> ");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value);
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const j = JSON.parse(line.slice(5).trim());
        if (j.delta) {
          process.stdout.write(j.delta);
          tokens++;
        }
        if (j.done) {
          console.log(`\n[stream done] usage:`, j.usage);
        }
      }
    }
  }
  console.log(`\ntotal streamed chunks: ${tokens}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
