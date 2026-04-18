#!/usr/bin/env bun
const HOST = process.env.JWM_SHELL_URL || "http://localhost:3100";

async function main() {
  console.log(`GET ${HOST}/api/anomaly`);
  const t0 = Date.now();
  const res = await fetch(`${HOST}/api/anomaly`);
  const dt = Date.now() - t0;
  const data = await res.json();
  console.log(`status=${res.status} latency=${dt}ms mode=${data.mode}`);
  console.log(JSON.stringify(data, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
