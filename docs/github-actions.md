# GitHub Actions integration

`ai-check-template` supports three GitHub Actions integration paths. Choose the
smallest contract that fits your project.

## Hosted reusable workflow

Use the hosted reusable workflow when you want this repository to own the
install/check workflow contract and your repository only to provide inputs.
With v0.3.0 released, call it from your project like this:

```yaml
name: AI Quality

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  ai-quality:
    uses: heidayo/ai-check-template/.github/workflows/ai-quality.yml@v0.3.0
    with:
      package-manager: pnpm
      node-version: "22"
      check-command: pnpm ai:check
```

Pin `@v0.3.0` for the exact released contract. A future @v1 major alias is
planned after the workflow and action surfaces are stable.

## Composite Action

Use the Composite Action when you want to keep the workflow in your repository
but reuse the setup/install/check steps. The action assumes the target
repository has already been checked out.

```yaml
name: AI Quality

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  ai-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: heidayo/ai-check-template/ai-quality@v0.3.0
        with:
          package-manager: pnpm
          node-version: "22"
          check-command: pnpm ai:check
```

## Local copy examples

Use the copy examples when you want full control over the YAML in your own
repository. These examples remain under
[`package-templates/ci-examples/`](../package-templates/ci-examples/) and are
intended to be copied, edited, and committed into the target project.

| Path | Ownership | Best fit |
|---|---|---|
| Hosted reusable workflow | `ai-check-template` owns the workflow body | Many repositories can share one released contract |
| Composite Action | Target repo owns the workflow; this repo owns repeated steps | You want custom triggers, matrix jobs, or extra steps |
| copy examples | Target repo owns every line after copying | You need maximum customization or are not ready for a hosted dependency |

## Inputs

Both the hosted reusable workflow and Composite Action support the core inputs
below. The reusable workflow also supports `timeout-minutes` because job timeout
is a workflow-level setting.

| input | default | Applies to | Purpose |
|---|---:|---|---|
| `package-manager` | `pnpm` | workflow, action | Selects `pnpm`, `npm`, `yarn`, or `bun` setup and install path |
| `node-version` | `22` | workflow, action | Node.js version for npm, pnpm, and yarn projects |
| `install-command` | empty | workflow, action | Optional custom install command. Empty uses the package-manager default |
| `check-command` | `pnpm ai:check` | workflow, action | Quality gate command to run in the target project |
| `working-directory` | `.` | workflow, action | Directory where install and check commands run |
| `upload-ai-check-artifacts` | `false` | workflow, action | Uploads `.ai-check/` when present |
| `timeout-minutes` | `30` | workflow only | Job timeout for the hosted reusable workflow |

## Security and versioning

The hosted reusable workflow declares `permissions: contents: read`. Keep caller
workflows least-privilege unless your project adds steps that require broader
permissions.

Actions in this repository use major-version pins such as `actions/checkout@v5`
and `actions/setup-node@v5`. Organizations with stricter supply-chain policies
can SHA-pin these actions after copying the examples, or use policy tooling to
enforce pinned references.

GitHub Marketplace listing is planned after the Composite Action contract has
been exercised through at least one release. This page documents the released
v0.3.0 foundation; it does not claim Marketplace availability.
