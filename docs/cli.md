# CLI alpha

`ai-check-template` now includes an alpha CLI foundation for v0.2.0. It is repository-local in this slice and is not an npm-published stable release yet.

Use it to copy the v0.1.0 templates into an existing project with safer defaults than manual copy.

## Command

```bash
node bin/ai-check-template.mjs init --target ../your-project --profile react-nextjs --yes
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
```

## Init options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | `react-nextjs` | One base profile: `react-nextjs`, `react-vanilla`, `expo-rn`, or `node-cli`. Add `+supabase-rls` when needed. |
| `--package-manager <name>` | target detection or `pnpm` | Package manager for generated package scripts: `pnpm`, `npm`, `yarn`, or `bun`. |
| `--ci <mode>` | `direct` | `direct` writes package-manager-aware `ai-check.yml` and `ai-check-fast.yml`; `reusable` writes `ai-quality-reusable.yml` plus a package-manager-aware `ai-quality-call.yml`; `none` skips workflows. |
| `--claude-hooks` | off | Copies `.claude/rules/test-rules.md` and merges package-manager-aware hook commands into `.claude/settings.json`. |
| `--install-deps` | off | Installs missing npm dev dependencies for generated package scripts. With `--dry-run`, prints the command without executing it. |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` is used. |
| `--overwrite` | off | Replaces conflicting files or scripts. Without this flag, conflicts are skipped. |

## Doctor options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | install state or `react-nextjs` | Profile to check. One base profile plus optional `+supabase-rls`. |
| `--package-manager <name>` | install state, target detection, or `pnpm` | Package manager used when checking package scripts: `pnpm`, `npm`, `yarn`, or `bun`. |
| `--ci <mode>` | `direct` | Checks `direct`, `reusable`, or no workflow files. |
| `--claude-hooks` | off | Checks `.claude/rules/test-rules.md` and required hook keys in `.claude/settings.json`. |
| `--strict` | off | Treats profile diagnostics warnings as a failing result while keeping them in `warnings`. |
| `--json` | off | Prints `{ status, target, strict, installation, effectiveOptions, warnings, issues }` for automation. |

## Update options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | install state or `react-nextjs` | Profile to refresh in install state. One base profile plus optional `+supabase-rls`. |
| `--package-manager <name>` | install state, target detection, or `pnpm` | Package manager used when refreshing package scripts: `pnpm`, `npm`, `yarn`, or `bun`. |
| `--ci <mode>` | `direct` | Updates package-manager-aware `direct`, `reusable`, or no workflow files. |
| `--claude-hooks` | off | Updates `.claude/rules/test-rules.md` and managed package-manager-aware hook keys in `.claude/settings.json`. |
| `--install-deps` | off | Installs missing npm dev dependencies for generated package scripts. With `--dry-run`, prints the command without executing it. |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` is used. |
| `--json` | off | Prints `{ status, target, installation, effectiveOptions, operations }` for automation. |

## Install state

`init` writes a deterministic `.ai-check-template.json` file at the target project root. The file records schema version, package version, selected profile, package manager, CI mode, and whether Claude hooks were enabled. It intentionally does not store timestamps, absolute target paths, environment values, or secrets.

`doctor` and `update` read this file when it exists. Explicit flags still win:

1. CLI flags such as `--profile`, `--package-manager`, `--ci`, and `--claude-hooks`
2. `.ai-check-template.json`
3. target detection for package manager (`packageManager` field, then lockfiles)
4. legacy defaults (`react-nextjs`, `pnpm`, `direct`, no Claude hooks)

Malformed or unsupported install state is reported by `doctor` as an issue. `update` rejects malformed install state before writing any target files.

## Package manager detection

The CLI alpha generates profile-aware package scripts for `pnpm`, `npm`, `yarn`, and `bun`. Detection uses:

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

When `--ci reusable` is set, `ai-quality-reusable.yml` remains the generic reusable workflow and `ai-quality-call.yml` receives package-manager-specific `package-manager` and `check-command` inputs. `doctor` compares selected workflows against the rendered content for the effective package manager. `update --ci none` cleans up inactive workflows only when their content exactly matches one of the managed rendered variants; custom workflow content is preserved.

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
- `expo-rn`: Playwright / React Doctor mismatch for mobile projects
- `node-cli`: UI E2E mismatch for CLI or library projects
- `supabase-rls`: missing RLS-related DB / integration test scripts
- `ai:check` / `ai:check:fast`: missing referenced package scripts such as `typecheck`, `lint`, or `test:unit`

