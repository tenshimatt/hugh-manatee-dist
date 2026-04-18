#!/usr/bin/env bun
import { readFileSync } from "fs";
import { resolve } from "path";

const HOST = process.env.JWM_SHELL_URL || "http://localhost:3100";
const PDF_DIR = "/Users/mattwright/pandora/jwm-demo/estimates";
const PDFS = [
  "estimate-001-architectural-stair.pdf",
  "estimate-002-processing-brackets.pdf",
  "estimate-003-mixed-facade.pdf",
];

async function runOne(pdfName: string) {
  const path = resolve(PDF_DIR, pdfName);
  const buf = readFileSync(path);
  console.log(`\n=== ${pdfName} (${buf.length} bytes) ===`);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: "application/pdf" }), pdfName);

  const t0 = Date.now();
  const res = await fetch(`${HOST}/api/estimator/extract`, {
    method: "POST",
    body: form,
  });
  const dt = Date.now() - t0;
  const data = await res.json();
  console.log(`status=${res.status} latency=${dt}ms mode=${data.mode}`);
  console.log(`customer=${data.customer} project=${data.project_name} division=${data.division}`);
  console.log(`assemblies=${data.summary?.assemblies} line_items=${data.summary?.line_items}`);
  console.log(`estimated_total=$${data.summary?.estimated_total}`);
  const totalParts =
    data.assemblies?.reduce((s: number, a: { children: unknown[] }) => s + a.children.length, 0) ?? 0;
  console.log(`total parts across assemblies: ${totalParts}`);
  if (data.raw?.totals) console.log(`raw totals:`, data.raw.totals);
  if (data.error) console.log(`ERROR: ${data.error}`);
}

async function main() {
  for (const p of PDFS) {
    try {
      await runOne(p);
    } catch (e) {
      console.error(`failed on ${p}:`, e);
    }
  }
}
main();
