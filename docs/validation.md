# Validation

## The three checks

`npm run check` runs four steps in sequence. All must pass for CI to be green.

| Step | Command | What it checks |
|------|---------|----------------|
| Formatting | `npm run lint` | Prettier 3 — indentation, line endings, final newlines, multiline arrays |
| Structural validation | `npm run validate` | R1–R3 rules on every task config JSON |
| Manifest generation | `npm run manifest` | Regenerates `<agency>/manifest.json` for every agency |
| Manifest sync | `node scripts/check-manifests.mjs` | Confirms all manifests are committed and up-to-date |

## Prettier configuration

Formatting is enforced by Prettier 3 via `.prettierrc.json`:

- 2-space indentation, LF line endings
- Final newline required
- Arrays are always multi-line (via `prettier-plugin-multiline-arrays`)

Run `npm run format` to auto-fix formatting. `npm run lint` reports violations without writing.

`<agency>/manifest.json` files are excluded from Prettier (listed in `.prettierignore`) because they are generator-owned — reformatting them manually would cause the manifest-sync check to fail.

## The three structural rules

### R1 — Valid JSON object

Every file under `agency-configs/<agency_name>/task-configs/` must be:
1. Valid JSON (parseable without error)
2. A plain object at the top level — not an array, not `null`, not a primitive

```json
// ✗ fails R1 — array at root
["fcau_sample_decision_v1"]

// ✗ fails R1 — not valid JSON
{ taskCode: "fcau_sample_decision_v1" }

// ✓ passes R1
{ "taskCode": "fcau_sample_decision_v1", ... }
```

### R2 — `taskCode` is mandatory

Every task config must have a `taskCode` field that is a non-empty string.

```json
// ✗ fails R2 — missing taskCode
{ "meta": { "title": "Sample Decision" } }

// ✗ fails R2 — taskCode is not a string
{ "taskCode": 42 }

// ✗ fails R2 — taskCode is empty
{ "taskCode": "" }

// ✓ passes R2
{ "taskCode": "fcau_sample_decision_v1" }
```

### R3 — `taskCode` unique within agency

Within a single agency's `task-configs/` directory, every `taskCode` must be unique. The same `taskCode` may appear in a different agency without conflict.

```
// ✗ fails R3 — two files in fcau/ share the same taskCode
agency-configs/fcau/task-configs/foo.json       → { "taskCode": "fcau_sample_decision_v1" }
agency-configs/fcau/task-configs/bar.json       → { "taskCode": "fcau_sample_decision_v1" }  ← duplicate

// ✓ passes R3 — same taskCode in different agencies is fine
agency-configs/fcau/task-configs/foo.json       → { "taskCode": "fcau_sample_decision_v1" }
agency-configs/npqs/task-configs/foo.json       → { "taskCode": "fcau_sample_decision_v1" }
```

## Manifest sync check

After `npm run manifest` regenerates `agency-configs/<agency>/manifest.json`, `scripts/check-manifests.mjs` runs `git status --porcelain -- 'agency-configs/*/manifest.json'` and fails if any manifest is modified or untracked. This catches two cases that `git diff --exit-code` would miss:

- A task config was changed but `npm run manifest` was not re-run before committing
- A new agency was added (new `<agency>/manifest.json` is untracked) but the manifest was never committed

## Notable gaps

The validator deliberately does not:

- Check that `forms.view` / `forms.review` IDs exist in the `one-trade-templates` manifest (no network call at validate time)
- Enforce naming conventions from [conventions.md](conventions.md) — those are contributor guidelines, not machine-checked rules
- Validate the internal structure of `meta`, `forms`, or any other fields beyond `taskCode`