Warnings remain advisory by default in this alpha. `doctor --strict` is available for stricter local or CI checks. Missing script diagnostics do not install dependencies or create scripts; profile-specific file / CI migrations remain future work.

## CI diagnostics

`doctor` reports `ci-advice` warnings when workflow files from an inactive `--ci` mode still exist and exactly match the packaged templates:

- `--ci none`: warns about managed direct and reusable workflow files
- `--ci direct`: warns about managed reusable workflow files
- `--ci reusable`: warns about managed direct workflow files

Custom workflows with the same paths are not treated as stale managed files unless their contents exactly match the packaged template. `update` can clean up exact-managed inactive workflows; custom workflows are preserved.

## Profile-aware scripts

The manual `package-templates/package.scripts.fragment.json` remains a generic copy-and-adapt fragment. The CLI alpha uses a profile-aware script resolver instead:

- `react-nextjs` adds React Doctor and dead-code checks to `ai:check`
- `react-vanilla` keeps SPA scripts without Next.js-specific commands
- `expo-rn` keeps mobile-oriented smoke E2E defaults
- `node-cli` excludes UI E2E from `ai:check`
- `supabase-rls` adds `test:db` and `test:integration:rls`

`init` merges the selected profile scripts. `doctor` checks the effective profile scripts. `update` migrates known managed package scripts to the effective profile, with explicit `--profile` and `--package-manager` taking precedence over install state.

## Profile document migrations

`init` and `update` copy profile guidance into the target project under `docs/ai-check-template/`.

The copied set includes:

- `docs/test-design-template.md`
- `docs/philosophy/*.md`
- `prompts/diagnostic-repair.md`
- `profiles/README.md`
- the selected base profile README, such as `profiles/react-nextjs/README.md` or `profiles/node-cli/README.md`
- selected addon profile READMEs, such as `profiles/supabase-rls/README.md`

The target layout preserves the package-template-like `docs/`, `prompts/`, and `profiles/` structure so existing relative links in the copied Markdown continue to work. `init` skips existing files by default and follows `--overwrite` for conflicts. `update` creates missing docs only and keeps existing target docs unchanged.

## Support script defaults

`init` and `update` also add missing support package scripts referenced by `ai:check` / `ai:check:fast`, such as `typecheck`, `lint`, `test`, `test:unit`, and for `react-nextjs`, `test:e2e:smoke`.

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
- External tools such as Supabase CLI, Maestro, and React Doctor are not installed by this flag. React Doctor remains invoked through the generated `npx -y react-doctor@latest` script.

## What init changes

`init` reads from `package-templates/` and the CLI profile resolver, then may update the target project:

- Merges profile-aware package scripts for the selected `--profile`
- Adds missing support package scripts while preserving existing user scripts
- Uses the selected or detected package manager for generated package script invocations
- Optionally installs missing npm dev dependencies when `--install-deps` is set
- Copies common test design / philosophy docs and selected profile docs under `docs/ai-check-template/`
- Copies `package-templates/scripts/ai-check.sh` and `ai-check-fast.sh`
- Writes package-manager-aware GitHub Actions workflows for the selected `--ci` mode
- Optionally copies Claude Code rules and merges package-manager-aware hook settings when `--claude-hooks` is set
- Writes `.ai-check-template.json` with install metadata

It does not modify `package-templates/`, publish to npm, install dependencies without `--install-deps`, or rewrite existing project-specific tool choices.

## What doctor checks

`doctor` is read-only. It checks the target project for the files and fragments installed by `init`:

- profile-aware package scripts
- missing support package scripts referenced by `ai:check` / `ai:check:fast`
- package-manager-aware package script invocations
- selected profile docs under `docs/ai-check-template/`
- `scripts/ai-check.sh` and `scripts/ai-check-fast.sh`
- selected package-manager-aware GitHub Actions workflows for `--ci direct` or `--ci reusable`
- optional Claude Code rule and hook settings when `--claude-hooks` is set
- install state validity when `.ai-check-template.json` exists
- profile-specific advisory warnings based on package scripts
- missing referenced package script warnings from `ai:check` / `ai:check:fast`
- stale managed CI workflow warnings for inactive `--ci` modes

It exits with code `0` when no issues are found and code `1` when files are missing, drifted, or the install state is malformed. It does not repair files; use the reported paths to decide whether to run `update --dry-run` and then `update --yes`.

