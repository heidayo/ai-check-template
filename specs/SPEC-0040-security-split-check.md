# SPEC-0040: Security split check

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0040 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0038 |
| 権限レベル | platform |

## 背景・目的

`ai-check-template` は AI 生成コードを post-implementation verification stack として検証する。現在の `ai:check` は typecheck / lint / test / diagnostics / E2E などの機能品質を中心に扱うが、Semgrep のような security scan は独立した gate として扱う方が運用しやすい。

本 SPEC では、機能品質の `ai:check` とセキュリティ診断の `ai:check:secure` を分離し、AI 生成コードの "works" と "safe enough" を別の証拠として扱えるようにする。

## 対象ユーザー

- AI 生成コードを PR 前に検証する開発者
- CI で機能品質とセキュリティ診断を別 job / 別 command として運用したいチーム
- `init`, `doctor`, `update` で profile scripts を管理する CLI 利用者

## スコープ（含む）

- `package-templates/package.scripts.fragment.json` に `ai:check:secure` を追加する
- `package-templates/scripts/ai-check-secure.sh` を追加する
- CLI `init` / `doctor` / `update` が `scripts/ai-check-secure.sh` と `ai:check:secure` を扱う
- profile scripts が全 base profile に `ai:check:secure: semgrep scan --config auto` を生成する
- profile diagnostics の missing referenced script scan に `ai:check:secure` を含める
- package template README、scripts README、profile README、CLI docs、usage model、README / README-ja を更新する
- Makefile structural validation と CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点し、検証結果を記録する

## スコープ外（明示的に除外）

- `ai:check` に Semgrep を混ぜる変更
- Semgrep を npm dev dependency として自動 install する変更
- GitHub Actions workflow / hosted workflow / Composite Action の contract 変更
- Semgrep config file の追加
- security finding auto-fix / Draft PR automation
- root repository security policy (`SECURITY.md`) の変更
- React Doctor / Expo profile assumption correction
- `CLAUDE.md`, `.claude/**`, `sage/**`, `.sage/**`, `templates/**` の変更
- npm publish / tag / release mutation

## File Scope

**書き込み許可:**
- `package-templates/package.scripts.fragment.json`
- `package-templates/scripts/ai-check-secure.sh`（新規）
- `package-templates/scripts/README.md`
- `package-templates/README.md`
- `package-templates/profiles/README.md`
- `package-templates/profiles/react-nextjs/README.md`
- `package-templates/profiles/react-vanilla/README.md`
- `package-templates/profiles/expo-rn/README.md`
- `package-templates/profiles/node-cli/README.md`
- `package-templates/profiles/supabase-rls/README.md`
- `src/cli/profile-scripts.mjs`
- `src/cli/profile-diagnostics.mjs`
- `src/cli/init.mjs`
- `src/cli/doctor.mjs`
- `src/cli/update.mjs`
- `tests/cli/init.test.mjs`
- `tests/cli/doctor.test.mjs`
- `tests/cli/update.test.mjs`
- `tests/cli/package.test.mjs`
- `docs/cli.md`
- `docs/usage-model.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`
- `Makefile`
- `specs/SPEC-0040-security-split-check.md`
- `plans/PLAN-0040-security-split-check.md`
- `tasks/TASK-0147-security-script-template.md`
- `tasks/TASK-0148-security-cli-integration.md`
- `tasks/TASK-0149-security-docs-validation.md`
- `tasks/TASK-0150-security-tests.md`
- `tasks/TASK-0151-verify-security-split.md`

**変更禁止:**
- `.github/workflows/**`
- `ai-quality/action.yml`
- `package.json`
- `bin/**`
- `examples/**`
- root `SECURITY.md`
- `CLAUDE.md`, `.claude/**`
- `sage/**`, `.sage/**`, `templates/**`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「`ai:check` と `ai:check:secure` を混在させない」「Semgrep install を自動化しない」「workflow contract を変更しない」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに runtime / CLI 変更へ進む
- File Scope 外の変更
- `ai:check` に security scan を混ぜる
- Semgrep config や dependency install を根拠なしに追加する
- failing tests を無視する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `ai:check:secure` は `semgrep scan --config auto` を実行する独立 package script として生成される
- [FR-02] `scripts/ai-check-secure.sh` は `${PM:-pnpm} ai:check:secure` を呼び出す
- [FR-03] CLI `init` は secure shell script をコピーし、profile scripts に `ai:check:secure` を追加する
- [FR-04] CLI `doctor` は secure shell script と `ai:check:secure` の missing / drift を検出する
- [FR-05] CLI `update` は secure shell script と `ai:check:secure` を作成または修復する
- [FR-06] docs は `ai:check` が機能品質、`ai:check:secure` が security gate であることを説明する

