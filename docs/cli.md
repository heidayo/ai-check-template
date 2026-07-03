# CLI

`ai-check-template` includes a published stable CLI. The current npm `latest` package is `ai-check-template@0.4.0`. `npm pack` and `npm publish --dry-run --tag latest` remain part of repository validation before future maintainer publishes.

Use it to copy the v0.1.0 templates into an existing project with safer defaults than manual copy.

The CLI does not require SAGE. This repository uses SAGE for its own maintenance, but target projects can use `init`, `doctor`, and `update` without installing SAGE or adopting this repository's internal workflow.

v0.3.0 is a GitHub Actions integration release, not an npm CLI release. v0.4.0 is the npm CLI release for `run`, `expect`, structured AC/Test Matrix files, and the expanded security gate. Hosted workflow and Composite Action usage is documented in [`github-actions.md`](./github-actions.md).

## Command

```bash
npx -y ai-check-template init --target ../your-project --profile react-nextjs --dry-run
npx -y ai-check-template init --target ../your-project --profile react-nextjs --yes
npx -y ai-check-template doctor --target ../your-project
npx -y ai-check-template update --target ../your-project --dry-run
```

Repository-local commands are still useful when testing a checked-out clone:

```bash
node bin/ai-check-template.mjs init --target ../your-project --profile react-nextjs --yes
node bin/ai-check-template.mjs init --target ../your-project --profile react-nextjs --review-templates --yes
node bin/ai-check-template.mjs doctor --target ../your-project
node bin/ai-check-template.mjs update --target ../your-project --dry-run
```

From another project after cloning this repository:

```bash
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile react-nextjs --dry-run
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile react-nextjs --install-deps --dry-run
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile react-nextjs --yes
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile node-cli --package-manager npm --dry-run
node ../ai-check-template/bin/ai-check-template.mjs doctor --target . --json
node ../ai-check-template/bin/ai-check-template.mjs doctor --target . --strict --json
node ../ai-check-template/bin/ai-check-template.mjs update --target . --yes
node ../ai-check-template/bin/ai-check-template.mjs run --target . --script ai:check --output .ai-check/ai-check-result.json --json
node ../ai-check-template/bin/ai-check-template.mjs expect --file docs/ai-check-template/docs/ac-test-matrix.example.yaml --json
node ../ai-check-template/bin/ai-check-template.mjs report --expect docs/ac-test-matrix.json --run .ai-check/ai-check-result.json --strict
```

