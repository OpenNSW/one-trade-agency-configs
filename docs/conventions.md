# Conventions

## Top-level shape

Every JSON file under `agency-configs/<agency_name>/task-configs/` is a single JSON object (`{...}`). No arrays, no primitives, no nulls at the root. In Go terms, every file deserialises to `map[string]any`. This is enforced by the validator (rule R1).

## The `taskCode` field

Every task config has a top-level `taskCode` field — a non-empty string that uniquely identifies the task **within its agency**. Consumers use `taskCode` to look up a task config via `agency-configs/<agency>/manifest.json#tasks`.

**Uniqueness is agency-scoped.** The same `taskCode` value may appear in two different agencies without conflict. The naming convention below is not machine-checked — it is a contributor-facing guideline.

## Naming convention (guideline)

```
<agency_prefix>_<purpose>_<version>
```

Plain English:

- Lowercase `snake_case` throughout (`[a-z0-9_]`). No hyphens. No uppercase.
- First segment is the **agency prefix** matching the directory name under the repo root (e.g. `fcau`).
- The middle segment is a `snake_case` description of what the task represents.
- The final segment is a version suffix: `v1`, `v2`, etc. Always include a version — it allows breaking changes without renaming stable task codes.

### Examples

| `taskCode` | Agency | What it represents |
|---|---|---|
| `fcau_application_review_v1` | `fcau` | Officer review of a health certificate application |
| `fcau_sample_decision_v1` | `fcau` | Officer decides whether a sample is required |
| `fcau_sample_assessment_v1` | `fcau` | Officer records manual sample assessment results |

## Task config schema

```jsonc
{
  "taskCode": "string",        // unique within this agency; matches filename stem
  "meta": {
    "title": "string",         // human-readable task name
    "description": "string"    // what this task does
  },
  "forms": {
    "view": "string",          // one-trade-templates ID for the applicant/trader view form
    "review": "string"         // one-trade-templates ID for the officer/reviewer form
  }
}
```

Form IDs (`forms.view`, `forms.review`) are template IDs looked up in the [`one-trade-templates` manifest](https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main/manifest.json). See [architecture.md](architecture.md) for the cross-repo relationship.

## File naming

```
<task_code>.json
```

The filename stem must match the `taskCode` value inside the file. There is one file per task — no subdirectories inside `task-configs/`.

## Agency directory naming

Agency directories use lowercase identifiers that match the agency's short name (e.g. `fcau/`, `npqs/`). The presence of a `task-configs/` subdirectory is what marks a directory as an agency — all tooling auto-discovers agencies this way.

## Adding a new task

1. Create `agency-configs/<agency_name>/task-configs/<task_code>.json` following the schema above.
2. Set `forms.view` and `forms.review` to IDs that exist in the [one-trade-templates manifest](https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main/manifest.json).
3. Run `npm run check` — this validates the file, regenerates the manifest, and confirms everything is committed.
4. Commit both the new config and the updated `agency-configs/<agency_name>/manifest.json`.

## Adding a new agency

1. Create `agency-configs/<agency_name>/task-configs/` at the repo root.
2. Add at least one task config JSON file.
3. Run `npm run manifest` to generate `agency-configs/<agency_name>/manifest.json`.
4. Commit the new directory and its manifest.

No changes to scripts are required — agencies are auto-discovered.
