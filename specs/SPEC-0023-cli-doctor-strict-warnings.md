# SPEC-0023: CLI doctor strict warnings

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0023 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0021, SPEC-0022 |
| 権限レベル | platform |

## 背景・目的

SPEC-0021 で `doctor` は profile diagnostics warnings を出せるようになり、SPEC-0022 で package scripts は profile-aware になった。現在 warnings は常に non-blocking で、CI や release 前の stricter check に使うには exit status に反映できない。

本 SPEC は `doctor --strict` を追加し、通常は warnings を non-blocking のまま維持しつつ、明示 opt-in された場合だけ warnings を failure 判定に含める。これにより v0.2.0 alpha の stricter diagnostics foundation を完成させる。

## 対象ユーザー

- profile advisory warning を CI / release 前チェックで fail させたい maintainer
- `doctor` の warning を段階的に gate 化したい early adopter
- v0.2.0 alpha の stricter diagnostics を検証する CLI developer

## スコープ（含む）

- `doctor --strict` flag を追加する
- `doctor --help` / top-level help に `--strict` を表示する
- default mode では warnings は従来どおり exit status に影響しない
- strict mode では issues または warnings があれば exit 1 にする
- `doctor --json` は `strict` boolean を出力する
- human output は `strict: true|false` を表示する
- README / README-ja / `docs/cli.md` / roadmap / doctor tests を更新する

## スコープ外（明示的に除外）

- `init` / `update` behavior の変更
- profile diagnostics warning rules の変更
- package script resolver の変更
- package templates の変更
- warning severity levels
- per-warning ignore config
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/doctor.mjs`（更新）
- `src/cli/index.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0023-cli-doctor-strict-warnings.md`（新規）
- `plans/PLAN-0023-cli-doctor-strict-warnings.md`（新規）
- `tasks/TASK-0088-doctor-strict-flag.md`（新規）
- `tasks/TASK-0089-doctor-strict-tests-docs.md`（新規）
- `tasks/TASK-0090-verify-cli-doctor-strict-warnings.md`（新規）

**変更禁止:**
- `src/cli/init.mjs`
- `src/cli/update.mjs`
- `src/cli/profile-diagnostics.mjs`
- `src/cli/profile-scripts.mjs`
- `src/cli/install-state.mjs`
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。strict behavior は CLI `doctor` の runtime flag と docs のみに限定する。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- default mode で warnings を failure にする
- warning rules や package script resolver を変更する
- `package-templates/**` を変更する
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `doctor --help` / top-level help は `--strict` を表示する
- [FR-02] default `doctor` は warnings があっても issues がなければ exit 0 を返す
- [FR-03] `doctor --strict` は warnings があれば exit 1 を返す
- [FR-04] `doctor --strict --json` は `status: "fail"`, `strict: true`, `warnings`, `issues` を出力する
- [FR-05] `doctor --json` default mode は `strict: false` を出力する
- [FR-06] human output は `strict: true|false` と warnings count を表示する
- [FR-07] issues がある場合は strict の有無に関わらず従来どおり exit 1 を返す

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] output changes は additive にする
- [NFR-03] `doctor` は read-only を維持する
- [NFR-04] strict mode は opt-in で、既存 default workflow を壊さない

### セキュリティ要件

- [SEC-01] strict output は target file contents / package script command 全文 / environment values を出力しない
- [SEC-02] CLI code / docs / tests に secret 直書きパターンを含めない
- [SEC-03] `doctor --strict` は target に書き込まない

### 運用要件

- [OPS-01] PR は strict warning mode のみを扱う
- [OPS-02] warning severity levels / ignore config は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | help grep, docs grep |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/doctor.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | read-only snapshot, secret grep |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `node bin/ai-check-template.mjs doctor --help` と top-level help が `--strict` を表示する
- [x] AC-02: README, README-ja, `docs/cli.md`, roadmap が strict doctor warning mode に言及する
- [x] AC-03: warnings のみ存在する target で default `doctor --json` は exit 0, `status: "pass"`, `strict: false` を返す
- [x] AC-04: 同じ target で `doctor --strict --json` は exit 1, `status: "fail"`, `strict: true` を返す
- [x] AC-05: strict mode failure output は warnings array を保持し、issues array は空のままにする
- [x] AC-06: human output は `strict: true` と warnings count を表示する

### 異常系

- [x] AC-07: issues がある target は strict なしでも strict ありでも exit 1 を返す
- [x] AC-08: `doctor --strict` は target snapshot を変更しない
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: warning-only target + strict → exit 1, status fail, issues empty
- 想定エラー2: issue target + default → exit 1, status fail
- 境界ケース1: no warnings and no issues + strict → exit 0
- 境界ケース2: JSON output consumer → existing fields remain, `strict` is additive

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | usage text と parser を修正 |
| AC-02 | docs / README / roadmap に strict 説明を追加 |
| AC-03 | default status calculation を warnings から切り離す |
| AC-04 | strict status calculation を warnings も含むよう修正 |
| AC-05 | output builder で warnings を issue に変換しない |
| AC-06 | human output writer を修正 |
| AC-07 | issue status path を維持 |
| AC-08 | doctor path から write helper 呼び出しを排除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| strict warning false failure | `sage/failures.md` | maintainer |
| default mode warning regression | `sage/anti-patterns.md` 昇格候補 | maintainer |
| JSON output compatibility regression | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで strict warning regression を確認する。
2. 記録: maintainer が command, profile, warnings, expected status, actual output を `sage/failures.md` に記録する。
3. 昇格: default mode warning failure regression が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template doctor --strict`
- Output contract: `doctor --json` adds `strict` without removing existing fields
- npm: publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: default behavior を壊す → strict は opt-in のみ、default warning-only test を維持
- リスク2: warning が issue に変換されて output compatibility を壊す → warnings array と issues array を分離したままにする
- リスク3: CI で突然 fail する → docs に `--strict` opt-in と明記する

## 実装メモ

- No dependencies. Use Node stdlib only.
- `status` calculation: `issues.length > 0 || (strict && warnings.length > 0) ? "fail" : "pass"`
- Error message should include warning count when strict failure is warning-only.

## Properties

### Invariants

- [INV-01] (Gate 2) default mode warnings never affect doctor exit status
- [INV-02] (Gate 2) strict mode warnings affect doctor exit status
- [INV-03] (Gate 3) `doctor --strict` is read-only
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0021 warnings and SPEC-0022 profile-aware scripts exist
- [PRE-02] (Gate 2) Target project has `package.json` for normal diagnosis

### Post-conditions

- [POST-01] (Gate 2) `doctor --json` includes `strict`
- [POST-02] (Gate 2) `doctor --strict` can fail on warnings without changing warning shape

### Assumptions

- [ASM-01] (Gate 横断) a single global `--strict` flag is enough for v0.2.0 alpha
- [ASM-02] (Gate 横断) warning severity / ignore config will be decided after dogfooding

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0023 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0023 と TASK-0088..0090 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| default compatibility | warning-only default doctor exits 0 |
| strict enforcement | warning-only strict doctor exits 1 |
| read-only safety | before / after target snapshot unchanged |
| validation | `make validate` pass |

## 採点

- SPEC-0023: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0023: 100/S++
- TASK-0088: 100/S++
- TASK-0089: 100/S++
- TASK-0090: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる strict flag code / tests / docs / SAGE artifacts を revert する。`init`, `update`, profile diagnostics rules, profile script resolver, and package templates には影響しない。

## 関連ID

- PLAN-ID: PLAN-0023
- TASK-ID: TASK-0088, TASK-0089, TASK-0090
