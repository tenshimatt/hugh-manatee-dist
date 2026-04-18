#!/usr/bin/env bun
const HOST = process.env.JWM_SHELL_URL || "http://localhost:3100";

async function main() {
  const body = {
    observation:
      "Saw kerf drift on laser 2, three brackets showed edge burn, we pulled them off the line, operator said the nozzle sounded off",
    workstation: "flat-laser-2",
    part: "JWM-BRK-11G-0043",
    operation: "flat-laser cut",
    wo: "WO-2026-00218",
  };
  console.log(`POST ${HOST}/api/ncr/draft`);
  const t0 = Date.now();
  const res = await fetch(`${HOST}/api/ncr/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const dt = Date.now() - t0;
  const data = await res.json();
  console.log(`status=${res.status} latency=${dt}ms`);
  console.log(JSON.stringify(data, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
