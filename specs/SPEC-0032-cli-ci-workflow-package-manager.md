# SPEC-0032: CLI CI workflow package manager rendering

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0032 |
| ステータス | Implemented |
| 作成日    | 2026-05-16 |
| 更新日    | 2026-05-16 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0015, SPEC-0019, SPEC-0025, SPEC-0026, SPEC-0031 |
| 権限レベル | platform |

## 背景・目的

v0.2.0 alpha の CLI は package scripts と Claude hook command を package manager aware に生成できる。一方で `init --ci direct|reusable` / `update --ci direct|reusable` が target project に配置する GitHub Actions workflow は `package-templates/**` 由来で `pnpm` 固定のままである。

本 SPEC は、CLI が target project に書く CI workflow を effective package manager に合わせて render する。`package-templates/**` は manual copy 用の generic example として変更せず、CLI runtime の write / doctor / cleanup path のみを更新する。

## 対象ユーザー

- `npm` / `yarn` / `bun` project に `ai-check-template init --ci direct|reusable` を導入する early adopter
- package manager を変更した target project を `update --package-manager <name>` で修復したい maintainer
- npm publish 前に `npx ai-check-template init` の生成物を package manager aware に揃えたい CLI developer

## スコープ（含む）

- `src/cli/ci-workflows.mjs` を追加し、managed CI workflow content を package manager aware に render する
- `init --ci direct|reusable` が selected / detected package manager で workflow を作成する
- `update --ci direct|reusable` が effective package manager で managed workflow を更新する
- `doctor --ci direct|reusable` が rendered workflow と比較する
- inactive managed workflow cleanup / diagnostics が pnpm だけでなく rendered variants を managed として扱う
- package smoke に new runtime module を追加する
- README / README-ja / `docs/cli.md` / roadmap / CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- `package-templates/ci-examples/**` の内容変更
- repository root `.github/workflows/**` の変更
- GitHub Actions reusable workflow の hosted contract 化
- Composite Action / Marketplace
- profile-specific workflow job matrix
- arbitrary YAML parser dependency の追加
- npm actual publish / registry write
- real dependency install
- `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/ci-workflows.mjs`（新規）
- `src/cli/init.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `src/cli/doctor.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0032-cli-ci-workflow-package-manager.md`（新規）
- `plans/PLAN-0032-cli-ci-workflow-package-manager.md`（新規）
- `tasks/TASK-0119-ci-workflow-renderer.md`（新規）
- `tasks/TASK-0120-ci-workflow-cli-integration.md`（新規）
- `tasks/TASK-0121-ci-workflow-tests-docs.md`（新規）
- `tasks/TASK-0122-verify-ci-workflow-package-manager.md`（新規）

**変更禁止:**
- `package-templates/**`
- `.github/**`
- `src/cli/package-manager.mjs`
- `src/cli/profile-scripts.mjs`
- `src/cli/dependency-installer.mjs`
- `package.json`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「target `.github/workflows/**` に書く managed workflow だけを runtime render する」「template workflow 自体は変更しない」「custom workflow は cleanup / update で保持する」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `package-templates/**` または repository `.github/**` を変更する
- arbitrary broad string replacement で未知の YAML を編集する
- custom workflow を managed と誤判定して削除する
- npm publish / real dependency install を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `init --ci direct --package-manager npm --yes` は direct workflows に `npm ci` と `npm run ai:check*` を書く
- [FR-02] `init --ci direct --package-manager yarn|bun|pnpm --yes` は package-manager-specific install / check command を書く
- [FR-03] `init --ci reusable --package-manager npm --yes` は caller workflow に `package-manager: npm` と `check-command: npm run ai:check` を書く
- [FR-04] `update --ci direct --package-manager npm --yes --json` は existing managed pnpm direct workflows を npm workflows に更新する
- [FR-05] `doctor --ci direct --package-manager npm --json` は npm-rendered workflows を healthy と扱い、pnpm-rendered direct workflows を drift と扱う
- [FR-06] inactive cleanup / diagnostics は rendered variants of managed workflows を inactive managed workflow として扱う
- [FR-07] custom workflow content は cleanup されず keep / warningなしの既存挙動を維持する

### 非機能要件

- [NFR-01] CLI runtime dependencies は追加しない
- [NFR-02] workflow rendering は deterministic にする
- [NFR-03] renderer は fixed template file names のみ扱う
- [NFR-04] operation output は init / update / doctor の既存形式に合わせる

### セキュリティ要件

- [SEC-01] package manager は existing `validatePackageManager` の allowlist に限定する
- [SEC-02] generated workflow command に secrets / env values / absolute paths を含めない
- [SEC-03] cleanup managed detection は rendered template variants の exact match のみに限定する
- [SEC-04] invalid package manager は target workflow writes 前に reject される

### 運用要件

- [OPS-01] PR は CLI-generated CI workflow rendering のみに限定する
- [OPS-02] actual npm publish は follow-up release operation として分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-11 | file existence / package smoke / SAGE validation |
| Gate 2: Functional | AC-02, AC-03, AC-04, AC-05, AC-06, AC-07 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-08, AC-12 | invalid package manager test / secret grep |
| Gate 4: Architecture | AC-09, AC-13 | File Scope / protected file check |
| Gate 5: Release | N/A | actual npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/ci-workflows.mjs` exists and package smoke includes it
- [x] AC-02: `init --ci direct --package-manager npm --yes` writes `npm ci`, `npm run ai:check`, and `npm run ai:check:fast`, with no generated `pnpm install` / `pnpm ai:check` direct workflow command
- [x] AC-03: `init --ci direct --package-manager yarn|bun|pnpm --yes` writes package-manager-specific install and check commands
- [x] AC-04: `init --ci reusable --package-manager npm --yes` writes caller workflow inputs for `npm` and `npm run ai:check`
- [x] AC-05: `update --ci direct --package-manager npm --yes --json` updates existing managed pnpm workflows to npm workflows and reports workflow update operations
- [x] AC-06: `doctor --ci direct --package-manager npm --json` passes for npm-rendered workflows
- [x] AC-07: inactive managed workflow cleanup recognizes rendered variants and keeps custom workflows unchanged

### 異常系

- [x] AC-08: invalid `--package-manager` rejects before workflow files are written
- [x] AC-09: custom workflow content remains unchanged during update / cleanup
- [x] AC-10: `node --test tests/cli/*.test.mjs`, `make validate`, and `bash scripts/sage-validate.sh` pass
- [x] AC-11: package smoke includes `src/cli/ci-workflows.mjs`
- [x] AC-12: secret pattern grep passes and generated workflows contain no secret-like literals
- [x] AC-13: changed files are File Scope only, with no `package-templates/**`, protected file, npm publish, or real dependency install changes

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 / AC-11 | package smoke requiredFiles と new module export/import を修正 |
| AC-02 / AC-03 | direct workflow renderer の install/check command table を修正 |
| AC-04 | reusable caller renderer の package-manager / check-command mapping を修正 |
| AC-05 | update path が rendered workflow content を使うよう修正 |
| AC-06 | doctor expected workflow content を rendered content に差し替える |
| AC-07 / AC-09 | managed exact-match detection を all package manager variants に限定して修正 |
| AC-08 | `validatePackageManager` 呼び出し順を target writes 前に戻す |
| AC-10 | failing validation output に従い該当 TASK scope 内で修正 |
| AC-12 | secret-like literal を削除 |
| AC-13 | out-of-scope diff を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| CI workflow package manager mismatch | `sage/failures.md` | maintainer |
| custom workflow cleanup regression | `sage/failures.md` | maintainer |
| repeated request for profile-specific CI matrix | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで workflow command mismatch / custom cleanup regression を確認する。
2. 記録: maintainer が command, package manager, expected workflow snippet, actual workflow snippet, operation output を `sage/failures.md` に記録する。
3. 昇格: profile-specific CI matrix request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `init` / `update` / `doctor` render and compare managed GitHub Actions workflows by effective package manager
- Output contract: operations may include `.github/workflows/*.yml` copy / update / keep / delete actions
- npm: actual publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: custom workflow を削除する → rendered template variants の exact match のみ managed 扱い
- リスク2: npm/yarn/bun workflow が generated package scripts と不一致 → `scriptCommand` を check command に使う
- リスク3: package templates と CLI output の意図が混ざる → package templates は変更禁止、runtime render に限定
- リスク4: package payload missing module → package smoke required file を追加

## Properties

### Invariants

- [INV-01] (Gate 2) direct workflow check command matches effective package manager
- [INV-02] (Gate 2) reusable caller check-command matches effective package manager
- [INV-03] (Gate 3) cleanup deletes only exact managed rendered workflow variants
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) target project has `package.json`
- [PRE-02] (Gate 2) selected or detected package manager is valid
- [PRE-03] (Gate 2) packaged CI templates from v0.1.0 exist

### Post-conditions

- [POST-01] (Gate 2) target workflow commands match effective package manager after init/update write path
- [POST-02] (Gate 3) custom workflow content remains unchanged after update/cleanup
- [POST-03] (Gate 4) repository templates and protected files remain unchanged

## 採点

- SPEC-0032: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
