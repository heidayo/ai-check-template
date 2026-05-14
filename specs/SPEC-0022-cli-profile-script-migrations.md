# SPEC-0022: CLI profile script migrations

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0022 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0020, SPEC-0021 |
| 権限レベル | platform |

## 背景・目的

SPEC-0020 で install state が入り、SPEC-0021 で profile diagnostics warnings が入ったが、`init` / `doctor` / `update` が期待する package scripts はまだ `package-templates/package.scripts.fragment.json` の generic scripts に固定されている。そのため `node-cli` や `supabase-rls` のように profile README で異なる `ai:check` 構成を推奨している場合、CLI の導入・診断・更新が profile の意図に追従しない。

本 SPEC は CLI 側に profile script resolver を追加し、`init` / `doctor` / `update` が effective profile に応じた package scripts を扱うようにする。`package-templates/**` は変更せず、v0.2.0 alpha の profile-aware update migration foundation に限定する。

## 対象ユーザー

- `--profile node-cli` で UI E2E を含まない scripts を導入したい CLI / library maintainer
- `--profile react-nextjs+supabase-rls` で RLS test scripts を導入・更新したい early adopter
- profile README と CLI behavior を一致させたい maintainer

## スコープ（含む）

- `src/cli/profile-scripts.mjs` を追加し、profile ごとの expected package scripts を定義する
- `init` が selected profile に応じた scripts を merge する
- `doctor` が effective profile に応じた scripts を drift check する
- `update` が effective profile に応じた scripts へ migrate / refresh する
- `supabase-rls` addon は `test:db` と `test:integration:rls` scripts を追加対象に含める
- package tests / init tests / doctor tests / update tests / README / README-ja / `docs/cli.md` / roadmap を更新する

## スコープ外（明示的に除外）

