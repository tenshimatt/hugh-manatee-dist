#!/usr/bin/env node
/**
 * Converts ../agent/question-library.yaml to src/data/question-library.json.
 * Run at build time so the Worker bundle doesn't need a YAML parser at runtime.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const yamlPath = resolve(here, "../../agent/question-library.yaml");
const outPath = resolve(here, "../src/data/question-library.json");

const raw = readFileSync(yamlPath, "utf8");
const parsed = parse(raw);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n");

console.log(`Wrote ${outPath}`);
