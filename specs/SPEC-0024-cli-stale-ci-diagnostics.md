# SPEC-0024: CLI stale CI diagnostics

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0024 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0018, SPEC-0020, SPEC-0023 |
| 権限レベル | platform |

## 背景・目的

SPEC-0018 で `doctor` は selected CI mode の workflow drift を診断できるようになり、SPEC-0020 で install state から CI mode を復元できるようになった。SPEC-0023 では warnings を `doctor --strict` で failure にできるようになった。

一方で、`--ci none` へ移行した後に過去の managed workflow が残っている場合や、`direct` / `reusable` を切り替えた後に旧 mode の managed workflow が残っている場合、現在の `doctor` はそれを検出しない。不要な workflow が残ると意図せず CI が走り、alpha CLI の安全な migration 体験を損なう。

本 SPEC は `doctor` に stale managed CI workflow warning を追加する。対象は exact template match する managed workflow のみで、ユーザーが同名 workflow を編集している場合は誤検知を避ける。

## 対象ユーザー

- `--ci none` にしたのに古い ai-check workflow が残っていないか確認したい maintainer
- `direct` / `reusable` workflow mode を切り替える early adopter
- `doctor --strict` で stale managed workflow を release 前に検出したい CLI developer

## スコープ（含む）

- `doctor` が inactive CI mode の exact-managed workflow file を warning として出力する
- warning code は `ci-advice` とし、path は `.github/workflows/<file>` にする
- default `doctor` では stale CI warnings は non-blocking のままにする
- `doctor --strict` では stale CI warnings を failure に含める
- 同名 workflow が current template と一致しない場合は warning にしない
- README / README-ja / `docs/cli.md` / roadmap / doctor tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- `init` / `update` behavior の変更
- stale workflow の削除・移動・自動修復
- package templates の変更
- workflow YAML contents の変更
- profile-specific workflow template の追加
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/doctor.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0024-cli-stale-ci-diagnostics.md`（新規）
- `plans/PLAN-0024-cli-stale-ci-diagnostics.md`（新規）
- `tasks/TASK-0091-stale-ci-diagnostics.md`（新規）
- `tasks/TASK-0092-stale-ci-tests-docs.md`（新規）
- `tasks/TASK-0093-verify-stale-ci-diagnostics.md`（新規）

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

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。SAGE ルールは AGENTS.md の File Scope / standard lane / TASK-ID commit hook を継続適用する。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- stale workflow を削除する
- exact template match ではない同名 workflow を warning にする
- default mode で warnings を failure にする
- package templates や workflow YAML を変更する
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `--ci none` で direct / reusable managed workflow が残っている場合、`doctor --json` は `ci-advice` warning を出力する
- [FR-02] `--ci direct` で reusable managed workflow が残っている場合、`doctor --json` は `ci-advice` warning を出力する
- [FR-03] `--ci reusable` で direct managed workflow が残っている場合、`doctor --json` は `ci-advice` warning を出力する
- [FR-04] stale warning の path は `.github/workflows/<file>` に正規化される
- [FR-05] 同名 workflow が current template と一致しない場合は stale managed warning を出さない
- [FR-06] stale CI warnings は `--strict` の failure condition に含まれる

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] `doctor` は read-only を維持する
- [NFR-03] warnings は additive にし、existing JSON fields を削除しない
- [NFR-04] exact template match に限定して false positive を抑える

### セキュリティ要件

- [SEC-01] warning output は workflow contents / environment values / secrets を出力しない
- [SEC-02] CLI code / docs / tests に secret 直書きパターンを含めない
- [SEC-03] `doctor` は target workflow file を書き換えない

### 運用要件

- [OPS-01] PR は stale CI diagnostics warning のみを扱う
- [OPS-02] workflow cleanup は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | docs grep, warning code grep |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/doctor.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | secret grep, read-only snapshot |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: README, README-ja, `docs/cli.md`, roadmap が stale managed CI diagnostics に言及する
- [x] AC-02: stale CI warning は `code: "ci-advice"` と `.github/workflows/<file>` path を持つ
- [x] AC-03: direct workflows が残る target で `doctor --ci none --json` は exit 0, `status: "pass"`, `warnings` に direct workflow paths を含む
- [x] AC-04: 同じ target で `doctor --ci none --strict --json` は exit 1, `status: "fail"` を返す
- [x] AC-05: custom workflow content は stale managed CI warning にしない

### 異常系

- [x] AC-06: selected CI mode の missing / drift issues は従来どおり `issues` として残る
- [x] AC-07: `doctor` は target snapshot を変更しない
- [x] AC-08: secret pattern grep が pass する
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: `--ci none` + exact-managed workflows present → warning only, default pass
- 想定エラー2: `--ci none --strict` + exact-managed workflows present → strict failure
- 想定エラー3: custom `.github/workflows/ai-check.yml` present → no stale managed warning
- 境界ケース1: selected CI mode file missing → existing issue behavior preserved

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | docs / README / roadmap に stale CI diagnostics 説明を追加 |
| AC-02 | warning builder の code / path normalization を修正 |
| AC-03 | inactive mode file scan を修正 |
| AC-04 | SPEC-0023 strict failure condition との integration を修正 |
| AC-05 | exact template match 判定を追加し、custom file を除外 |
| AC-06 | selected CI issue path を維持 |
| AC-07 | doctor path から write helper 呼び出しを排除 |
| AC-08 | secret-like literal を削除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| custom workflow false positive | `sage/failures.md` | maintainer |
| stale managed workflow false negative | `sage/failures.md` | maintainer |
| cleanup が必要な recurring request | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで stale CI diagnostic regression を確認する。
2. 記録: maintainer が command, ci mode, workflow path, expected warning, actual output を `sage/failures.md` に記録する。
3. 昇格: cleanup request が 3 回累積した場合、workflow cleanup SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template doctor --ci <mode> [--strict]`
- Output contract: `doctor --json` may include additional `warnings[]` entries with `code: "ci-advice"`
- npm: publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: custom workflow を stale managed と誤検知する → current template exact match のみ warning にする
- リスク2: selected CI missing / drift issue を warning 化してしまう → selected mode check は existing `issues` path のまま維持
- リスク3: stale warning が default workflow を壊す → default warnings は advisory、strict のみ opt-in failure

