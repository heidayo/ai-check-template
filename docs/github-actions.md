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

## SHA-pinning third-party actions

The `@v0.3.0` pin above is a *tag pin on this repository's own artifacts* (the
hosted reusable workflow and Composite Action). It is a different layer from
pinning the **third-party actions** that appear inside the copy examples
(`actions/checkout`, `actions/setup-node`, and so on). This section covers the
latter: converting a mutable major-version pin into an immutable commit-SHA pin.

Why SHA-pin at all: a tag such as `@v5` is mutable. The same tag can be moved to
point at a different commit later, so a major-version pin does not guarantee the
exact code you reviewed will run. Pinning to a 40-character commit SHA freezes
the action's contents. This is the standard supply-chain hardening step for
CI that GitHub's own hardening guidance recommends. SHA-pinning is optional here
(the examples ship with major-version pins for portability), but it is the
recommended path for organizations with stricter supply-chain policies.

### Actions used in the copy examples

| Action | Where it appears | Example pin form |
|---|---|---|
| `actions/checkout` | `ai-check.yml`, `ai-check-fast.yml`, `ai-quality-*.yml` | `actions/checkout@<sha> # v5` |
| `actions/setup-node` | all direct and reusable examples | `actions/setup-node@<sha> # v5` |
| `pnpm/action-setup` | pnpm setup path | `pnpm/action-setup@<sha> # v4` |
| `oven-sh/setup-bun` | bun setup path | `oven-sh/setup-bun@<sha> # v2` |
| `actions/upload-artifact` | Playwright / diagnostic artifact steps | `actions/upload-artifact@<sha> # v4` |
| `github/codeql-action` | SARIF opt-in (`upload-sarif`) | `github/codeql-action/upload-sarif@<sha> # v4` |

### How to convert a pin

Replace the major tag with the commit SHA the tag currently points at, and keep
the original tag as a trailing comment so the version stays human-readable:

```yaml
# before (major-version pin)
- uses: actions/checkout@v5

# after (SHA pin, still readable)
- uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd # v5
```

The `# v5` comment is important: without it the SHA is opaque and later reviewers
cannot tell which release it corresponds to.

### Finding the SHA for a tag

Resolve the tag to a commit SHA with the GitHub CLI:

```bash
gh api repos/actions/checkout/git/refs/tags/v5 --jq '.object.sha'
```

If the tag is annotated the first call returns a tag object; dereference it to the
commit:

```bash
gh api repos/actions/checkout/git/refs/tags/v5 --jq '.object.sha' \
  | xargs -I{} gh api repos/actions/checkout/git/tags/{} --jq '.object.sha'
```

You can also read the SHA from the GitHub UI: open the tag on the Releases /
Tags page and copy the commit it points at. Paste that 40-character SHA and add
the `# vX` comment.

### Keeping SHA pins current

A SHA pin does not receive upstream security fixes automatically — it is frozen
by design. Enable Dependabot to bump the pinned SHAs (and refresh the `# vX`
comment) for you by adding a `.github/dependabot.yml` in your repository:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

`ai-check-template` does not ship this file (it belongs to your repository, not
to the distributed templates); the snippet above is the recommended setup.

## Semgrep SARIF opt-in

`ai-check.yml` ships a commented-out, opt-in scaffold that runs Semgrep and
uploads the result to GitHub Code Scanning (the Security tab). It is disabled by
default; the fast workflow (`ai-check-fast.yml`) intentionally has no SARIF step
so it stays lightweight.

The scaffold is a **separate path from the `security:sast` package script**. That
script stays `semgrep scan --config auto` (human-readable stdout) and is not
changed by enabling SARIF. The CI SARIF step calls Semgrep directly with the
extra output flags and does not invoke `security:sast` or `ai:check:secure`.

To enable it, uncomment the three blocks in `ai-check.yml`:

1. **Permission.** SARIF upload requires `security-events: write`. Add it to the
   workflow `permissions:` block *only when you enable SARIF* — keep the default
   `contents: read` for everyone else (least-privilege). Missing this permission
   makes the upload step fail with HTTP 403. On private repositories
   `github/codeql-action/upload-sarif` also needs `actions: read`.

   ```yaml
   permissions:
     contents: read
     security-events: write
     # actions: read   # private repos only
   ```

2. **Scan step.** Runs Semgrep with SARIF output. The scaffold does not install
   Semgrep for you (scanners are not auto-installed); add `pip install semgrep`
   or your preferred install before the scan when you enable it.

   ```yaml
   - name: Run Semgrep (SARIF)
     run: semgrep scan --sarif --output=semgrep.sarif --config auto
   ```

3. **Upload step.** Uploads the SARIF file to Code Scanning.

   ```yaml
   - name: Upload SARIF to Code Scanning
     if: always()
     uses: github/codeql-action/upload-sarif@v4
     with:
       sarif_file: semgrep.sarif
   ```

When you enable the scaffold, confirm the current inputs against the official
docs — the `github/codeql-action` major version and the Semgrep `--sarif` flags
can change over time. Verified 2026-07-03: `upload-sarif` uses the `sarif_file`
input and `@v4` is current (`@v3` is also still supported).

SARIF findings include the matched code path and surrounding lines, and access
to them follows the repository's Security-tab visibility (which can be broad on a
public repository). Do not let secrets or other private values reach the CI logs
or the SARIF output — that is the caller's responsibility.

## Monorepo: paths filter, matrix, and workspaces

The direct workflows (`ai-check.yml`, `ai-check-fast.yml`) ship commented-out,
opt-in scaffolds for monorepo use. Defaults run on the whole repository; you
uncomment the scaffolds to narrow or fan out the run.

### Paths filter

To run CI only when a specific package changes, uncomment the `on:` paths
scaffold and point the glob at the package directory you scoped with SPEC-0061's
`--workspace <pkg-dir>` (for example `packages/app`):

```yaml
on:
  pull_request:
    paths:
      - 'packages/app/**'
  push:
    branches: [main]
    paths:
      - 'packages/app/**'
```

**Required-check caveat.** When a paths filter is active and a PR only touches
paths outside the filter, every job is skipped. If that job is a *required*
status check, GitHub leaves it in a never-run `pending` state and the PR cannot
merge. Two standard workarounds:

- Add an always-green fallback job (a job with `if: always()` that just echoes a
  message) and make *that* the required check, so a filtered-out PR still reports
  green. The paths-filter scaffold in `ai-check.yml` shows this `guard` job.
- Or do not mark this per-job workflow as a required check in branch protection.

### Matrix

`ai-check.yml` also ships a matrix scaffold for running multiple Node versions or
multiple workspace directories in one job:

- **Multiple Node versions:** `matrix.node: [20, 22]` wired to
  `node-version: ${{ matrix.node }}`.
- **Multiple workspaces:** `matrix.workspace: [packages/app, packages/api]` wired
  to `working-directory: ${{ matrix.workspace }}` (the `--workspace` equivalent).

Set `fail-fast: false` when you want the remaining matrix legs to finish even
after one fails. `ai-check-fast.yml` has no matrix scaffold on purpose.

### Reusable workflow and `working-directory`

The reusable workflow (`ai-quality-reusable.yml`) already accepts a
`working-directory` input, so you can point it at a workspace directory without
editing the workflow body. Fan-out across workspaces is written on the caller
side — declare a matrix in your caller job and pass
`working-directory: ${{ matrix.workspace }}` into the reusable workflow.