## What update changes

`update` writes current templates and profile scripts to known template-managed paths only:

- profile-aware package scripts
- package-manager-aware package script invocations
- `scripts/ai-check.sh` and `scripts/ai-check-fast.sh`
- selected package-manager-aware GitHub Actions workflows for `--ci direct` or `--ci reusable`
- missing profile docs under `docs/ai-check-template/`
- inactive exact-managed GitHub Actions workflows from other `--ci` modes
- optional Claude Code rule and package-manager-aware managed hook settings when `--claude-hooks` is set
- `.ai-check-template.json` install state
- missing npm dev dependencies when `--install-deps` is set

It requires `--yes` before writing. Use `--dry-run` to preview operations. It performs package-script profile migrations, missing support script creation, exact-managed workflow cleanup, and optional npm dev dependency install only; semantic merges of arbitrary custom user scripts, external toolchain install, and arbitrary workflow cleanup are still out of scope.

## Safety behavior

- During `init`, existing target files are not overwritten by default.
- During `init`, existing target scripts are not overwritten by default.
- During `init` / `update`, existing support scripts such as `lint` and `test` are preserved.
- During `update`, only known template-managed non-doc paths are rewritten, and `--yes` is required.
- During `update`, existing files under `docs/ai-check-template/` are kept instead of overwritten.
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

Overwrite known conflicts:

```bash
node bin/ai-check-template.mjs init --target ../app --profile node-cli --ci none --yes --overwrite
```

Check an installed setup:

```bash
node bin/ai-check-template.mjs doctor --target ../app
node bin/ai-check-template.mjs doctor --target ../app --ci reusable --claude-hooks --json
node bin/ai-check-template.mjs doctor --target ../app --strict --json
```

Preview and apply an update:

```bash
node bin/ai-check-template.mjs update --target ../app --dry-run
node bin/ai-check-template.mjs update --target ../app --yes
node bin/ai-check-template.mjs update --target ../app --ci reusable --claude-hooks --json --yes
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
npm publish --dry-run --tag next --json
make validate
```

## Package readiness

SPEC-0016 verifies that the package can be packed and installed from a local tarball before any registry publish happens.

```bash
npm pack --dry-run --json
node --test tests/cli/package.test.mjs
```

The package tests assert that runtime files are included, repository-only SAGE artifacts are excluded, and a tarball-installed `ai-check-template` binary can run both `--help` and `init`.

This still does not mean the package is published to npm. Until the publish SPEC is complete, use a local clone or local tarball for CLI trials.

## Publish preflight

Because `0.2.0-alpha.0` is a prerelease version, npm requires an explicit dist-tag. The publish preflight command is:

```bash
npm publish --dry-run --tag next --json
```

This command validates the publish payload without writing to the registry. Actual `npm publish --tag next` requires explicit maintainer approval and npm authentication, and is not performed by repository validation.

## 日本語メモ

この CLI は v0.2.0 alpha foundation です。現時点では npm 公開済みの安定版ではありません。`npm pack` と local tarball smoke で package readiness を検証し、`npm publish --dry-run --tag next --json` で publish preflight を検証しますが、registry への actual publish は別 SPEC で扱います。まず `init --dry-run` で差分を確認し、問題なければ `init --yes` を付けて実行してください。導入後は `.ai-check-template.json` に選択した profile / package manager / CI / Claude hooks が保存され、`doctor` と `update` は明示 flag がない場合にその state を使います。CLI alpha は profile ごとの package scripts と missing support scripts を導入・診断・更新し、`pnpm` / `npm` / `yarn` / `bun` の script invocation を生成できます。`--install-deps --dry-run` は npm dev dependency install command を表示し、`--install-deps --yes` は package manager binary を preflight してから missing dev dependencies を install します。Supabase CLI、Maestro、React Doctor などの external toolchain install は対象外です。profile diagnostics warnings、missing referenced package script warnings、stale managed CI workflow warnings は通常 advisory ですが、CI や release prep では `doctor --strict` で warning を failure として扱えます。`update --dry-run` で更新予定を確認できます。inactive な exact-managed workflow は `update --yes` で cleanup できますが、custom workflow は保持されます。既存ファイルや既存 scripts は `--overwrite` を付けない限り上書きしません。既存 support scripts は `--overwrite` の有無に関係なく保持されます。