## 実装メモ

- No dependencies. Use Node stdlib only.
- inactive CI files:
  - effective `direct`: reusable workflow examples
  - effective `reusable`: direct workflow examples
  - effective `none`: direct + reusable workflow examples
- Only warn when target file contents exactly match the packaged template.

## Properties

### Invariants

- [INV-01] (Gate 2) selected CI mode drift remains an issue
- [INV-02] (Gate 2) inactive exact-managed CI files are warnings
- [INV-03] (Gate 3) `doctor` is read-only
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0018 doctor CI checks exist
- [PRE-02] (Gate 2) SPEC-0023 strict warning failure exists
- [PRE-03] (Gate 2) Target project has `package.json` for normal diagnosis

### Post-conditions

- [POST-01] (Gate 2) stale exact-managed workflow warnings appear in `doctor --json`
- [POST-02] (Gate 2) `doctor --strict` can fail on stale CI warnings

### Assumptions

- [ASM-01] (Gate 横断) exact template match is the safest alpha signal for managed workflow ownership
- [ASM-02] (Gate 横断) automatic cleanup needs a separate SPEC because it deletes target files

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0024 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0024 と TASK-0091..0093 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| stale CI detection | exact-managed inactive workflow emits `ci-advice` |
| false positive guard | custom workflow with same path emits no stale warning |
| strict integration | stale CI warning fails only with `--strict` |
| validation | `make validate` pass |

## 採点

- SPEC-0024: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0024: 100/S++
- TASK-0091: 100/S++
- TASK-0092: 100/S++
- TASK-0093: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる stale CI warning code / tests / docs / SAGE artifacts を revert する。`init`, `update`, package templates, workflow YAML contents, and npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0024
- TASK-ID: TASK-0091, TASK-0092, TASK-0093
