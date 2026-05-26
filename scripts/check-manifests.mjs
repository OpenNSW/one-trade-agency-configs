#!/usr/bin/env node
// Verifies that all agency manifest.json files are committed and in sync with
// the task configs on disk. Catches both modifications to existing manifests
// and entirely new untracked manifests (e.g. a new agency added without
// committing its manifest). Run via `npm run check`.

import { execSync } from "node:child_process";

const status = execSync("git status --porcelain -- 'agency-configs/*/manifest.json'")
  .toString()
  .trim();

if (status) {
  console.error(
    "Error: manifest.json files are out of sync. Run 'npm run manifest' and commit."
  );
  console.error(status);
  process.exit(1);
}
