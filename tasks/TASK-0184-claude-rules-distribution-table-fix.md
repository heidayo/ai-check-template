# TASK-0184: Claude Rules Distribution Table Fix

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0184 |
| SPEC-ID   | SPEC-0047 |
| PLAN-ID   | PLAN-0047 |
| ステータス | Done |
| 担当Agent | Claude Code Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0182, TASK-0183 |
| 見積     | 15m |

sage-managed: true

## 責務

`.claude/rules/ai-check-template.md` 内の (A) 配布物テーブルと `package.json` `files` の不整合、(B) 残存する固定 Phase 表現を、Claude Review (SPEC-0047 Round 1 follow-up) で検出された通り修正する。

## 入力

- SPEC-0047 / PLAN-0047
- Claude Review report (Issue A: 配布物テーブル矛盾 / Issue B: Phase 0 と Phase 1 残存)
- `package.json` の `files` フィールド（source of truth）

## 出力

- 配布物テーブルが `package.json` の `files` を一次情報源とし、`CLAUDE.md` / `tests/` が npm publish 対象に見える表記を持たない
- 設計原則「実証ファースト」の説明文から固定 Phase 番号が消える

## File Scope（変更許可範囲）

- 作成: `tasks/TASK-0184-claude-rules-distribution-table-fix.md`
- 変更: `.claude/rules/ai-check-template.md`
- 削除: なし

## 禁止事項

- `CLAUDE.md` / `package-templates/` / README / docs / tests / src / bin を変更しない
- 配布物テーブルから情報を削るのみで、新規の固定リストを作って二重管理しない
- 設計原則そのもの（汎用ファースト / 実証ファースト / SAGE 横並び）を改変しない

## 完了条件

- [x] 配布物テーブルが `package.json` の `files` を参照する形に整理されている
- [x] `CLAUDE.md` が npm publish 対象として読めない
- [x] `tests/` が npm publish 対象として読めない
- [x] 「Phase 0 と Phase 1」表現が設計原則文から消えている
- [x] `rg "Phase 1.*未着手|Phase 2.*未着手|Phase 3.*未着手|Draft v0.1" .claude/rules/ai-check-template.md package-templates/.claude` が検出しない
- [x] `node -e "const p=require('./package.json'); if ((p.files||[]).includes('CLAUDE.md')) process.exit(1)"` が pass
- [x] `git diff --check` が pass
- [x] `make validate` が pass

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0047-task-0184 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
