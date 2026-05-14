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
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile react-nextjs --yes
node ../ai-check-template/bin/ai-check-template.mjs doctor --target . --json
node ../ai-check-template/bin/ai-check-template.mjs update --target . --yes
```

## Init options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | `react-nextjs` | One base profile: `react-nextjs`, `react-vanilla`, `expo-rn`, or `node-cli`. Add `+supabase-rls` when needed. |
| `--ci <mode>` | `direct` | `direct` copies `ai-check.yml` and `ai-check-fast.yml`; `reusable` copies `ai-quality-reusable.yml` and `ai-quality-call.yml`; `none` skips workflows. |
| `--claude-hooks` | off | Copies `.claude/rules/test-rules.md` and merges the hook fragment into `.claude/settings.json`. |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` is used. |
| `--overwrite` | off | Replaces conflicting files or scripts. Without this flag, conflicts are skipped. |

## Doctor options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | install state or `react-nextjs` | Profile to check. One base profile plus optional `+supabase-rls`. |
| `--ci <mode>` | `direct` | Checks `direct`, `reusable`, or no workflow files. |
| `--claude-hooks` | off | Checks `.claude/rules/test-rules.md` and required hook keys in `.claude/settings.json`. |
| `--json` | off | Prints `{ status, target, installation, effectiveOptions, issues }` for automation. |

## Update options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | install state or `react-nextjs` | Profile to refresh in install state. One base profile plus optional `+supabase-rls`. |
| `--ci <mode>` | `direct` | Updates `direct`, `reusable`, or no workflow files. |
| `--claude-hooks` | off | Updates `.claude/rules/test-rules.md` and managed hook keys in `.claude/settings.json`. |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` is used. |
| `--json` | off | Prints `{ status, target, installation, effectiveOptions, operations }` for automation. |

## Install state

`init` writes a deterministic `.ai-check-template.json` file at the target project root. The file records schema version, package version, selected profile, CI mode, and whether Claude hooks were enabled. It intentionally does not store timestamps, absolute target paths, environment values, or secrets.

`doctor` and `update` read this file when it exists. Explicit flags still win:

1. CLI flags such as `--profile`, `--ci`, and `--claude-hooks`
2. `.ai-check-template.json`
3. legacy defaults (`react-nextjs`, `direct`, no Claude hooks)

Malformed or unsupported install state is reported by `doctor` as an issue. `update` rejects malformed install state before writing any target files.

## What init changes

`init` reads from `package-templates/` and may update the target project:

- Merges `ai:check` and `ai:check:fast` from `package-templates/package.scripts.fragment.json`
- Copies `package-templates/scripts/ai-check.sh` and `ai-check-fast.sh`
- Copies GitHub Actions workflows for the selected `--ci` mode
- Optionally copies Claude Code rules and merges hook settings when `--claude-hooks` is set
- Writes `.ai-check-template.json` with install metadata

It does not modify `package-templates/`, publish to npm, install dependencies, or rewrite project-specific tool choices.

## What doctor checks

`doctor` is read-only. It checks the target project for the files and fragments installed by `init`:

- `ai:check` and `ai:check:fast` package scripts
- `scripts/ai-check.sh` and `scripts/ai-check-fast.sh`
- selected GitHub Actions workflows for `--ci direct` or `--ci reusable`
- optional Claude Code rule and hook settings when `--claude-hooks` is set
- install state validity when `.ai-check-template.json` exists

It exits with code `0` when no issues are found and code `1` when files are missing, drifted, or the install state is malformed. It does not repair files; use the reported paths to decide whether to run `update --dry-run` and then `update --yes`.

## What update changes

`update` writes current templates to known template-managed paths only:

- `ai:check` and `ai:check:fast` package scripts
- `scripts/ai-check.sh` and `scripts/ai-check-fast.sh`
- selected GitHub Actions workflows for `--ci direct` or `--ci reusable`
- optional Claude Code rule and managed hook settings when `--claude-hooks` is set
- `.ai-check-template.json` install state

It requires `--yes` before writing. Use `--dry-run` to preview operations. It does not perform profile-aware migrations or semantic merges of custom user scripts.

## Safety behavior

- During `init`, existing target files are not overwritten by default.
- During `init`, existing target scripts are not overwritten by default.
- During `update`, only known template-managed paths are rewritten, and `--yes` is required.
- `--dry-run` writes nothing.
- Invalid profiles are rejected before any target write.
- Malformed install state blocks `update` before any target write.
- `--overwrite` is the explicit opt-in for replacing conflicts.

## Examples

Preview a Next.js setup:

```bash
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --dry-run
```

Apply direct GitHub Actions workflows:

```bash
node bin/ai-check-template.mjs init --target ../app --profile react-nextjs --ci direct --yes
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
```

Preview and apply an update:

```bash
node bin/ai-check-template.mjs update --target ../app --dry-run
node bin/ai-check-template.mjs update --target ../app --yes
node bin/ai-check-template.mjs update --target ../app --ci reusable --claude-hooks --json --yes
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

この CLI は v0.2.0 alpha foundation です。現時点では npm 公開済みの安定版ではありません。`npm pack` と local tarball smoke で package readiness を検証し、`npm publish --dry-run --tag next --json` で publish preflight を検証しますが、registry への actual publish は別 SPEC で扱います。まず `init --dry-run` で差分を確認し、問題なければ `init --yes` を付けて実行してください。導入後は `.ai-check-template.json` に選択した profile / CI / Claude hooks が保存され、`doctor` と `update` は明示 flag がない場合にその state を使います。`update --dry-run` で更新予定を確認できます。既存ファイルや既存 scripts は `--overwrite` を付けない限り上書きしません。
