# Consumption

## Pick a consumption pattern

| Pattern | Best for | Setup |
|---------|---------|-------|
| Local checkout + env var | Active dev where both repos change together | Clone this repo; point `ONETRADE_CONFIGS_PATH` at it |
| Raw URL on `main` | Dev environments without local disk access (CI, preview deploys) | `curl https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main/...` |
| Raw URL pinned to commit SHA | Staging environments needing reproducibility | Same URL with a `<sha>` instead of `main` |
| Tagged tarball (post-1.0) | Production | `curl -L .../archive/refs/tags/vX.Y.Z.tar.gz` |
| Git submodule | Vendored builds | `git submodule add` pinned to tag or SHA |

## Dev-time access

There are no `vX.Y.Z` tags yet. Use one of these patterns:

### 1. Local checkout (recommended for active iteration)

```bash
git clone https://github.com/OpenNSW/one-trade-agency-configs ../one-trade-agency-configs
```

In the consumer project, read configs relative to an environment variable:

```bash
export ONETRADE_CONFIGS_PATH=../one-trade-agency-configs
```

The consumer code:

```js
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.env.ONETRADE_CONFIGS_PATH ?? "./one-trade-agency-configs";
const manifest = JSON.parse(readFileSync(join(root, "agency-configs/fcau/manifest.json"), "utf8"));
const path = manifest.tasks["fcau_application_review_v1"];
const config = JSON.parse(readFileSync(join(root, path), "utf8"));
```

Zero network round-trips. Edits in this repo are visible immediately.

### 2. Raw URL pinned to `main`

```
https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main/agency-configs/fcau/manifest.json
https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main/agency-configs/fcau/task-configs/fcau_application_review_v1.json
```

⚠ `main` is a moving target — fine for dev environments, not for production. **Do not use `main` in production.** Post-1.0, pin to a tag.

### 3. Raw URL pinned to a commit SHA

When you need reproducibility before tags exist:

```
https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/<full-40-char-sha>/fcau/manifest.json
```

Record the SHA in the consumer's config so the same content resolves on every build.

## Code samples (resolve taskCode → fetch config)

The pattern is always the same: fetch `<agency>/manifest.json`, look up `tasks[taskCode]`, then read that path.

### bash + jq + curl

```bash
BASE="https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main"
MANIFEST=$(curl -s "$BASE/agency-configs/fcau/manifest.json")
CONFIG_PATH=$(echo "$MANIFEST" | jq -r '.tasks["fcau_application_review_v1"]')
curl -s "$BASE/$CONFIG_PATH" | jq .
```

### Node.js (no dependencies)

```js
const BASE = "https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main";

async function getTaskConfig(agency, taskCode) {
  const manifest = await fetch(`${BASE}/agency-configs/${agency}/manifest.json`).then((r) => r.json());
  const path = manifest.tasks[taskCode];
  if (!path) throw new Error(`Unknown taskCode: ${taskCode}`);
  return fetch(`${BASE}/${path}`).then((r) => r.json());
}

const config = await getTaskConfig("fcau", "fcau_application_review_v1");
```

### Python (stdlib only)

```python
import json
from urllib.request import urlopen

BASE = "https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main"

def get_task_config(agency, task_code):
    manifest = json.load(urlopen(f"{BASE}/agency-configs/{agency}/manifest.json"))
    path = manifest["tasks"].get(task_code)
    if not path:
        raise KeyError(task_code)
    return json.load(urlopen(f"{BASE}/{path}"))

config = get_task_config("fcau", "fcau_application_review_v1")
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

const base = "https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main"

func getTaskConfig(agency, taskCode string) (map[string]any, error) {
    resp, err := http.Get(fmt.Sprintf("%s/agency-configs/%s/manifest.json", base, agency))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    var manifest struct {
        Tasks map[string]string `json:"tasks"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
        return nil, err
    }
    path, ok := manifest.Tasks[taskCode]
    if !ok {
        return nil, fmt.Errorf("unknown taskCode: %s", taskCode)
    }
    resp2, err := http.Get(fmt.Sprintf("%s/%s", base, path))
    if err != nil {
        return nil, err
    }
    defer resp2.Body.Close()
    var config map[string]any
    return config, json.NewDecoder(resp2.Body).Decode(&config)
}
```

## Caching the manifest

Each agency manifest is small (grows slowly as tasks are added). Cache it in memory for the lifetime of a request batch:

- Long-running services: load on startup, refresh periodically.
- Short-lived scripts: fetch once at the top, reuse.

## Using configs alongside `one-trade-templates`

Task configs reference form schemas by ID (in `forms.view` and `forms.review`). To resolve a form schema, look up the ID in the [`one-trade-templates` manifest](https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main/manifest.json):

```js
const BASE_CONFIGS   = "https://raw.githubusercontent.com/OpenNSW/one-trade-agency-configs/main";
const BASE_TEMPLATES = "https://raw.githubusercontent.com/OpenNSW/one-trade-templates/main";

const [configsManifest, templatesManifest] = await Promise.all([
  fetch(`${BASE_CONFIGS}/agency-configs/fcau/manifest.json`).then((r) => r.json()),
  fetch(`${BASE_TEMPLATES}/manifest.json`).then((r) => r.json()),
]);

const configPath = configsManifest.tasks["fcau_application_review_v1"];
const config = await fetch(`${BASE_CONFIGS}/${configPath}`).then((r) => r.json());

const reviewFormPath = templatesManifest.byId[config.forms.review];
const reviewForm = await fetch(`${BASE_TEMPLATES}/${reviewFormPath}`).then((r) => r.json());
```

## Post-1.0 patterns (planned)

### Tagged tarball

```bash
curl -L https://github.com/OpenNSW/one-trade-agency-configs/archive/refs/tags/v1.0.0.tar.gz \
  | tar xz
```

GitHub auto-generates source archives for every tag — no release workflow needed.

### Git submodule

```bash
git submodule add https://github.com/OpenNSW/one-trade-agency-configs third_party/one-trade-agency-configs
cd third_party/one-trade-agency-configs && git checkout v1.0.0
```

## CORS

GitHub's raw URLs serve `text/plain` with permissive CORS — browser fetches generally work. If you hit issues, proxy through your own server or wait for a jsDelivr-friendly tagged release (post-1.0).
