# CLI alpha

`ai-check-template` now includes an alpha CLI foundation for v0.2.0. It is repository-local in this slice and is not an npm-published stable release yet.

Use it to copy the v0.1.0 templates into an existing project with safer defaults than manual copy.

## Command

```bash
node bin/ai-check-template.mjs init --target ../your-project --profile react-nextjs --yes
```

From another project after cloning this repository:

```bash
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile react-nextjs --dry-run
node ../ai-check-template/bin/ai-check-template.mjs init --target . --profile react-nextjs --yes
```

## Options

| Option | Default | Description |
|---|---|---|
| `--target <dir>` | current directory | Existing project directory. It must already contain `package.json`. |
| `--profile <name>` | `react-nextjs` | One base profile: `react-nextjs`, `react-vanilla`, `expo-rn`, or `node-cli`. Add `+supabase-rls` when needed. |
| `--ci <mode>` | `direct` | `direct` copies `ai-check.yml` and `ai-check-fast.yml`; `reusable` copies `ai-quality-reusable.yml` and `ai-quality-call.yml`; `none` skips workflows. |
| `--claude-hooks` | off | Copies `.claude/rules/test-rules.md` and merges the hook fragment into `.claude/settings.json`. |
| `--dry-run` | off | Prints planned operations without writing files. |
| `--yes` | off | Confirms non-interactive writes. Required unless `--dry-run` is used. |
| `--overwrite` | off | Replaces conflicting files or scripts. Without this flag, conflicts are skipped. |

## What init changes

`init` reads from `package-templates/` and may update the target project:

- Merges `ai:check` and `ai:check:fast` from `package-templates/package.scripts.fragment.json`
- Copies `package-templates/scripts/ai-check.sh` and `ai-check-fast.sh`
- Copies GitHub Actions workflows for the selected `--ci` mode
- Optionally copies Claude Code rules and merges hook settings when `--claude-hooks` is set

It does not modify `package-templates/`, publish to npm, install dependencies, or rewrite project-specific tool choices.

## Safety behavior

- Existing target files are not overwritten by default.
- Existing target scripts are not overwritten by default.
- `--dry-run` writes nothing.
- Invalid profiles are rejected before any target write.
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

## Verification

```bash
node bin/ai-check-template.mjs --help
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

この CLI は v0.2.0 alpha foundation です。現時点では npm 公開済みの安定版ではありません。`npm pack` と local tarball smoke で package readiness を検証し、`npm publish --dry-run --tag next --json` で publish preflight を検証しますが、registry への actual publish は別 SPEC で扱います。まず `--dry-run` で差分を確認し、問題なければ `--yes` を付けて実行してください。既存ファイルや既存 scripts は `--overwrite` を付けない限り上書きしません。
