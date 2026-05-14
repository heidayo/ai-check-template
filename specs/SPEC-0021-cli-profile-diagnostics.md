# SPEC-0021: CLI profile diagnostics foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0021 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0020 |
| 権限レベル | platform |

## 背景・目的

SPEC-0020 で `init` が profile / CI / Claude hooks の install state を保存し、`doctor` / `update` がその state を default として使えるようになった。次の段階では、その profile 情報を `doctor` の診断に反映し、profile README に書かれている代表的な注意点を CLI で発見できるようにする。

ただし v0.2.0 alpha では profile-specific template migration までは行わない。既存の導入済み target を壊さないため、本 SPEC は fail する `issues` ではなく non-blocking `warnings` として profile advisory を追加する。

## 対象ユーザー

- `doctor` で profile-specific な不足や注意点を見たい early adopter
- profile README と CLI behavior の整合性を検証する maintainer
- future profile-aware migration を実装する CLI developer

## スコープ（含む）

- `doctor` に `warnings` output を追加する
- profile-specific advisory を `src/cli/profile-diagnostics.mjs` に分離する
- `react-nextjs`, `react-vanilla`, `expo-rn`, `node-cli`, `supabase-rls` の初期 advisory rules を追加する
- warnings は exit status に影響しない
- `doctor --json` は `{ status, target, installation, effectiveOptions, warnings, issues }` を出力する
- human output は warnings count と warning details を表示する
- package tests / doctor tests / README / README-ja / `docs/cli.md` / roadmap を更新する

## スコープ外（明示的に除外）

