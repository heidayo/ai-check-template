# SPEC-0052: Claude Hook Matcher Expansion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0052 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0048 |
| 権限レベル | platform |

## 背景・目的

Claude Code hook fragment は `Edit|Write` を捕捉するが、`MultiEdit` と `NotebookEdit` を捕捉しない。AI編集後の fast loop をより広く適用するため、matcher を拡張し docs/tests を整合させる。

## 対象ユーザー

- Claude Code hook fragment を導入する利用者
- MultiEdit / NotebookEdit を使う AI agent workflow

## スコープ（含む）

- packaged hook fragment matcher を `Edit|Write|MultiEdit|NotebookEdit` にする
- `.claude` README の hook table / customization を更新する
- tests を更新する

## スコープ外（明示的に除外）

- hook command の変更
- blocking behavior の再変更
- PreToolUse hook の追加
- npm package version bump / publish

## 要件

### 機能要件
- [FR-01] `settings.hook-fragment.json` の PostToolUse matcher が `MultiEdit` を含む
- [FR-02] 同 matcher が `NotebookEdit` を含む
- [FR-03] init で merged settings に拡張 matcher が入る

### 非機能要件
- [NFR-01] Stop hook は変更しない
- [NFR-02] package-manager rendering は既存通り

### セキュリティ要件
- [SEC-01] hook command に secret や user-specific path を追加しない

### 運用要件
- [OPS-01] `node --test tests/cli/init.test.mjs` が pass
- [OPS-02] `npm test` が pass

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: hook fragment matcher に `MultiEdit` が含まれる
- [x] AC-02: hook fragment matcher に `NotebookEdit` が含まれる
- [x] AC-03: init test が matcher を検証する
- [x] AC-04: `.claude` README が拡張 matcher を説明する

## 異常系

- 既存 settings に custom PostToolUse group がある場合: `--overwrite` なしでは従来通り preserve
- `--overwrite` ありの場合: managed matcher に置き換わる

## 契約

- API: なし
- DB: なし
- イベント: Claude Code `PostToolUse` matcher

## リスク

- tool name が将来変わる → docs で matcher は利用者が調整可能とする

## 実装メモ（Implementation Agent向け）

JSON fragment と README の table を更新し、既存 tests の helper で matcher を assertion する。

## Properties

### Invariants
- [INV-01] (Gate 2) fast hook command remains `pnpm ai:check:fast`
- [INV-02] (Gate 4) Stop hook remains unchanged

### Pre-conditions
- [PRE-01] (Gate 2) `--claude-hooks` is enabled for init/update tests

### Post-conditions
- [POST-01] (Gate 2) generated settings include expanded matcher

### Assumptions
- [ASM-01] (Gate 横断) Claude Code recognizes listed tool names

## 関連ID

- PLAN-ID: PLAN-0052
- TASK-ID: TASK-0189

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0052-claude-hook-matcher-expansion.md"
  target_type: SPEC
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
