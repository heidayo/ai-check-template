# SPEC-0031: CLI Claude hook package manager rendering

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0031 |
| ステータス | Implemented |
| 作成日    | 2026-05-16 |
| 更新日    | 2026-05-16 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0015, SPEC-0019, SPEC-0026, SPEC-0030 |
| 権限レベル | platform |

## 背景・目的

v0.2.0 alpha の CLI は package scripts を `pnpm` / `npm` / `yarn` / `bun` に応じて生成できるようになった。一方で `init --claude-hooks` / `update --claude-hooks` が target project に配置する `.claude/settings.json` の hook command は template fragment 由来で `pnpm ai:check:*` 固定のままである。

本 SPEC は、Claude hook settings を target project の package manager に合わせて render し、generated package scripts と hook command の不整合を解消する。repository 自身の `.claude/**` と `package-templates/**` は変更せず、CLI runtime で target へ書き込む JSON のみを変換する。

## 対象ユーザー

- `npm` / `yarn` / `bun` project に `ai-check-template init --claude-hooks` を導入する early adopter
- 既存 install state を `update --claude-hooks --package-manager <name>` で修復したい maintainer
- package-manager-aware migrations を CLI の non-doc file にも広げたい CLI developer

## スコープ（含む）

- `src/cli/claude-hooks.mjs` を追加し、Claude hook fragment の known command を package-manager-aware command に変換する
- `init --claude-hooks` が selected / detected package manager で `.claude/settings.json` を生成する
- `init --overwrite --claude-hooks` が既存 managed hook group を selected package manager で置き換える
- `init --claude-hooks` default は既存 hook group を preserve する
- `update --claude-hooks` が effective package manager に合わせて managed hook command を更新する
- dry-run は operation を報告し、target hook settings を書き換えない
- `package.test.mjs` の package smoke に new runtime module を追加する
- README / README-ja / `docs/cli.md` / roadmap / CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- `package-templates/.claude/settings.hook-fragment.json` の内容変更
- repository root の `.claude/**` / `CLAUDE.md` 変更
- hook schema の新規設計または Claude hook 名の変更
- arbitrary command parser の追加
- `doctor` による Claude hook diagnostics
- package scripts / support scripts の追加変更
- npm actual publish / registry smoke
- real dependency install
- `.github/**`, `sage/**`, `.sage/**`, `templates/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/claude-hooks.mjs`（新規）
- `src/cli/init.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0031-cli-claude-hook-package-manager.md`（新規）
- `plans/PLAN-0031-cli-claude-hook-package-manager.md`（新規）
- `tasks/TASK-0115-claude-hook-command-resolver.md`（新規）
- `tasks/TASK-0116-claude-hook-cli-integration.md`（新規）
- `tasks/TASK-0117-claude-hook-tests-docs.md`（新規）
- `tasks/TASK-0118-verify-claude-hook-package-manager.md`（新規）

**変更禁止:**
- `package-templates/**`
- `src/cli/doctor.mjs`
- `src/cli/profile-diagnostics.mjs`
- `src/cli/profile-scripts.mjs`
- `src/cli/dependency-installer.mjs`
- `src/cli/package-manager.mjs`
- `package.json`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「target `.claude/settings.json` に書く hook command だけを runtime render する」「template fragment 自体は変更しない」「unknown hook command はそのまま preserve する」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `package-templates/**` を変更する
- repository root の `.claude/**` / `CLAUDE.md` を変更する
- arbitrary string replacement で JSON を編集する
- unknown hook command を削除または変換する
- default init で既存 hook group を上書きする
- npm publish / real dependency install を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `init --claude-hooks --package-manager npm --yes` は hook command に `npm run ai:check:fast` / `npm run ai:check` を書く
- [FR-02] `init --claude-hooks --package-manager yarn --yes` は hook command に `yarn ai:check:fast` / `yarn ai:check` を書く
- [FR-03] `init --claude-hooks --package-manager bun --yes` は hook command に `bun run ai:check:fast` / `bun run ai:check` を書く
- [FR-04] `init --claude-hooks --package-manager pnpm --yes` は既存互換の `pnpm ai:check:fast` / `pnpm ai:check` を書く
- [FR-05] `init --claude-hooks` default は existing hook group を preserve し、`--overwrite` の場合だけ managed hook group を置き換える
- [FR-06] `update --claude-hooks --package-manager npm --yes --json` は existing managed hook command を `npm run ...` に更新する
- [FR-07] `update --dry-run --claude-hooks --package-manager npm --json` は update operation を表示し、target settings を書き換えない

### 非機能要件

- [NFR-01] CLI runtime dependencies は追加しない
- [NFR-02] hook rendering は deterministic にする
- [NFR-03] hook JSON merge / update は existing object API を使い、string replace しない
- [NFR-04] operation output は init / update の既存形式に合わせる

### セキュリティ要件

- [SEC-01] package manager は existing `validatePackageManager` の allowlist に限定する
- [SEC-02] render 対象 command は known managed commands のみとし、unknown command は preserve する
- [SEC-03] generated hook command に secrets / env values / absolute paths を含めない
- [SEC-04] invalid package manager は target hook writes 前に reject される

### 運用要件

