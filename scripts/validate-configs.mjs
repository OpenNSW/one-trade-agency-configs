#!/usr/bin/env node
// Validates every task config under agencies/<agency>/task-configs/. Re-run
// after any change to task configs, or use `npm run check` which includes this.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const AGENCIES_DIR = "agency-configs";

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
const failures = [];
let totalConfigs = 0;

for (const agency of agencies) {
  const taskConfigsDir = join(AGENCIES_DIR, agency, "task-configs");
  const files = listJsonFiles(taskConfigsDir);
  const seenTaskCodes = new Map();

  for (const file of files) {
    totalConfigs++;
    let obj;

    // R1: valid JSON
    try {
      obj = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      failures.push(`${file}: R1: not valid JSON: ${err.message}`);
      continue;
    }

    // R1: top-level must be a plain object (map[string]any)
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
      failures.push(`${file}: R1: top-level value must be a JSON object`);
      continue;
    }

    // R2: taskCode must be present and a non-empty string
    if (!("taskCode" in obj)) {
      failures.push(`${file}: R2: missing "taskCode" field`);
      continue;
    }
    if (typeof obj.taskCode !== "string" || obj.taskCode.length === 0) {
      failures.push(
        `${file}: R2: "taskCode" must be a non-empty string (got ${JSON.stringify(obj.taskCode)})`
      );
      continue;
    }

    // R3: taskCode must be unique within the agency
    if (seenTaskCodes.has(obj.taskCode)) {
      failures.push(
        `${file}: R3: duplicate taskCode "${obj.taskCode}" (also in ${seenTaskCodes.get(obj.taskCode)})`
      );
    } else {
      seenTaskCodes.set(obj.taskCode, file);
    }
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(f);
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}

const agencyWord = agencies.length === 1 ? "agency" : "agencies";
console.log(`OK: ${totalConfigs} task config(s) across ${agencies.length} ${agencyWord} validated.`);
