# TASK-0002: test-pyramid.md 作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0002 |
| SPEC-ID   | SPEC-0001 |
| PLAN-ID   | PLAN-0001 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0001, TASK-0003, TASK-0004 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 60m |

## 責務

`package-templates/docs/philosophy/test-pyramid.md` を新規作成し、責務分割（Static / Unit / Integration / E2E / DB-RLS / Monitoring）の汎用ドキュメントを記述する。

## 入力

- SPEC-0001 §背景・目的、§スコープ（含む）
- PLAN-0001 §実装方針
- Notion 主体文書 Doc #1（テストフロー再設計、ページ ID: `35b68c677f4380bfa1ffeab248264e92`）の「Test Pyramid / Testing Trophy」「責務分割」セクション
- 言語規約: `.claude/rules/ai-check-template.md`

## 出力

- 新規ファイル: `package-templates/docs/philosophy/test-pyramid.md`
- 構成（推奨順序）:
  1. H1: `# テストピラミッド（責務分割）`
  2. `> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）`
  3. `## 概念定義`（E2E 偏重の問題、責務分割の必要性）
  4. `## 各層の定義`（Static / Unit / Integration / E2E / DB-RLS / Monitoring の 6 層）
  5. `## 責務分割表`（各層 × 何を検証するか × ツール例の表）
  6. `## よくある失敗`（E2E 過多、Unit 過少、DB-RLS 未検証 等）
  7. `## AI 駆動開発での適用`（AI に責務を明示的に指示するパターン）
  8. `## 隣接する思想との関係`（`formal-name-match.md`, `given-when-then.md`, `qa-techniques.md` への相互リンク）
  9. `## 出典`（Notion Doc #1 のページ ID、参照日時 2026-05-13）
- 行数: 150-500 行

**重要**: DB-RLS 層は「層として存在する」抽象レベルでのみ言及。pgTAP / InBucket の具体は本 TASK のスコープ外（`supabase-rls` プロファイル系 SPEC で扱う、SPEC-0001 ASM-02 参照）。

## File Scope（変更許可範囲）

- 作成: `package-templates/docs/philosophy/test-pyramid.md`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル（`formal-name-match.md` / `given-when-then.md` / `qa-techniques.md`）
- `package-templates/docs/philosophy/` 以外の全ディレクトリ
- `CLAUDE.md` / `AGENTS.md` / `sage/` / `.sage/` / `templates/hooks/` 等 SAGE 内部物
- `specs/SPEC-0001*.md` / `plans/PLAN-0001*.md`

## 禁止事項

PLAN-0001 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等特定プロジェクト固有語の使用
- DB-RLS 層について pgTAP / InBucket / Supabase 固有 API の具体記述（抽象レベルに留める）
- 他の TASK と並列実行中に「責務分割」「形名参同」等共通用語の独自定義
- 出典 Notion ページの記述から gakuten 固有文脈を引用
- `Draft v0.1` 注記の省略
- TODO / FIXME を残してコミット
- File Scope 外への書き込み

## 完了条件

- [ ] AC: `ls package-templates/docs/philosophy/test-pyramid.md` が成功
- [ ] AC: `head -1 package-templates/docs/philosophy/test-pyramid.md` が `# テストピラミッド（責務分割）` で始まる
- [ ] AC: `grep -q "Draft v0.1" package-templates/docs/philosophy/test-pyramid.md` が成功
- [ ] AC: `grep -q "^## 出典" package-templates/docs/philosophy/test-pyramid.md` が成功
- [ ] AC: `grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/docs/philosophy/test-pyramid.md` の出力が空
- [ ] AC: `wc -l < package-templates/docs/philosophy/test-pyramid.md` が 100..600 の範囲
- [ ] AC: `grep -qE "Test Pyramid|テストピラミッド|責務分割" package-templates/docs/philosophy/test-pyramid.md` が成功
- [ ] AC: `grep -q "形名参同" package-templates/docs/philosophy/test-pyramid.md` が成功（SPEC-0001 AC-05、4 ファイル全てが「形名参同」を含む要件）

## Done Definition（ラウンド単位）

参照: SPEC-0001 受け入れ条件 AC-01..AC-08 のうち本 TASK 対象は AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08（test-pyramid.md 単体に対する subset）。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0001 および PLAN-0001 から以下を継承する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0001 §Quality Gate マッピング | 完了条件 AC が Gate 1 / Gate 2 / Gate 4 に対応。Gate 3, 5 は N/A |
| テスト種別 | PLAN-0001 §必要な検証 | structural test のみ。unit / integration / e2e は N/A |
| カバレッジ閾値 | SPEC-0001 §非機能要件 NFR-04 | N/A。代替指標として「責務分割」概念のカバー |
| commit-msg hook | SPEC-0001 §契約 | 各 commit に TASK-0002 を含める |
| Error Resolution | SPEC-0001 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0001 §Knowledge Management | 固有語混入 3 回累積 → failures.md → anti-patterns.md 昇格候補 |
| 採用メトリクス | PLAN-0001 §採用メトリクス | TASK 完了 + 該当 AC 全 pass |
| 段階移行 | PLAN-0001 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0001 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/docs/philosophy/test-pyramid.md` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