- `update` の profile-specific migration
- `init` の per-profile template customization
- package templates の変更
- warnings を CI failure にする strict mode
- dependency graph の full parser
- external network checks
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/profile-diagnostics.mjs`（新規）
- `src/cli/doctor.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0021-cli-profile-diagnostics.md`（新規）
- `plans/PLAN-0021-cli-profile-diagnostics.md`（新規）
- `tasks/TASK-0080-profile-diagnostics-module.md`（新規）
- `tasks/TASK-0081-doctor-warning-output.md`（新規）
- `tasks/TASK-0082-profile-diagnostics-tests-docs.md`（新規）
- `tasks/TASK-0083-verify-cli-profile-diagnostics.md`（新規）

**変更禁止:**
- `src/cli/init.mjs`
- `src/cli/update.mjs`
- `src/cli/install-state.mjs`
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。profile advisory は `doctor` output と docs のみに限定する。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- warnings を exit status failure にする
- profile README と矛盾する advisory を追加する
- target file contents を output に出す
- `package-templates/**` を変更する
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `doctor` output に `warnings` を追加する
- [FR-02] warnings は `issues` と同じ shape `{ code, path, message }` を持つ
- [FR-03] warnings は exit status に影響しない
- [FR-04] `doctor --json` は warnings を parseable array として出力する
- [FR-05] human output は warnings count と details を表示する
- [FR-06] `node-cli` profile は UI E2E / Playwright-like script を advisory warning にする
- [FR-07] `expo-rn` profile は Playwright / React Doctor-like script を advisory warning にする
- [FR-08] `react-nextjs` profile は React Doctor / Playwright smoke script の不足を advisory warning にする
- [FR-09] `react-vanilla` profile は Next.js-specific script を advisory warning にする
- [FR-10] `supabase-rls` addon は RLS-related scripts の不足を advisory warning にする

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] warnings は package scripts の script names / commands のみを検査し、file contents は読まない
- [NFR-03] existing `doctor` issue behavior と status semantics を維持する
- [NFR-04] profile advisory rules は module に分離し、future migration rules と混在させない

### セキュリティ要件

- [SEC-01] warnings は target file contents や environment values を出力しない
- [SEC-02] package script command は丸ごと出力せず、script name と advisory message のみにする
- [SEC-03] CLI code / docs / tests に secret 直書きパターンを含めない

### 運用要件

- [OPS-01] PR は profile diagnostics foundation のみを扱う
- [OPS-02] strict warning failure mode は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | `test -f`, package pack test, docs grep |
| Gate 2: Functional | AC-04, AC-05, AC-06, AC-07, AC-08 | `node --test tests/cli/doctor.test.mjs` |
| Gate 3: Security | AC-09, AC-10 | warning message tests, secret grep |
| Gate 4: Architecture | AC-11 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/profile-diagnostics.mjs` が存在し、`npm pack --dry-run --json` の required files に含まれる
- [x] AC-02: `doctor --json` output が `warnings` array を含む
- [x] AC-03: README, README-ja, `docs/cli.md`, roadmap が profile diagnostics warnings に言及する
- [x] AC-04: warnings が存在しても `issues` がなければ `doctor` は exit 0 を返す
- [x] AC-05: `node-cli` profile は UI E2E / Playwright-like script に warning を出す
- [x] AC-06: `react-nextjs+supabase-rls` profile は RLS-related scripts 不足に warning を出す
- [x] AC-07: explicit `--profile` は install state より優先され、warning profile も explicit value に従う
- [x] AC-08: human output が warnings count と warning details を表示する

### 異常系

- [x] AC-09: warnings は package script command 全文や secret-like values を output しない
- [x] AC-10: malformed `package.json` では existing `invalid-json` issue を維持し、profile warnings generation は skip する
- [x] AC-11: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: `package.json` が invalid JSON → existing `invalid-json` issue、warnings は空
- 想定エラー2: profile advisory に該当するが template drift はない → exit 0 with warnings
- 境界ケース1: profile が base only → addon-specific warnings は出ない
- 境界ケース2: explicit `--profile` supplied → install state profile ではなく explicit profile の warnings を使う

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | package test required files と `src/cli/profile-diagnostics.mjs` を修正 |
| AC-02 | `doctor` JSON output builder を修正 |
| AC-03 | docs / README / roadmap に warning 説明を追加 |
| AC-04 | `runDoctor` の status calculation を `issues` のみに戻す |
| AC-05 | `node-cli` advisory rule を修正 |
| AC-06 | `supabase-rls` addon rule を修正 |
| AC-07 | effective profile を diagnostics に渡す経路を修正 |
| AC-08 | human output writer を修正 |
| AC-09 | warning message に command 全文を含めない |
| AC-10 | invalid-json branch で diagnostics を skip |
| AC-11 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| profile warning false positive | `sage/failures.md` | maintainer |
| warning causes exit failure | `sage/anti-patterns.md` 昇格候補 | maintainer |
| docs と warning rule の不一致 | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで profile warning failure を確認する。
2. 記録: maintainer が profile, package scripts shape, expected warning, actual output を `sage/failures.md` に記録する。
3. 昇格: 同種 false positive または warning/status regression が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template doctor`
- Output contract: `doctor --json` adds `warnings` without removing existing fields
- npm: package contents only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: warning が noisy になる → exit status に影響させず docs に advisory と明記する
- リスク2: warning message が script command を漏らす → script name と generic message のみに限定する
- リスク3: profile migration と混同される → update / init は変更せず docs で foundation と説明する

## 実装メモ

- No dependencies. Use Node stdlib only.
- `profile-diagnostics.mjs` は package scripts object と effective profile のみを受け取る。
- Warning object shape: `{ code, path, message }`
- Example warning codes: `profile-advice`, `profile-addon-advice`

## Properties

### Invariants

- [INV-01] (Gate 2) warnings never affect doctor exit status
- [INV-02] (Gate 3) warnings do not include full package script command strings
- [INV-03] (Gate 4) `package-templates/**` content is not modified
- [INV-04] (Gate 2) explicit profile overrides install state for diagnostics

### Pre-conditions

- [PRE-01] (Gate 2) Target project has readable `package.json`
- [PRE-02] (Gate 2) SPEC-0020 install state foundation exists

### Post-conditions

- [POST-01] (Gate 2) `doctor --json` includes warnings array
- [POST-02] (Gate 1) profile diagnostics docs are discoverable from CLI docs and README

### Assumptions

- [ASM-01] (Gate 横断) advisory warnings are sufficient for v0.2.0 alpha
- [ASM-02] (Gate 横断) strict profile gates will be implemented later only if dogfooding shows value

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0021 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0021 と TASK-0080..0083 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-11 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| warning safety | warnings with no issues still exit 0 |
| profile coverage | 5 profiles covered by at least one advisory path |
| output compatibility | existing JSON fields remain |
| validation | `make validate` pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる profile diagnostics code / doctor output changes / tests / docs / SAGE artifacts を revert する。`init`, `update`, and install state behavior には影響しない。

## 関連ID

- PLAN-ID: PLAN-0021
- TASK-ID: TASK-0080, TASK-0081, TASK-0082, TASK-0083