### 非機能要件

- [NFR-01] package manager rendering は `ai:check:secure` に不要な変換をしない
- [NFR-02] existing `ai:check` / `ai:check:fast` contract は変えない
- [NFR-03] validation は dependency install なしで pass する

### セキュリティ要件

- [SEC-01] security scan は機能品質 gate と独立して実行できる
- [SEC-02] docs に secret / private URL を含めない
- [SEC-03] Semgrep findings を AI の自己申告ではなく deterministic tool output として扱う

### 運用要件

- [OPS-01] Semgrep binary / config の導入は利用者側 responsibility として docs に明記する
- [OPS-02] Hosted workflow は `check-command: pnpm ai:check:secure` でも使えることを docs に示すが、workflow file は変更しない
- [OPS-03] `make validate` と GitHub Actions `validate` pass 後に merge する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | file existence / docs grep |
| Gate 2: Functional | AC-04, AC-05 | CLI tests / `make validate` |
| Gate 3: Security | AC-06 | secret grep / security split semantics |
| Gate 4: Architecture | AC-07 | File Scope / protected file check |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `package-templates/package.scripts.fragment.json` and profile-generated scripts include `ai:check:secure`
- [x] AC-02: `package-templates/scripts/ai-check-secure.sh` exists, passes `bash -n`, and delegates to `${PM} ai:check:secure`
- [x] AC-03: docs mention `ai:check:secure`, Semgrep, and the separation from `ai:check`
- [x] AC-04: `init`, `doctor`, and `update` tests cover secure script/package script behavior
- [x] AC-05: `Makefile` validates secure script, docs, and tests

### 異常系

- [x] AC-06: changed files contain no secret / private URL literal
- [x] AC-07: changed files are File Scope only, with no workflow / action / package metadata / protected file changes
- [x] AC-08: `node --test tests/cli/*.test.mjs`, `make validate`, `bash scripts/sage-validate.sh`, and `git diff --check` pass

## 異常系

- 想定エラー1: `ai:check` に Semgrep を混ぜて local loop が重くなる
- 想定エラー2: Semgrep が未導入の導入先で security script が失敗する
- 境界ケース1: CI で security gate だけ別 workflow / reusable workflow command として走らせたい

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | profile scripts and package fragment に `ai:check:secure` を追加 |
| AC-02 | secure shell script を追加し `bash -n` を通す |
| AC-03 | docs に separation wording と Semgrep responsibility を追加 |
| AC-04 | CLI tests に init/doctor/update/pack coverage を追加 |
| AC-05 | Makefile guard を exact files / phrases に narrow |
| AC-06 | secret / private URL literal を削除 |
| AC-07 | out-of-scope diff を取り除く |
| AC-08 | failing validation output に従い File Scope 内で修正 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| Semgrep install responsibility confusion | `sage/failures.md` | maintainer |
| security gate false positive pattern | `sage/failures.md` | maintainer |
| users want hosted security job template | future SPEC | maintainer |

## 契約

- API: なし
- DB: なし
- CLI: `init` / `doctor` / `update` now manage `ai:check:secure` and `scripts/ai-check-secure.sh`
- GitHub Actions: workflow behavior unchanged; users may pass `check-command: pnpm ai:check:secure`
- package scripts: `ai:check` and `ai:check:fast` commands remain unchanged
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: Semgrep 未導入で `ai:check:secure` が失敗する → docs に external tool responsibility を明記
- リスク2: 既存導入先で doctor が missing secure script を検出する → `update --yes` で作成可能にする
- リスク3: Security scan を AI repair と混同する → deterministic tool output として docs に明記

## Properties

### Invariants

- [INV-01] (Gate 4) GitHub Actions workflow and Composite Action contracts remain unchanged
- [INV-02] (Gate 2) existing `ai:check` and `ai:check:fast` commands remain unchanged
- [INV-03] (Gate 3) `ai:check:secure` is independent from functional quality gate

### Pre-conditions

- [PRE-01] (Gate 1) profile script generation already supports package-manager rendering
- [PRE-02] (Gate 1) Semgrep is treated as an external user-provided tool

### Post-conditions

- [POST-01] (Gate 2) `init` installs secure check script and package script
- [POST-02] (Gate 2) `doctor` detects secure check drift
- [POST-03] (Gate 2) `update` repairs secure check drift

### Assumptions

- [ASM-01] (Gate 横断) `semgrep scan --config auto` is the default portable security command

## 採点

- SPEC-0040: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）

## 関連ID

- PLAN-ID: PLAN-0040
- TASK-ID: TASK-0147, TASK-0148, TASK-0149, TASK-0150, TASK-0151
