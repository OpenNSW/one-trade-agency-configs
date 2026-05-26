#!/usr/bin/env node
// Generates agencies/<agency>/manifest.json for every agency under agencies/.
// The manifest is the entry point for downstream consumers — it provides a
// stable taskCode->path index. Re-run after any change to task configs.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AGENCIES_DIR = "agency-configs";
const VERSION = "0.0.0-dev";

function discoverAgencies() {
  return readdirSync(AGENCIES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function listJsonFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => join(dir, e.name))
    .sort();
}

const agencies = discoverAgencies();

for (const agency of agencies) {
  const taskConfigsDir = join(AGENCIES_DIR, agency, "task-configs");
  const files = listJsonFiles(taskConfigsDir);

  const tasks = {};
  for (const file of files) {
    const obj = JSON.parse(readFileSync(file, "utf8"));
    if (typeof obj?.taskCode === "string" && obj.taskCode.length > 0) {
      tasks[obj.taskCode] = file.replaceAll("\\", "/");
    }
  }

  // Sort keys for stable output
  const sortedTasks = {};
  for (const key of Object.keys(tasks).sort()) sortedTasks[key] = tasks[key];

  const manifest = {
    version: VERSION,
    generated: "scripts/generate-manifest.mjs",
    agency,
    tasks: sortedTasks,
  };

  const outputPath = join(AGENCIES_DIR, agency, "manifest.json");
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${outputPath}: ${Object.keys(sortedTasks).length} task(s)`);
}
