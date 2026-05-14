# SPEC-0025: CLI managed workflow cleanup

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0025 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0019, SPEC-0020, SPEC-0024 |
| 権限レベル | platform |

## 背景・目的

SPEC-0024 で `doctor` は inactive な exact-managed CI workflow を `ci-advice` warning として検出できるようになった。しかし `update` は selected CI mode の workflow を作成・更新するだけで、古い managed workflow を cleanup しない。

本 SPEC は `update` に managed workflow cleanup を追加し、`--ci none` や `direct` / `reusable` 切り替え時に inactive mode の exact-managed workflow を安全に削除できるようにする。削除対象は packaged template と完全一致する workflow のみで、custom workflow は保持する。

## 対象ユーザー

- `--ci none` に切り替えた後、古い ai-check workflow を安全に消したい maintainer
- `direct` / `reusable` workflow mode を切り替える early adopter
- `doctor` の stale managed CI warning を `update` で解消したい CLI developer

## スコープ（含む）

- `update` が inactive CI mode の exact-managed workflow file を削除する
- `update --dry-run` は削除せず `would-delete` operation を出力する
- custom workflow content は削除しない
- `update --ci none` は direct / reusable managed workflow を cleanup 対象にする
- `update --ci direct` は reusable managed workflow を cleanup 対象にする
- `update --ci reusable` は direct managed workflow を cleanup 対象にする
- README / README-ja / `docs/cli.md` / roadmap / update tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- `init` / `doctor` behavior の変更
- package templates の変更
- workflow YAML contents の変更
- arbitrary custom workflow cleanup
- package script cleanup
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/update.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0025-cli-managed-workflow-cleanup.md`（新規）
- `plans/PLAN-0025-cli-managed-workflow-cleanup.md`（新規）
- `tasks/TASK-0094-managed-workflow-cleanup.md`（新規）
- `tasks/TASK-0095-managed-workflow-cleanup-tests-docs.md`（新規）
- `tasks/TASK-0096-verify-managed-workflow-cleanup.md`（新規）

**変更禁止:**
- `src/cli/init.mjs`
- `src/cli/doctor.mjs`
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
- custom workflow を削除する
- exact template match ではない workflow を削除する
- `--dry-run` で target file を変更する
- package templates や workflow YAML を変更する
- npm publish を実行する
- destructive shell deletion commands

## 要件

### 機能要件

- [FR-01] `update --ci none --yes` は exact-managed direct / reusable workflow を削除する
- [FR-02] `update --ci reusable --yes` は exact-managed direct workflow を削除し、reusable workflow を作成・更新する
- [FR-03] `update --ci direct --yes` は exact-managed reusable workflow を削除し、direct workflow を作成・更新する
- [FR-04] `update --dry-run --json` は削除せず `would-delete` operation を出力する
- [FR-05] custom workflow content は削除せず、`keep` operation として報告する
- [FR-06] cleanup 後の install state は effective CI mode を保持する

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] `update` は existing confirmation model を維持し、write には `--yes` が必要
- [NFR-03] cleanup は exact template match のみに限定する
- [NFR-04] output changes は additive にする

### セキュリティ要件

- [SEC-01] operation output は workflow contents / environment values / secrets を出力しない
- [SEC-02] CLI code / docs / tests に secret 直書きパターンを含めない
- [SEC-03] custom workflow content は保持する

### 運用要件

- [OPS-01] PR は managed workflow cleanup のみを扱う
- [OPS-02] package script cleanup は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | docs grep, operation action grep |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/update.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | secret grep, dry-run snapshot |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: README, README-ja, `docs/cli.md`, roadmap が managed workflow cleanup に言及する
- [x] AC-02: `update --dry-run --json` は stale exact-managed workflow に `action: "would-delete"` を出力する
- [x] AC-03: `update --ci none --yes` は exact-managed direct workflow を削除し、`doctor --ci none` が stale CI warning なしで pass する
- [x] AC-04: `update --ci reusable --yes` は direct workflow を削除し、reusable workflow を残して `doctor --ci reusable` が pass する
- [x] AC-05: custom workflow content は削除しない

### 異常系

- [x] AC-06: `update --dry-run` は target snapshot を変更しない
- [x] AC-07: `update` without `--yes` は従来どおり書き込まない
- [x] AC-08: secret pattern grep が pass する
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: exact-managed workflow + dry-run → would-delete only, no file change
- 想定エラー2: exact-managed workflow + yes → file removed
- 想定エラー3: custom workflow same path + yes → file preserved
- 境界ケース1: inactive workflow absent → no cleanup operation needed

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | docs / README / roadmap に cleanup 説明を追加 |
| AC-02 | dry-run operation action を修正 |
| AC-03 | inactive CI file list and exact match cleanup を修正 |
| AC-04 | selected mode update と cleanup order を修正 |
| AC-05 | exact template match 判定を追加し、custom file を除外 |
| AC-06 | dry-run branch で unlink を呼ばない |
| AC-07 | existing confirmation guard を維持 |
| AC-08 | secret-like literal を削除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| custom workflow accidental cleanup | `sage/failures.md` | maintainer |
| stale workflow cleanup false negative | `sage/failures.md` | maintainer |
| recurring package script cleanup request | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで managed workflow cleanup regression を確認する。
2. 記録: maintainer が command, ci mode, workflow path, expected operation, actual output を `sage/failures.md` に記録する。
3. 昇格: package script cleanup request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template update --ci <mode> --yes`
- Output contract: `update --json` may include `would-delete`, `delete`, and `keep` operations for managed workflow cleanup
- npm: publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: custom workflow を削除する → current template exact match のみ cleanup 対象にする
- リスク2: dry-run が書き込む → snapshot test を追加する
- リスク3: selected CI mode workflow を削除する → inactive mode list のみ cleanup 対象にする

## 実装メモ

- No dependencies. Use Node stdlib only.
- inactive CI files:
  - effective `direct`: reusable workflow examples
  - effective `reusable`: direct workflow examples
  - effective `none`: direct + reusable workflow examples
- Delete only when target file contents exactly match the packaged template.

## Properties

### Invariants

- [INV-01] (Gate 2) selected CI mode workflows are created or updated before doctor validation
- [INV-02] (Gate 2) inactive exact-managed CI files can be removed by update
- [INV-03] (Gate 3) dry-run writes nothing
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0019 update foundation exists
- [PRE-02] (Gate 2) SPEC-0024 stale managed CI diagnostics exist
- [PRE-03] (Gate 2) Target project has `package.json` for normal update

### Post-conditions

- [POST-01] (Gate 2) cleanup can remove inactive exact-managed workflows
- [POST-02] (Gate 2) cleanup preserves custom workflow content

### Assumptions

- [ASM-01] (Gate 横断) exact template match is the safest alpha ownership signal
- [ASM-02] (Gate 横断) package script cleanup needs a separate SPEC

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0025 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0025 と TASK-0094..0096 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| cleanup accuracy | exact-managed inactive workflow removed with `--yes` |
| false positive guard | custom workflow with same path is preserved |
| dry-run safety | target snapshot unchanged |
| validation | `make validate` pass |

## 採点

- SPEC-0025: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0025: 100/S++
- TASK-0094: 100/S++
- TASK-0095: 100/S++
- TASK-0096: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる managed workflow cleanup code / tests / docs / SAGE artifacts を revert する。`init`, `doctor`, package templates, workflow YAML contents, and npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0025
- TASK-ID: TASK-0094, TASK-0095, TASK-0096