## Init options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | `react-nextjs` | One base profile: `react-nextjs`, `react-vanilla`, `expo-rn`, or `node-cli`. Add `+supabase-rls` when needed. With `--profile-file`, pass `custom:<name>` instead. |
| `--profile-file <path>` | off | Path (relative to `--target`) to a custom profile definition file. Enables custom mode; requires `--profile custom:<name>`. See [Custom profiles](#custom-profiles---profile-file). |
| `--package-manager <name>` | target detection or `pnpm` | Package manager for generated package scripts: `pnpm`, `npm`, `yarn`, or `bun`. |
| `--ci <mode>` | `direct` | `direct` writes package-manager-aware `ai-check.yml` and `ai-check-fast.yml`; `reusable` writes `ai-quality-reusable.yml` plus a package-manager-aware `ai-quality-call.yml`; `none` skips workflows. |
| `--claude-hooks` | off | Copies `.claude/rules/test-rules.md` and merges package-manager-aware hook commands into `.claude/settings.json`. |
| `--review-templates` | off | Copies `.github/PULL_REQUEST_TEMPLATE.md` and `worksheet/ai-code-understanding.md` for the human Review gate. |
| `--install-deps` | off | Installs missing npm dev dependencies for generated package scripts. With `--dry-run`, prints the command without executing it. Cannot be combined with `--workspace`. |
| `--workspace <pkg-dir>` | off | Targets one workspace package in a monorepo. See [Workspace mode](#workspace-mode---workspace). |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` is used. |
| `--overwrite` | off | Replaces conflicting files or scripts. Without this flag, conflicts are skipped. |
| `--json` | off | Prints machine-readable JSON output including the `operations` list. |

## Doctor options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | install state or `react-nextjs` | Profile to check. One base profile plus optional `+supabase-rls`. With `--profile-file`, pass `custom:<name>`. |
| `--profile-file <path>` | install state or off | Custom profile definition file (relative to `--target`). Defaults to the custom profile recorded in the install state. See [Custom profiles](#custom-profiles---profile-file). |
| `--package-manager <name>` | install state, target detection, or `pnpm` | Package manager used when checking package scripts: `pnpm`, `npm`, `yarn`, or `bun`. |
| `--ci <mode>` | `direct` | Checks `direct`, `reusable`, or no workflow files. |
| `--claude-hooks` | off | Checks `.claude/rules/test-rules.md` and required hook keys in `.claude/settings.json`. |
| `--review-templates` | install state or off | Checks `.github/PULL_REQUEST_TEMPLATE.md` and `worksheet/ai-code-understanding.md` against packaged reviewability templates. |
| `--workspace <pkg-dir>` | install state or off | Workspace package to diagnose. Defaults to the `workspace` recorded in the install state. See [Workspace mode](#workspace-mode---workspace). |
| `--strict` | off | Treats profile diagnostics warnings as a failing result while keeping them in `warnings`. |
| `--json` | off | Prints `{ status, target, strict, installation, effectiveOptions, warnings, issues }` for automation. |

## Update options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | install state or `react-nextjs` | Profile to refresh in install state. One base profile plus optional `+supabase-rls`. With `--profile-file`, pass `custom:<name>`. |
| `--profile-file <path>` | install state or off | Custom profile definition file (relative to `--target`). Defaults to the custom profile recorded in the install state. See [Custom profiles](#custom-profiles---profile-file). |
| `--package-manager <name>` | install state, target detection, or `pnpm` | Package manager used when refreshing package scripts: `pnpm`, `npm`, `yarn`, or `bun`. |
| `--ci <mode>` | `direct` | Updates package-manager-aware `direct`, `reusable`, or no workflow files. |
| `--claude-hooks` | off | Updates `.claude/rules/test-rules.md` and managed package-manager-aware hook keys in `.claude/settings.json`. |
| `--review-templates` | install state or off | Updates `.github/PULL_REQUEST_TEMPLATE.md` and `worksheet/ai-code-understanding.md` from packaged reviewability templates. |
| `--install-deps` | off | Installs missing npm dev dependencies for generated package scripts. With `--dry-run`, prints the command without executing it. Cannot be combined with `--workspace` (explicit or state-resolved). |
| `--workspace <pkg-dir>` | install state or off | Workspace package to update. Defaults to the `workspace` recorded in the install state. See [Workspace mode](#workspace-mode---workspace). |
| `--keep-local` | on (default behavior) | Keeps locally modified managed files. This is the default; the flag makes the choice explicit in scripts and CI. Mutually exclusive with `--force-managed`. |
| `--force-managed` | off | Overwrites locally modified managed files. The previous content is saved as `<file>.bak-<packageVersion>` before the overwrite. |
| `--diff` | off | Read-only mode: prints a unified diff for each locally modified managed file, writes nothing, and exits non-zero when modifications exist. Does not require `--yes`. Mutually exclusive with `--keep-local` / `--force-managed`. |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` or `--diff` is used. |
| `--json` | off | Prints `{ status, target, installation, effectiveOptions, operations, notes }` for automation (`diffs` is added with `--diff`). |

## Workspace mode (`--workspace`)

`init`, `update`, and `doctor` accept `--workspace <pkg-dir>` (or `--workspace=<pkg-dir>`) to target one package inside a monorepo. The value is a relative path from `--target` (the workspace root). Exactly one workspace can be specified: passing the flag twice is an error (single-workspace support). Absolute paths, `..` segments, `--workspace .`, and shell metacharacters are rejected.

```bash
npx -y ai-check-template init --target . --workspace packages/app --yes
```

Preconditions (validated before anything is written; failures exit non-zero):

- `--target` must be a workspace root: either `pnpm-workspace.yaml` exists, or the root `package.json` has a `workspaces` field (array or `{ "packages": [...] }`).
- `<target>/<pkg-dir>` must be an existing directory containing a `package.json` with a non-empty `name`.

Placement rule:

- **Gate scripts** (`ai:check`, `ai:check:fast`, `ai:check:secure`) are merged into the **workspace root** `package.json`, with each step rendered as a workspace-scoped invocation per package manager:

  | Package manager | Step invocation |
  |---|---|
  | pnpm | `pnpm --filter <name> <step>` |
  | npm | `npm run <step> --workspace <pkg-dir>` |
  | yarn | `yarn workspace <name> <step>` |
  | bun | `bun run --filter <name> <step>` (requires a bun version with `--filter` support, v1.0.16+) |

- **Step scripts** (`doctor`, `deadcode`, `test:e2e:smoke`, addon scripts, and support scripts such as `typecheck` / `lint` / `test`) are merged into the **target package** `package.json`.
- Managed files (docs, hooks, CI workflows, config) and the install state stay at the workspace root, unchanged from single-package mode.

The install state records `"workspace": "<pkg-dir>"`, so a later `update` or `doctor` without the flag resolves the same package (an explicit `--workspace` takes precedence over the state). `doctor` re-runs the preconditions as diagnostics: if the package was deleted after init, it reports an `invalid-workspace` issue and exits non-zero, and `update` refuses to write.

Relationship to [`.ai-check.yaml`](#step-config-ai-checkyaml--ai-checkjson): the config file remains the authoritative override for `run` gate steps. Workspace mode only changes the generated script scaffold and its diagnosis — if a `.ai-check.yaml` defines steps, those still win at run time, and this scaffold merely provides their initial values.

Constraints:

- Single workspace only. To gate multiple packages, define combined steps in `.ai-check.yaml`.
- `--install-deps` cannot be combined with workspace mode; install dev dependencies in the package manually or via your package manager.
- Compatibility: workspace mode requires ai-check-template v0.5.0 or later. Older CLI versions ignore the `workspace` field in the install state and may misreport the root gate scripts as drift.

Rollback: workspace mode is opt-in. To revert, remove the generated gate scripts from the root `package.json`, remove the step scripts from the package, and delete the `workspace` field from `.ai-check-template.json` (or re-run `init` without `--workspace`).

## Custom profiles (`--profile-file`)

The four built-in base profiles (`react-nextjs`, `react-vanilla`, `expo-rn`, `node-cli`) and the `supabase-rls` addon cover the common JavaScript/TypeScript stacks. For a stack that has no built-in profile — Vue, Svelte, Go, Rust, or an in-house toolchain — you can define a **custom profile** in your own project and install it with `--profile-file`. Custom profiles require ai-check-template v0.5.0 or later.

`init`, `update`, and `doctor` accept `--profile-file <path>` (or `--profile-file=<path>`), a path relative to `--target`. When it is set, custom mode is entered and `--profile` must be `custom:<name>` where `<name>` matches `[a-z][a-z0-9-]*` and equals the definition file's `profile.name`. Passing a built-in profile name together with `--profile-file` is an error (`--profile-file` is custom-mode-only), as is passing it twice.

```bash
npx -y ai-check-template init --target . --profile custom:mystack --profile-file ./.ai-check-profile.yaml --yes
```

### Definition file schema (version 1)

The definition file is `.ai-check-profile.yaml` (a minimal YAML subset, same parser family as `.ai-check.yaml`) or `.ai-check-profile.json` (parsed with `JSON.parse`; use it when the YAML subset is too limiting). It is **your** file: it is not distributed, not managed by the installer, and never overwritten by `update`.

```yaml
version: 1
profile:
  name: mystack                       # [a-z][a-z0-9-]* ; must equal <name> in --profile custom:<name>
  gateScripts:                        # all three gates are required
    ai:check: [typecheck, lint, test] # a list of step names, joined into "&&"
    ai:check:fast: [typecheck, lint]
    ai:check:secure: myorg-scan --ci  # or a full command string
  supportScripts:                     # step name -> command; every step referenced by a gate list must appear here
    typecheck: tsc --noEmit
    lint: eslint .
    test: vitest run
  devDependencies:                    # optional; installed with --install-deps
    - typescript
    - eslint
    - vitest
```

Fields:

- `version` — must be `1`.
- `profile.name` — the custom profile name; must match `[a-z][a-z0-9-]*` and cannot be a built-in profile name.
- `profile.gateScripts` — must cover all of `ai:check`, `ai:check:fast`, and `ai:check:secure`. Each value is either a command string or a list of step names. Step names in a list are rendered as `<package-manager> <step>` (the same per-package-manager transform built-in profiles use) and must be defined in `supportScripts`.
- `profile.supportScripts` — a mapping of step name (`[a-z][a-z0-9:_-]*`) to a non-empty command string. These are the step commands the gate scripts invoke.
- `profile.devDependencies` — optional array of package names installed when `--install-deps` is passed.

Any schema violation (missing `version`, missing gate, unknown key, bad name, a gate list referencing an undefined step, and so on) fails fast with an error naming the file and cause, and nothing is written. `init` merges the gate and support scripts into the target `package.json` and records a snapshot under `customProfile` in `.ai-check-template.json`; `doctor` then reports if the definition file is missing, drifts from that snapshot, or the package scripts drift; `update` refreshes the scripts and the snapshot from the current definition file.

### How custom profiles relate to built-in profiles

Custom profiles are a **separate resolution path**. They are never added to the built-in profile registry (`supportedProfiles`), so the built-in profiles, their composition, and the profile-composition snapshot are unaffected — a project using built-in profiles behaves identically whether or not the custom-profile feature exists. The installer does not ship a README for custom profiles: if `docs/ai-check-template/profiles/custom-<name>/README.md` is not present in the package it is simply skipped (you may add your own). Custom addons, multiple custom profiles at once, and composing a custom base with `+supabase-rls` are out of scope in this version — v1 provides one custom base profile.

### Security: command trust boundary

The `gateScripts` and `supportScripts` commands from the definition file are written **verbatim** into your `package.json` scripts and executed when the gates run. Treat the definition file with the same trust as `package.json` and `.ai-check.yaml`: only use definition files you control, and do not run one from an untrusted source. Do not put secrets, tokens, or API keys directly in the command strings — reference them through environment variables or a secret manager (for example `MYORG_TOKEN=... myorg-scan` supplied by CI, not a literal token in the command). The `<name>` and step names are validated against a conservative pattern before being embedded into scripts or the `custom-<name>` doc path, and `--profile-file` rejects absolute paths and `..` segments so the read stays inside `--target`.

## Run options

`run` executes one target `package.json` script and emits structured evidence.
It is useful when a repair prompt needs exact command output without trusting an
AI self-report.

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--script <name>` | `ai:check` | Package script to execute. The command is split on explicit `&&` steps. |
| `--json` | off | Prints `{ status, script, command, startedAt, durationMs, configPath, steps }`. |
| `--output <file>` | none | Writes the same JSON result to a file, creating parent directories as needed. |

Step status is one of `PASS`, `FAIL`, or `SKIPPED`. After the first failing
step, remaining steps are recorded as `SKIPPED` to preserve `&&` semantics.
Captured stdout/stderr is redacted for common token, secret, password,
credential, API key, AWS key, GitHub token, and JWT patterns. Redaction applies
to every step regardless of whether it came from a config file or from the
package script.

Each step in the JSON result carries evidence of where it came from:

- `name`: the config-declared step name, or `step-<index>` for default steps.
- `source`: `"config"` when the step was resolved from `.ai-check.yaml` /
  `.ai-check.json`, `"default"` when it came from splitting the package script.
- `configPath` (result root): the relative path of the config file that was
  used, or `null` when no config was used for this run.

These fields are additive; all previously documented fields are unchanged.

### Step config (`.ai-check.yaml` / `.ai-check.json`)

`run` optionally reads a step configuration file from the target project root
(the `--target` directory only; parent directories are never searched). The
file is **opt-in and user-owned**: `init` never creates it, `update` never
overwrites or deletes it, `doctor` never inspects it, and it is not part of the
managed file list. Without the file, `run` behaves exactly as before. To roll
back, simply delete the config file — the previous behavior is fully restored.

Schema version 1:

- Top level: `version: 1` (required) and `steps` (required, at least one step).
- Each step name must match `[a-z][a-z0-9:_-]*` and maps to:
  - `gates` (required): non-empty array of `fast`, `full`, `secure`.
  - `command` (optional): non-empty command string. When omitted, the command
    of the target project's package script with the same name as the step is
    used (a missing script of that name is an error, never a silent skip).
  - `enabled` (optional, default `true`): `false` records the step as
    `SKIPPED` without executing it.

Breaking schema changes will bump `version` and be rejected with an explicit
error, following the same policy as the install state `schemaVersion`.

Gate resolution: `--script ai:check` maps to gate `full`, `ai:check:fast` to
`fast`, and `ai:check:secure` to `secure`. Fallback rules:

- If the config declares at least one step for the matched gate, the executed
  steps are **fully replaced** by those steps in declaration order (full
  enumeration model — there is no partial patching of the default chain).
- If the config exists but declares no step for the matched gate, that gate
  falls back to splitting the package script (`source: "default"`,
  `configPath: null`).
- Any other `--script` value never consults the config.
- Validation runs before any step executes: parse errors, a missing or wrong
  `version`, unknown keys, unknown gate values, empty `command`, invalid or
  duplicate step names all fail fast with a non-zero exit. The config is never
  silently ignored in favor of the default behavior.
- If both `.ai-check.yaml` and `.ai-check.json` exist, `run` errors and asks
  you to delete one of them.

A complete example covering all three gates:

```yaml
# .ai-check.yaml — committed by you, never distributed or managed
version: 1
steps:
  lint:
    gates: [fast, full]        # command omitted: reuses package script "lint"
  typecheck:
    gates: [fast, full]
  test:
    command: "pnpm vitest run"
    gates: [full]
  e2e:smoke:
    command: "pnpm playwright test --grep @smoke"
    enabled: false             # temporarily paused; recorded as SKIPPED
    gates: [full]
  secret-scan:
    command: "bash scripts/ai-check-secure.sh"
    gates: [secure]
```

The YAML parser supports only a minimal subset: the `version` line, the
`steps:` mapping, step-name keys, nested scalar `key: value` pairs, and inline
gate arrays like `[fast, full]`. Anything else (block lists, anchors, aliases,
multi-line scalars, flow mappings) is rejected with an error that points to the
equivalent escape hatch: `.ai-check.json` with the same schema, parsed as full
JSON:

```json
{
  "version": 1,
  "steps": {
    "lint": { "gates": ["fast", "full"] },
    "test": { "command": "pnpm vitest run", "gates": ["full"] }
  }
}
```

Security notes:

- The committed `command` values run exactly as-is (arbitrary code execution at
  the same trust level as `package.json` scripts). Review config changes like
  any other executable change and do not let untrusted edits in.
- Never hardcode secrets / tokens / API keys in the config; pass them via
  environment variables or a secret manager. Captured output still goes
  through the standard redaction, but redaction is a safety net, not a license
  to commit secrets.
- Declaring a gate with every step `enabled: false` makes the whole gate a
  no-op that still reports `PASS` (zero executed steps, all `SKIPPED`). This is
  honored as an explicit user choice, but it effectively disables the gate and
  is discouraged in CI.

## Expect options

`expect` validates the structured AC / Test Matrix JSON or template-subset YAML
distributed under `package-templates/docs/`.

| Option | Default | Description |
|---|---|---|
| `--file <path>` | required | JSON, YAML, or YML file to validate. |
| `--json` | off | Prints `{ status, file, summary, issues }`. |

The validator checks that requirement metadata exists, AC IDs are unique, every
AC has a command, every test row references a known AC, and every AC is covered
by at least one test row. YAML support is intentionally limited to the packaged
template shape; use JSON for richer metadata.

Each acceptance criterion may declare an optional `step` field (non-empty
string) naming the `run` result step that verifies it. `step` is the
recommended, explicit way to bind a criterion to a measured step for the
`report` command below. An empty `step` is reported as an `invalid-step` issue.

## Report options

`report` matches declared acceptance criteria (`--expect`, same file format and
validation as `expect`) against a run result JSON written by
`run --output` / `run --json` (`--run`). It is read-only: it never executes
commands or writes files, and its output never includes step stdout/stderr.

| Option | Default | Description |
|---|---|---|
| `--expect <file>` | required | JSON or template-subset YAML AC/Test Matrix file. |
| `--run <file>` | required | Run result JSON produced by `run --output` / `run --json`. |
| `--format <name>` | `text` | Output format: `text`, `markdown`, or `json`. |
| `--json` | off | Alias for `--format json`. |
| `--strict` | off | Exit code 1 when any AC is FAIL or UNVERIFIED (report is still printed). |

Matching rules are deterministic and use explicit keys only — no fuzzy
matching:

- If the AC has a `step` field, it matches the run step whose `name` is exactly
  equal. A `step` value that names no run step (including a typo) yields
  `no-match` and the AC becomes UNVERIFIED, so `--strict` in CI also catches
  `step` typos.
- Without `step`, the AC `command` must equal exactly one step `command` after
  trimming. Zero matches yield `no-match`; two or more matches yield
  `ambiguous-command` — the AC stays UNVERIFIED instead of guessing. Add a
  `step` field to disambiguate.

Verdict per AC: PASS (matched step is PASS), FAIL (matched step is FAIL),
UNVERIFIED (no match, or matched step is SKIPPED). `--format json` records the
match reason (`matched-step` / `matched-command` / `no-match` /
`ambiguous-command`) per criterion for machine consumption.

Invalid inputs fail fast without printing a report: expect validation issues,
unparsable run JSON, missing/invalid run fields, or duplicate step names all
exit non-zero. If the run JSON is stale or hand-edited, regenerate it with
`ai-check-template run --output <file>`.

CI example (two-command pipeline):

```bash
npx -y ai-check-template run --target . --script ai:check --output .ai-check/run-result.json
npx -y ai-check-template report --expect docs/ac-test-matrix.json --run .ai-check/run-result.json --strict
```

`report --format markdown` emits a GFM table (AC / criterion / matched step or
command / verdict) plus a summary line for pasting into the PR body
Verification section.

The run result contract consumed by `report` is fixed by
[`package-templates/docs/run-result.schema.json`](../package-templates/docs/run-result.schema.json)
(additive-only changes).

## Install state

`init` writes a deterministic `.ai-check-template.json` file at the target project root. The file records schema version (currently `2`), package version, selected profile, package manager, CI mode, whether Claude hooks were enabled, whether reviewability templates were enabled, and a `managedFiles` map with the `sha256:<hex>` baseline hash of every managed file as written on disk. It intentionally does not store timestamps, absolute target paths, environment values, or secrets.

Schema version handling:

- schemaVersion `1` states (written by v0.2.0–v0.4.0) are read as-is and migrated to schemaVersion `2` on the next `init`/`update` write. Until re-recorded, they carry no baseline hashes, so `update` falls back to byte comparison and keeps any differing file with a warning instead of overwriting it.
- schemaVersion greater than `2` (state written by a newer CLI) stops `update` with an explicit error instead of being read silently. Upgrade the CLI or pin the newer version.
- `doctor` prints the current `schema-version`, so unmigrated v1 states remain observable.

`doctor` and `update` read this file when it exists. Explicit flags still win:

1. CLI flags such as `--profile`, `--package-manager`, `--ci`, `--claude-hooks`, and `--review-templates`
2. `.ai-check-template.json`
3. target detection for package manager (`packageManager` field, then lockfiles)
4. legacy defaults (`react-nextjs`, `pnpm`, `direct`, no Claude hooks, no reviewability templates)

Malformed or unsupported install state is reported by `doctor` as an issue. `update` rejects malformed install state before writing any target files.

## Package manager detection

The CLI generates profile-aware package scripts for `pnpm`, `npm`, `yarn`, and `bun`. Detection uses:

1. explicit `--package-manager`
2. install state
3. target `package.json` `packageManager` field
4. lockfiles (`pnpm-lock.yaml`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `bun.lock`, `bun.lockb`)
5. `pnpm` default

Package manager detection changes generated package script invocations, Claude hook commands, and CLI-written GitHub Actions workflows. When `--install-deps` is explicitly set on `init` or `update`, it also selects the install command. It does not change the manual `package-templates/package.scripts.fragment.json` or the source templates under `package-templates/`.

## CI workflow rendering

When `--ci direct` is set, `init` and `update` write workflow commands for the effective package manager:

| Package manager | Install command | Full check | Fast check |
|---|---|---|---|
| `pnpm` | `pnpm install --frozen-lockfile` | `pnpm ai:check` | `pnpm ai:check:fast` |
| `npm` | `npm ci` | `npm run ai:check` | `npm run ai:check:fast` |
| `yarn` | `yarn install --immutable` | `yarn ai:check` | `yarn ai:check:fast` |
| `bun` | `bun install --frozen-lockfile` | `bun run ai:check` | `bun run ai:check:fast` |

When `--ci reusable` is set, `ai-quality-reusable.yml` remains the generic reusable workflow and `ai-quality-call.yml` receives package-manager-specific `package-manager` and `check-command` inputs. The same hosted workflow can run the security gate by setting `check-command: pnpm ai:check:secure`. `doctor` compares selected workflows against the rendered content for the effective package manager. `update --ci none` cleans up inactive workflows only when their content exactly matches one of the managed rendered variants; custom workflow content is preserved.

## Claude hook command rendering

When `--claude-hooks` is set, `init` and `update` render the managed `.claude/settings.json` hook commands from the effective package manager:

| Package manager | Fast hook | Full hook |
|---|---|---|
| `pnpm` | `pnpm ai:check:fast` | `pnpm ai:check` |
| `npm` | `npm run ai:check:fast` | `npm run ai:check` |
| `yarn` | `yarn ai:check:fast` | `yarn ai:check` |
| `bun` | `bun run ai:check:fast` | `bun run ai:check` |

`init` preserves existing hook groups unless `--overwrite` is passed. `update` refreshes managed hook commands to the effective package manager and preserves custom non-managed hook commands in the same group. The packaged manual hook fragment remains `pnpm`-based for copy-and-adapt users.

## Profile diagnostics

`doctor` also emits `warnings` from the effective profile, missing referenced package scripts, and stale managed CI workflow checks. These warnings use the same `{ code, path, message }` shape as issues. By default they are advisory and do not change the exit status. Add `--strict` when CI or release prep should fail on warnings without converting them into issues.

Current advisory checks cover:

- `react-nextjs`: React Doctor and Playwright smoke E2E recommendations
- `react-vanilla`: Next.js-specific script mismatch
- `expo-rn`: Playwright mismatch for mobile projects; React Doctor is supported for React Native diagnostics
- `node-cli`: UI E2E mismatch for CLI or library projects
- `supabase-rls`: missing RLS-related DB / integration test scripts
- `ai:check` / `ai:check:fast` / `ai:check:secure`: missing referenced package scripts such as `typecheck`, `lint`, or `test:unit`

Warnings remain advisory by default. `doctor --strict` is available for stricter local or CI checks. Missing script diagnostics do not install dependencies or create scripts.

## CI diagnostics

`doctor` reports `ci-advice` warnings when workflow files from an inactive `--ci` mode still exist and exactly match the packaged templates:

- `--ci none`: warns about managed direct and reusable workflow files
- `--ci direct`: warns about managed reusable workflow files
- `--ci reusable`: warns about managed direct workflow files

Custom workflows with the same paths are not treated as stale managed files unless their contents exactly match the packaged template. `update` can clean up exact-managed inactive workflows; custom workflows are preserved.

## Profile-aware scripts

The manual `package-templates/package.scripts.fragment.json` remains a generic copy-and-adapt fragment. The CLI uses a profile-aware script resolver instead:

- `react-nextjs` adds React Doctor and dead-code checks to `ai:check`
- `react-vanilla` keeps SPA scripts without Next.js-specific commands
- `expo-rn` adds React Doctor diagnostics and keeps mobile-oriented smoke E2E defaults
- `node-cli` excludes UI E2E from `ai:check`
- `supabase-rls` adds `test:db` and `test:integration:rls`
- all profiles add `ai:check:secure` as a separate security evidence gate:
  `security:secrets`, `security:deps`, `security:supply-chain`, and
  `security:sast` (`semgrep scan --config auto`)

`init` merges the selected profile scripts. `doctor` checks the effective profile scripts. `update` migrates known managed package scripts to the effective profile, with explicit `--profile` and `--package-manager` taking precedence over install state.

`ai:check` and `ai:check:secure` are intentionally separate. Use `ai:check` for functional quality evidence and `ai:check:secure` for security-oriented evidence. The CLI does not install Semgrep, Secretlint, or organization-specific security tools; target projects own scanner availability and rule tuning.

## Profile composition

This section defines the profile composition rules. `--profile` accepts one base profile plus zero or more addon profiles, joined with `+` or `,` (the separators are equivalent):

```bash
--profile react-nextjs
--profile react-nextjs+supabase-rls
--profile react-nextjs,supabase-rls
--profile base+addon1+addon2   # multiple addons, merged in declaration order
```

Grammar rules:

- Exactly one base profile is required (`react-nextjs`, `react-vanilla`, `expo-rn`, or `node-cli`). Zero or two base profiles is an error.
- Addons are optional. Currently available addon: `supabase-rls`.
- Duplicate profile names and unknown profile names are rejected with an error before any target write.

Merge rules (see "Profile-aware scripts" above for what each profile contributes):

- Scripts are composed starting from the base profile, then each addon is merged in declaration order.
- An addon's check steps (for `supabase-rls`: `test:db` and `test:integration:rls`) are appended to the end of `ai:check` with `&&`; steps already present are not appended twice.
- If an addon defines a script key with the same name as the base profile or a preceding addon, the CLI fails with an error naming the conflicting key and profiles. Scripts are never silently overwritten. No current addon combination triggers this.
- Addons do not contribute support scripts; support scripts come from the base profile plus the package-manager-specific security scripts only (see "Support script defaults" below).
- Copied profile docs are the common docs, the base profile README, then addon READMEs in declaration order (see "Profile document migrations" below).

## Profile document migrations

`init` and `update` copy profile guidance into the target project under `docs/ai-check-template/`.

The copied set includes:

- `docs/test-design-template.md`
- `docs/ac-test-matrix.schema.json`
- `docs/ac-test-matrix.example.json`
- `docs/ac-test-matrix.example.yaml`
- `docs/philosophy/*.md`
- `prompts/diagnostic-repair.md`
- `profiles/README.md`
- the selected base profile README, such as `profiles/react-nextjs/README.md` or `profiles/node-cli/README.md`
- selected addon profile READMEs, such as `profiles/supabase-rls/README.md`

The target layout preserves the package-template-like `docs/`, `prompts/`, and `profiles/` structure so existing relative links in the copied Markdown continue to work. `init` skips existing files by default and follows `--overwrite` for conflicts. `update` applies the same 3-way resolution as other managed files: missing docs are created, unmodified docs follow the template, and locally modified docs are kept as `skip-modified`.

## Support script defaults

`init` and `update` also add missing support package scripts referenced by `ai:check` / `ai:check:fast` / `ai:check:secure`, such as `typecheck`, `lint`, `test`, `test:unit`, and for `react-nextjs`, `test:e2e:smoke`.

These defaults are intentionally conservative:

- Existing user scripts are kept, even with `--overwrite`
- Missing support scripts are added before `doctor --strict` checks for `script-advice`
- Dependencies are installed only when `--install-deps` is explicitly set
- The manual `package-templates/package.scripts.fragment.json` is not changed

## Dependency install opt-in

`init` and `update` can install missing npm dev dependencies for generated package scripts when `--install-deps` is explicitly provided. This is intentionally opt-in:

- `--install-deps --dry-run` prints the package manager command, such as `pnpm add -D typescript eslint vitest knip @playwright/test`, without requiring the package manager binary and without writing lockfiles.
- `--install-deps --yes` preflights the selected package manager binary before template files are written, then runs the install command after package scripts and install state are updated.
- Already declared packages in `dependencies`, `devDependencies`, `peerDependencies`, or `optionalDependencies` are skipped.
- Supported commands are `pnpm add -D`, `npm install --save-dev`, `yarn add --dev`, and `bun add --dev`.
- The allowlist covers npm dev dependencies for generated defaults: `typescript`, `eslint`, `vitest`, `knip`, and `@playwright/test` for `react-nextjs`.
- External tools such as Supabase CLI, Maestro, React Doctor, and Semgrep are not installed by this flag. React Doctor remains invoked through the generated `npx -y react-doctor@latest` script; Semgrep remains the target project's security tool responsibility.

## What init changes

`init` reads from `package-templates/` and the CLI profile resolver, then may update the target project:

- Merges profile-aware package scripts for the selected `--profile`
- Adds missing support package scripts while preserving existing user scripts
- Uses the selected or detected package manager for generated package script invocations
- Adds `ai:check:secure` as a separate security script chain for secret scan, dependency audit, supply-chain check, and Semgrep SAST
- Optionally installs missing npm dev dependencies when `--install-deps` is set
- Copies common test design / philosophy docs and selected profile docs under `docs/ai-check-template/`
- Copies `package-templates/scripts/ai-check.sh`, `ai-check-fast.sh`, and `ai-check-secure.sh`
- Writes package-manager-aware GitHub Actions workflows for the selected `--ci` mode
- Optionally copies Claude Code rules and merges package-manager-aware hook settings when `--claude-hooks` is set
- Optionally seeds `.claude/rules/local/README.md` (overlay guidance) once when `--claude-hooks` is set; an existing README is skipped and never overwritten
- Optionally copies the Review gate PR template and AI code understanding worksheet when `--review-templates` is set
- Writes `.ai-check-template.json` with install metadata

It does not modify `package-templates/`, publish to npm, install dependencies without `--install-deps`, or rewrite existing project-specific tool choices.

## What doctor checks

`doctor` is read-only. It checks the target project for the files and fragments installed by `init`:

- profile-aware package scripts
- missing support package scripts referenced by `ai:check` / `ai:check:fast` / `ai:check:secure`
- package-manager-aware package script invocations
- selected profile docs under `docs/ai-check-template/`
- `scripts/ai-check.sh`, `scripts/ai-check-fast.sh`, and `scripts/ai-check-secure.sh`
- selected package-manager-aware GitHub Actions workflows for `--ci direct` or `--ci reusable`
- optional Claude Code rule and hook settings when `--claude-hooks` is set
- optional Review gate PR template and AI code understanding worksheet when `--review-templates` is set or install state enabled it
- install state validity when `.ai-check-template.json` exists
- profile-specific advisory warnings based on package scripts
- missing referenced package script warnings from `ai:check` / `ai:check:fast` / `ai:check:secure`
- stale managed CI workflow warnings for inactive `--ci` modes

When baseline hashes are recorded (schema v2), `doctor` reports each managed file with one of:

- `ok` — matches the current template
- `drift-upstream` — unmodified locally but behind the template (issue; run `update`)
- `modified-local` — locally customized (warning; `update` keeps it, resolve with `update --diff` / `--force-managed`)
- `drift` — differs and no baseline hash is recorded (issue; byte-comparison fallback)
- `missing` — the managed file does not exist (warning when tracked in the install state, issue otherwise)

The human output also prints the install state `schema-version` so unmigrated v1 states are visible.

It exits with code `0` when no issues are found and code `1` when files are missing, drifted, or the install state is malformed. It does not repair files; use the reported paths to decide whether to run `update --dry-run` and then `update --yes`.

## What update changes

`update` writes current templates and profile scripts to known template-managed paths only:

- profile-aware package scripts
- package-manager-aware package script invocations
- `scripts/ai-check.sh`, `scripts/ai-check-fast.sh`, and `scripts/ai-check-secure.sh`
- selected package-manager-aware GitHub Actions workflows for `--ci direct` or `--ci reusable`
- profile docs under `docs/ai-check-template/` (missing docs are created; existing docs follow the 3-way resolution below)
- inactive exact-managed GitHub Actions workflows from other `--ci` modes
- optional Claude Code rule and package-manager-aware managed hook settings when `--claude-hooks` is set
- optional Review gate PR template and AI code understanding worksheet when `--review-templates` is set or install state enabled it
- `.ai-check-template.json` install state
- missing npm dev dependencies when `--install-deps` is set

It requires `--yes` before writing. Use `--dry-run` to preview operations. It performs package-script profile migrations, missing support script creation, exact-managed workflow cleanup, and optional npm dev dependency install only; semantic merges of arbitrary custom user scripts, external toolchain install, and arbitrary workflow cleanup are still out of scope.

### 3-way update resolution (breaking behavior change)

Before schema v2, `update` always overwrote drifted managed files. Since schema v2, `update` compares three states per managed file — the baseline hash recorded in `.ai-check-template.json`, the local file content, and the upstream (current template) content — and reports one action per file (also in `--json` `operations`):

| Action | Condition | Effect |
|---|---|---|
| `keep` | local == upstream | Nothing to do. The baseline hash is refreshed, including when you applied the upstream content manually. |
| `update` | local == baseline, upstream changed | File is updated to the current template. |
| `skip-modified` | local differs from both baseline and upstream | **Default: the file is kept.** The output explains the choice and points to `--keep-local` / `--force-managed` / `--diff`. |
| `overwrite-forced` | same as above, with `--force-managed` | The file is overwritten after `<file>.bak-<packageVersion>` is written first. |

Files without a baseline hash (v1 state migration, v0.1 manual installs) fall back to byte comparison: identical files are kept, differing files are kept with a warning (never overwritten silently), and the on-disk content is recorded as the new baseline when the update completes. Managed files that were deleted locally are regenerated.

If the previous always-overwrite behavior is required, pin the previous release: `npx -y ai-check-template@0.4.0 update ...`.

### Restoring from a `.bak-<version>` backup

`--force-managed` writes the previous content to `<file>.bak-<packageVersion>` (for example `scripts/ai-check.sh.bak-0.4.0`) before overwriting. To restore a backup:

```bash
mv scripts/ai-check.sh.bak-0.4.0 scripts/ai-check.sh
```

After restoring, the next `update` reports the file as `skip-modified` again and keeps it. Backup files can contain project-specific content (including secrets embedded in customized scripts); add `*.bak-*` to `.gitignore` and do not commit them.

## Local overlay (installer-untouched customization)

Instead of editing managed files directly — which turns them into `skip-modified` and drops them out of automatic `update` tracking — put project-specific customization into the local overlay. The overlay is the first-choice mechanism; the 3-way `skip-modified` handling above is the safety net for files that were edited directly anyway.

Two overlay locations exist, and the installer (`init` / `update` / `doctor`) never manages either of them: they are not in the managed file list, `update` never writes or deletes them, and `doctor` never reports drift for them.

### `scripts/ai-check.local.sh`

Each distributed script (`scripts/ai-check.sh`, `ai-check-fast.sh`, `ai-check-secure.sh`) sources `ai-check.local.sh` from its own directory (independent of the caller's cwd) before delegating to the package manager, when the file exists. Without the file, behavior is unchanged (opt-in).

```bash
# scripts/ai-check.local.sh — committed by you, never distributed or managed
# Override the package manager (the source line runs after PM="${PM:-pnpm}")
PM=npm

# Add a project-specific pre-check
echo "[local] running project-specific pre-check"
```

Notes:

- The file is sourced under `set -euo pipefail`: syntax errors or failures make the script exit non-zero — they are never silently ignored.
- No execute permission is needed; `source` only requires read access.
- The committed content runs as-is (arbitrary code execution at the same trust level as `package.json` scripts). Do not hardcode secrets / tokens / API keys; pass them via environment variables or a secret manager.
- There is one shared local file for all three scripts; branch on `$0` inside it if needed.

### `.claude/rules/local/`

Project-specific Claude Code rules go into `.claude/rules/local/` as separate files, instead of editing the distributed `.claude/rules/test-rules.md`. `init --claude-hooks` seeds a guidance `README.md` there once (reported as `create` in operations, `skip` when it already exists); after that the directory is entirely user territory.

### Migrating existing customizations

If you previously edited managed scripts directly (they show up as `modified-local` in `doctor` / `skip-modified` in `update`):

1. Inspect your changes: `npx -y ai-check-template update --target . --diff`
2. Move the custom parts into `scripts/ai-check.local.sh` (and rule additions into `.claude/rules/local/`)
3. Restore the managed files to the current template: `npx -y ai-check-template update --target . --yes --force-managed` (a `<file>.bak-<version>` backup is written first)
4. Verify with `doctor`: the scripts should report `ok` again, and future updates follow upstream automatically

To roll back, restore the backup (`mv scripts/ai-check.sh.bak-<version> scripts/ai-check.sh`) or simply delete `ai-check.local.sh`; without it the scripts behave exactly as before.

## Safety behavior

- During `init`, existing target files are not overwritten by default.
- During `init`, existing target scripts are not overwritten by default.
- During `init --review-templates`, existing PR templates and worksheets are not overwritten unless `--overwrite` is set.
- During `init` / `update`, existing support scripts such as `lint` and `test` are preserved.
- During `update`, only known template-managed paths are rewritten, and `--yes` is required.
- During `update`, locally modified managed files are kept (`skip-modified`) unless `--force-managed` is set; forced overwrites write a `.bak-<version>` backup first.
- During `update`, inactive workflow files are deleted only when they exactly match packaged managed templates or their package-manager-rendered variants.
- `--install-deps` is the explicit opt-in for dependency install; without it, no package manager install command runs.
- Actual `--install-deps --yes` preflights the package manager binary before target writes.
- `--install-deps --dry-run` prints the command without requiring the package manager binary.
- `--dry-run` writes nothing.
- Invalid profiles are rejected before any target write.
- Malformed install state blocks `update` before any target write.
- `--overwrite` is the explicit opt-in for replacing conflicts.

## Examples

Preview a Next.js setup:

```bash
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --dry-run
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --install-deps --dry-run
```

Preview an npm-based CLI/library setup:

```bash
node bin/ai-check-template.mjs init --target ../app --profile node-cli --package-manager npm --dry-run
```

Apply direct GitHub Actions workflows:

```bash
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --ci direct --yes
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --ci direct --install-deps --yes
```

Apply reusable workflow examples and Claude hooks:

```bash
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs+supabase-rls --ci reusable --claude-hooks --yes
```

Apply the Review gate templates:

```bash
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --ci none --review-templates --yes
node bin/ai-check-template.mjs doctor --target ../app --ci none --review-templates --json
```

Overwrite known conflicts:

```bash
node bin/ai-check-template.mjs init --target ../app --profile node-cli --ci none --yes --overwrite
```

Check an installed setup:

```bash
node bin/ai-check-template.mjs doctor --target ../app
node bin/ai-check-template.mjs doctor --target ../app --ci reusable --claude-hooks --review-templates --json
node bin/ai-check-template.mjs doctor --target ../app --strict --json
```

Preview and apply an update:

```bash
node bin/ai-check-template.mjs update --target ../app --dry-run
node bin/ai-check-template.mjs update --target ../app --yes
node bin/ai-check-template.mjs update --target ../app --ci reusable --claude-hooks --review-templates --json --yes
node bin/ai-check-template.mjs update --target ../app --ci none --dry-run --json
node bin/ai-check-template.mjs update --target ../app --package-manager yarn --dry-run --json
node bin/ai-check-template.mjs update --target ../app --install-deps --dry-run --json
```

## Verification

```bash
node bin/ai-check-template.mjs --help
node bin/ai-check-template.mjs doctor --help
node bin/ai-check-template.mjs update --help
node --test tests/cli/*.test.mjs
npm pack --dry-run --json
npm publish --dry-run --tag latest --json
make validate
```

## Package readiness

SPEC-0016 verifies that the package can be packed and installed from a local tarball before any registry publish happens.

```bash
npm pack --dry-run --json
node --test tests/cli/package.test.mjs
```

The package tests assert that runtime files are included, repository-only SAGE artifacts are excluded, and a tarball-installed `ai-check-template` binary can run both `--help` and `init`.

The package is published to npm as `ai-check-template@0.4.0` under the `latest` dist-tag. It also has an alpha history at `ai-check-template@0.2.0-alpha.0` under the `next` dist-tag. Local tarball smoke remains part of repository validation because it catches package contents regressions before future publishes.

## Publish preflight

For future stable releases, the publish preflight command is:

```bash
npm publish --dry-run --tag latest --json
```

This command validates the publish payload without writing to the registry before a new version is published. Once the current package version already exists in npm, repository validation checks registry visibility instead of attempting another dry-run for the same version. `ai-check-template@0.4.0` has been published to npm and smoke-tested with `npx -y ai-check-template@latest`. Future publishes still require explicit maintainer approval and npm authentication.

## 日本語メモ

この CLI の published stable package は `ai-check-template@0.4.0` です。まず `npx -y ai-check-template init --dry-run` で差分を確認し、問題なければ `init --yes` を付けて実行してください。導入後は `.ai-check-template.json` に選択した profile / package manager / CI / Claude hooks が保存され、`doctor` と `update` は明示 flag がない場合にその state を使います。CLI は profile ごとの package scripts と missing support scripts を導入・診断・更新し、`pnpm` / `npm` / `yarn` / `bun` の script invocation を生成できます。`run` は `ai:check` の各 step を PASS / FAIL / SKIPPED、duration、redacted output 付き JSON にし、`expect` は AC / Test Matrix の JSON / YAML を検証します。`ai:check` は機能品質、`ai:check:secure` は secret scan / dependency audit / supply-chain check / Semgrep SAST の security gate として分離します。`--install-deps --dry-run` は npm dev dependency install command を表示し、`--install-deps --yes` は package manager binary を preflight してから missing dev dependencies を install します。Supabase CLI、Maestro、React Doctor、Semgrep、Secretlint などの external toolchain install は対象外です。profile diagnostics warnings、missing referenced package script warnings、stale managed CI workflow warnings は通常 advisory ですが、CI や release prep では `doctor --strict` で warning を failure として扱えます。`update --dry-run` で更新予定を確認できます。inactive な exact-managed workflow は `update --yes` で cleanup できますが、custom workflow は保持されます。既存ファイルや既存 scripts は `--overwrite` を付けない限り上書きしません。既存 support scripts は `--overwrite` の有無に関係なく保持されます。
