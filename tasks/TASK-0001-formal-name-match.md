# TASK-0001: formal-name-match.md 作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0001 |
| SPEC-ID   | SPEC-0001 |
| PLAN-ID   | PLAN-0001 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0002..0004 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

`package-templates/docs/philosophy/formal-name-match.md` を新規作成し、形名参同（事前宣言した成功基準と実測値の照合）の汎用ドキュメントを記述する。

## 入力

- SPEC-0001 §背景・目的、§スコープ（含む）、§CLAUDE.md / .claude/rules/ 連携
- PLAN-0001 §実装方針
- Notion 主体文書 Doc #2（無料で作る AI エージェント開発診断フロー、ページ ID: `c3e549660ca44005a20c4f6fdb54c8d5`）の「形名参同」概念
- 言語規約: `.claude/rules/ai-check-template.md` §言語規約（日本語本文、英語識別子）

## 出力

- 新規ファイル: `package-templates/docs/philosophy/formal-name-match.md`
- 構成（推奨順序）:
  1. H1: `# 形名参同`
  2. `> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）`
  3. `## 概念定義`（「名」=事前宣言した成功基準、「形」=実測値、両者の照合）
  4. `## 「名」と「形」の対応表`（具体例: TypeScript 型エラー、テスト pass/fail、coverage% 等）
  5. `## AI 駆動開発での適用`（Plan 先出し → 実装 → 診断 → 形名照合）
  6. `## 隣接する思想との関係`（`test-pyramid.md`, `given-when-then.md`, `qa-techniques.md` への相互リンク）
  7. `## 出典`（Notion Doc #2 のページ ID、参照日時 2026-05-13）
- 行数: 150-500 行

## File Scope（変更許可範囲）

- 作成: `package-templates/docs/philosophy/formal-name-match.md`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル（`test-pyramid.md` / `given-when-then.md` / `qa-techniques.md`）
- `package-templates/docs/philosophy/` 以外の全ディレクトリ
- `CLAUDE.md` / `AGENTS.md` / `sage/` / `.sage/` / `templates/hooks/` 等 SAGE 内部物
- `specs/SPEC-0001*.md` / `plans/PLAN-0001*.md`（承認済 SPEC/PLAN の改変）

## 禁止事項

PLAN-0001 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等特定プロジェクト固有語の使用
- 他の TASK と並列実行中に共通用語の独自定義を行う（必ず SPEC-0001 §背景・目的の用語定義を引用する）
- 出典 Notion ページの記述から gakuten 固有文脈を引用する（汎用化して書き換える）
- `Draft v0.1` 注記の省略
- TODO / FIXME を残してコミット
- File Scope 外への書き込み（hook で block）

## 完了条件

コマンドベースで検証可能な条件。

- [ ] AC: `ls package-templates/docs/philosophy/formal-name-match.md` が成功
- [ ] AC: `head -1 package-templates/docs/philosophy/formal-name-match.md` が `# 形名参同` で始まる
- [ ] AC: `grep -q "Draft v0.1" package-templates/docs/philosophy/formal-name-match.md` が成功
- [ ] AC: `grep -q "^## 出典" package-templates/docs/philosophy/formal-name-match.md` が成功
- [ ] AC: `grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/docs/philosophy/formal-name-match.md` の出力が空（終了コード 1）
- [ ] AC: `wc -l < package-templates/docs/philosophy/formal-name-match.md` が 100..600 の範囲
- [ ] AC: `grep -q "形名参同" package-templates/docs/philosophy/formal-name-match.md` が成功（本 TASK 主題のため当然）

## Done Definition（ラウンド単位）

参照: SPEC-0001 受け入れ条件 AC-01..AC-08 のうち本 TASK 対象は AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07（formal-name-match.md 単体に対する subset）。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0001 および PLAN-0001 から以下を継承する。本 TASK 内に再記述しないが、実装時に必ず参照すること。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0001 §Quality Gate マッピング | 完了条件 AC が Gate 1 (Structural) / Gate 2 (Functional) / Gate 4 (Architecture) に対応。Gate 3, 5 は N/A |
| テスト種別 | PLAN-0001 §必要な検証 | structural test のみ。unit / integration / e2e は N/A（実行コードなし） |
| カバレッジ閾値 | SPEC-0001 §非機能要件 NFR-04 | N/A（実行コードなし）。代替指標として「形名参同」概念のカバー（AC-05, AC-08） |
| commit-msg hook | SPEC-0001 §契約 | 各 commit に TASK-0001 を含める（SAGE pre-commit hook が検証） |
| Error Resolution | SPEC-0001 §Error Resolution 手順 | 完了条件失敗時の復旧手順（AC 別） |
| failures.md / anti-patterns.md 連携 | PLAN-0001 §Knowledge Management | gakuten 固有語混入 3 回累積 → failures.md → anti-patterns.md 昇格候補 |
| 採用メトリクス | PLAN-0001 §採用メトリクス | TASK 完了 + 該当 AC 全 pass で本 TASK は「正しく機能」と判断 |
| 段階移行 | PLAN-0001 §段階移行 | Pending → In Progress → Review → Done。Done 条件: 完了条件全 pass |
| ロールバック手順 | PLAN-0001 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/docs/philosophy/formal-name-match.md` で単体復元 |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