- `package-templates/**` の変更
- shell scripts / CI workflow content の profile-specific 変更
- dependency install
- package manager auto-detection
- strict warning failure mode
- semantic merge of arbitrary user scripts
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/profile-scripts.mjs`（新規）
- `src/cli/init.mjs`（更新）
- `src/cli/doctor.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0022-cli-profile-script-migrations.md`（新規）
- `plans/PLAN-0022-cli-profile-script-migrations.md`（新規）
- `tasks/TASK-0084-profile-scripts-resolver.md`（新規）
- `tasks/TASK-0085-profile-script-cli-integration.md`（新規）
- `tasks/TASK-0086-profile-script-tests-docs.md`（新規）
- `tasks/TASK-0087-verify-cli-profile-script-migrations.md`（新規）

**変更禁止:**
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。target project 内の `.claude/**` は既存 optional output のままで、profile script migration には含めない。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `package-templates/**` を変更する
- `update --dry-run` で package scripts を書く
- `init` の conflict skip semantics を壊す
- warning や diagnostic を exit failure にする
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] profile script resolver は base profile と addon profile から deterministic package scripts object を返す
- [FR-02] `init --profile node-cli --ci none --yes` は UI E2E を含まない `ai:check` を merge する
- [FR-03] `init --profile react-nextjs+supabase-rls --ci none --yes` は `test:db` と `test:integration:rls` scripts を merge する
- [FR-04] `doctor` は effective profile scripts と target package scripts を比較する
- [FR-05] `update` は effective profile scripts へ package scripts を migrate する
- [FR-06] `update --dry-run` は profile script migration operations を出すが target を変更しない
- [FR-07] explicit `--profile` は install state より優先され、`update` 後の install state に反映される
- [FR-08] package tarball に `src/cli/profile-scripts.mjs` が含まれる

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] profile scripts are deterministic and use stable script names
- [NFR-03] existing conflict behavior for `init` remains: existing scripts are skipped unless `--overwrite`
- [NFR-04] `doctor` and `update` output should remain additive / compatible where possible

### セキュリティ要件

- [SEC-01] profile script resolver は secret / absolute target path / environment values を保存・出力しない
- [SEC-02] malformed profile remains rejected by existing profile parser before writes
- [SEC-03] CLI code / docs / tests に secret 直書きパターンを含めない

### 運用要件

- [OPS-01] PR は profile script migration foundation のみを扱う
- [OPS-02] package manager detection は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | `test -f`, package pack test, docs grep |
| Gate 2: Functional | AC-04, AC-05, AC-06, AC-07, AC-08 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-09, AC-10 | dry-run snapshot, invalid profile tests, secret grep |
| Gate 4: Architecture | AC-11 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/profile-scripts.mjs` が存在し、`npm pack --dry-run --json` の required files に含まれる
- [x] AC-02: `init --profile node-cli --ci none --yes` は `ai:check` から `test:e2e:smoke` を除外する
- [x] AC-03: `init --profile react-nextjs+supabase-rls --ci none --yes` は `test:db` と `test:integration:rls` scripts を追加する
- [x] AC-04: `doctor --profile node-cli --ci none` は node-cli profile scripts で healthy target を pass する
- [x] AC-05: `doctor` は generic script が入った node-cli target を drift として検出する
- [x] AC-06: `update --profile node-cli --ci none --yes` は generic scripts を node-cli scripts に migrate し、doctor pass に戻す
- [x] AC-07: `update --dry-run --profile react-nextjs+supabase-rls --ci none --json` は RLS script migration operations を出し、target snapshot を変更しない
- [x] AC-08: explicit `--profile` は install state より優先され、successful update 後の state に反映される
- [x] AC-09: README, README-ja, `docs/cli.md`, roadmap が profile-aware script migration に言及する

### 異常系

- [x] AC-10: invalid profile は既存どおり write 前に reject される
- [x] AC-11: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: invalid profile → parse error で write 前に reject
- 想定エラー2: `init` target に existing `ai:check` がある → `--overwrite` なしでは skip
- 想定エラー3: `update --dry-run` → package scripts と install state を変更しない
- 境界ケース1: addon なし base profile → addon scripts は追加されない

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | package test required files と `src/cli/profile-scripts.mjs` を修正 |
| AC-02 | node-cli script resolver を修正 |
| AC-03 | supabase addon script merge を修正 |
| AC-04 | doctor expected scripts resolver 経路を修正 |
| AC-05 | doctor drift comparison を profile scripts に変更 |
| AC-06 | update package script migration を profile scripts に変更 |
| AC-07 | dry-run branch と operations detail を修正 |
| AC-08 | explicit override precedence と install state refresh を修正 |
| AC-09 | docs / README / roadmap に migration 説明を追加 |
| AC-10 | existing parseProfiles guard を write 前に維持 |
| AC-11 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| profile script false positive drift | `sage/failures.md` | maintainer |
| update migrates wrong profile scripts | `sage/anti-patterns.md` 昇格候補 | maintainer |
| docs と resolver の不一致 | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで profile script migration failure を確認する。
2. 記録: maintainer が profile, before scripts, expected scripts, actual output を `sage/failures.md` に記録する。
3. 昇格: wrong-profile migration または dry-run write bug が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template init`, `ai-check-template doctor`, `ai-check-template update`
- File contract: target `package.json` scripts and `.ai-check-template.json` schema v1
- npm: package contents only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: profile scripts が user customization を上書きする → `init` は existing script skip を維持し、`update` は `--yes` / `--dry-run` guard を維持
- リスク2: helper scripts が project tool choice と合わない → deterministic alpha defaults とし、package manager detection / semantic merge は follow-up
- リスク3: `package-templates` の generic fragment と CLI behavior がずれる → docs に CLI alpha profile-aware resolver として明記し、package templates は manual copy 用として維持

## 実装メモ

- No dependencies. Use Node stdlib only.
- Proposed module: `src/cli/profile-scripts.mjs`
- Base profiles:
  - `react-nextjs`: `ai:check` includes `doctor`, `deadcode`, and `test:e2e:smoke`
  - `react-vanilla`: `ai:check` includes `deadcode` and `test`
  - `expo-rn`: `ai:check` includes `deadcode`, `test`, and mobile smoke E2E
  - `node-cli`: `ai:check` includes `deadcode` and `test`, no UI E2E
  - `supabase-rls` addon: adds `test:db`, `test:integration:rls`, and includes both in `ai:check`

## Properties

### Invariants

- [INV-01] (Gate 3) `init` does not overwrite existing scripts without `--overwrite`
- [INV-02] (Gate 3) `update --dry-run` writes nothing
- [INV-03] (Gate 4) `package-templates/**` content is not modified
- [INV-04] (Gate 2) explicit profile overrides install state for profile scripts
- [INV-05] (Gate 2) node-cli profile scripts do not include UI E2E

### Pre-conditions

- [PRE-01] (Gate 2) Target project has `package.json`
- [PRE-02] (Gate 2) SPEC-0020 install state and SPEC-0021 diagnostics foundations exist

### Post-conditions

- [POST-01] (Gate 2) `init` writes profile-aware scripts for selected profile
- [POST-02] (Gate 2) `doctor` detects drift against profile-aware scripts
- [POST-03] (Gate 2) `update` migrates scripts to effective profile

### Assumptions

- [ASM-01] (Gate 横断) pnpm-based alpha defaults are acceptable until package manager detection exists
- [ASM-02] (Gate 横断) manual `package-templates/package.scripts.fragment.json` remains generic for copy-and-adapt users

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0022 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0022 と TASK-0084..0087 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-11 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| node-cli migration | generic scripts migrate to no-E2E scripts |
| supabase addon coverage | RLS helper scripts are created / checked |
| dry-run safety | before / after target snapshot unchanged |
| validation | `make validate` pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる profile script resolver / CLI integration / tests / docs / SAGE artifacts を revert する。`package-templates/**` と npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0022
- TASK-ID: TASK-0084, TASK-0085, TASK-0086, TASK-0087
