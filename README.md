# one-trade-agency-configs

Source-of-truth JSON task configurations for OneTrade agency integrations. Pure data — no application code, no runtime.

Form schemas live in [one-trade-templates](https://github.com/OpenNSW/one-trade-templates). Task configs in this repo reference those templates by ID.

## Repository Layout

```
agency-configs/
└── <agency_name>/
    ├── manifest.json          ← generated index for this agency
    └── task-configs/
        └── <task_code>.json   ← one file per task
```

## Agencies

| Agency | Directory |
|--------|-----------|
| FCAU   | `agency-configs/fcau/` |

## Quick start

```bash
npm install

npm run check    # lint + validate + manifest in sync (full CI gate)
npm run format   # auto-format all JSON files
```

## Documentation

| Doc | Contents |
|-----|---------|
| [docs/architecture.md](docs/architecture.md) | Repo structure, relationship to `one-trade-templates` |
| [docs/conventions.md](docs/conventions.md) | `taskCode` naming, file naming, how to add tasks and agencies |
| [docs/manifest.md](docs/manifest.md) | Per-agency `manifest.json` schema and consumer usage |
| [docs/consumption.md](docs/consumption.md) | Code samples (bash, Node, Python, Go) for fetching configs |
| [docs/validation.md](docs/validation.md) | R1–R3 rules, Prettier setup, manifest sync check |

## License

Apache License 2.0