- [OPS-01] PR は Claude hook command rendering のみに限定する
- [OPS-02] hook diagnostics / template fragment redesign は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-07, AC-10 | file existence / package smoke / SAGE validation |
| Gate 2: Functional | AC-02, AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-08, AC-11 | invalid package manager test / secret grep |
| Gate 4: Architecture | AC-09, AC-12 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/claude-hooks.mjs` exists and package smoke includes it
- [x] AC-02: `init --claude-hooks --package-manager npm --yes` writes `npm run ai:check:fast` and `npm run ai:check`, with no generated `pnpm ai:check` command
- [x] AC-03: `init --claude-hooks --package-manager yarn|bun|pnpm --yes` writes package-manager-specific hook commands
- [x] AC-04: `init --claude-hooks` preserves an existing hook group unless `--overwrite` is passed
- [x] AC-05: `init --claude-hooks --overwrite --package-manager npm --yes` replaces an existing managed hook group with npm commands
- [x] AC-06: `update --claude-hooks --package-manager npm --yes --json` updates existing managed hook commands from pnpm to npm and reports `Claude hook` update operations
- [x] AC-07: `update --dry-run --claude-hooks --package-manager npm --json` reports planned hook updates and leaves existing settings unchanged

### 異常系

- [x] AC-08: invalid `--package-manager` rejects before hook settings are written
- [x] AC-09: unknown custom hook command remains unchanged during render / update
- [x] AC-10: `node --test tests/cli/*.test.mjs`, `make validate`, and `bash scripts/sage-validate.sh` pass
- [x] AC-11: secret pattern grep passes and generated hook commands contain no secret-like literals
- [x] AC-12: changed files are File Scope only, with no `package-templates/**`, protected file, npm publish, or real dependency install changes

## 異常系

- 想定エラー1: invalid package manager → existing validation rejects before target writes
- 想定エラー2: existing hook group conflict on init → default skip / preserve、`--overwrite` のみ replace
- 境界ケース1: unknown command in hook entry → preserve without conversion
- 境界ケース2: dry-run update → operation output only、write なし

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | package smoke requiredFiles と new module export/import を修正 |
| AC-02 | npm command rendering を `scriptCommand("npm", scriptName)` 経由に戻す |
| AC-03 | yarn / bun / pnpm rendering table と tests を修正 |
| AC-04 | init merge branch の existing hook preserve logic を戻す |
| AC-05 | init overwrite branch の hook replacement logic を修正 |
| AC-06 | update の effective package manager と expected hook comparison を修正 |
| AC-07 | dry-run branch が write しないよう update path を修正 |
| AC-08 | `validatePackageManager` 呼び出し順を target writes 前に戻す |
| AC-09 | unknown command preserve branch を修正 |
| AC-10 | failing test / validation output に従い該当 TASK scope 内で修正 |
| AC-11 | secret-like literal を削除 |
| AC-12 | out-of-scope diff を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| package manager command mapping regression | `sage/failures.md` | maintainer |
| init hook overwrite regression | `sage/failures.md` | maintainer |
| repeated request for hook diagnostics | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで hook command mismatch / overwrite regression を確認する。
2. 記録: maintainer が command, package manager, expected hook command, actual hook command, operation output を `sage/failures.md` に記録する。
3. 昇格: hook diagnostics / template redesign request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `init` / `update` render Claude hook commands by effective package manager
- Output contract: operations may include `Claude hook <name>` keep / merge / overwrite / update reasons
- npm: actual publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: custom hook command を壊す → known managed command のみ変換し unknown command は preserve
- リスク2: init で既存 hook group を上書きする → default preserve、overwrite test を追加
- リスク3: update が install state と explicit option を混同する → effective package manager の test を追加
- リスク4: package payload missing module → package smoke required file を追加

## 実装メモ

- No runtime dependencies. Use Node stdlib and existing `scriptCommand` / `validatePackageManager`.
- Suggested helper: `renderClaudeHookSettings(fragment, packageManager)`.
- Known managed commands:
  - `pnpm ai:check:fast` → `scriptCommand(packageManager, "ai:check:fast")`
  - `pnpm ai:check` → `scriptCommand(packageManager, "ai:check")`
- Do not mutate the imported fragment object in place.

## Properties

### Invariants

- [INV-01] (Gate 2) init without `--overwrite` never replaces an existing hook group
- [INV-02] (Gate 2) update compares against package-manager-rendered hook settings
- [INV-03] (Gate 3) package manager is always validated by allowlist before render
- [INV-04] (Gate 4) `package-templates/**` content is not modified
- [INV-05] (Gate 3) unknown hook commands are preserved

### Pre-conditions

- [PRE-01] (Gate 2) target project has `package.json`
- [PRE-02] (Gate 2) selected or detected package manager is valid
- [PRE-03] (Gate 2) existing template hook fragment contains managed pnpm commands

### Post-conditions

- [POST-01] (Gate 2) target `.claude/settings.json` hook commands match effective package manager after init/update write path
- [POST-02] (Gate 3) custom unknown hook commands remain unchanged after render/update
- [POST-03] (Gate 4) repository template files and protected files remain unchanged

## 採点

- SPEC-0031: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
