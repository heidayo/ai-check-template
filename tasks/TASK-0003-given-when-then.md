# TASK-0003: given-when-then.md 作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0003 |
| SPEC-ID   | SPEC-0001 |
| PLAN-ID   | PLAN-0001 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0001, TASK-0002, TASK-0004 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

`package-templates/docs/philosophy/given-when-then.md` を新規作成し、受け入れ条件先行（AI に GWT で観点を先出しさせる運用）の汎用ドキュメントを記述する。

## 入力

- SPEC-0001 §背景・目的、§スコープ（含む）
- PLAN-0001 §実装方針
- Notion 主体文書 Doc #1（テストフロー再設計、ページ ID: `35b68c677f4380bfa1ffeab248264e92`）の「Given-When-Then」「受け入れ条件」セクション
- 言語規約: `.claude/rules/ai-check-template.md`

## 出力

- 新規ファイル: `package-templates/docs/philosophy/given-when-then.md`
- 構成（推奨順序）:
  1. H1: `# Given-When-Then`
  2. `> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）`
  3. `## 概念定義`（GWT の起源・3 要素・なぜ受け入れ条件として優れているか）
  4. `## GWT 構文`（基本形・複数 When の扱い・ネストの是非）
  5. `## AI への指示パターン`（「実装前に GWT で受け入れ条件を出させる」プロンプト例）
  6. `## 受け入れ条件への落とし方`（GWT → AC への変換、機械検証可能化）
  7. `## アンチパターン`（曖昧な Given、副作用を持つ When、検証不能な Then）
  8. `## 隣接する思想との関係`（`formal-name-match.md`, `test-pyramid.md`, `qa-techniques.md` への相互リンク）
  9. `## 出典`（Notion Doc #1 のページ ID、参照日時 2026-05-13）
- 行数: 150-500 行

## File Scope（変更許可範囲）

- 作成: `package-templates/docs/philosophy/given-when-then.md`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル
- `package-templates/docs/philosophy/` 以外の全ディレクトリ
- SAGE 内部物全般

## 禁止事項

PLAN-0001 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等特定プロジェクト固有語の使用
- GWT 例文に gakuten 固有のドメイン（「求人保存」「学生応募」等）を使用 → 汎用例（「item save」「user registration」等）に書き換える
- 他の TASK と並列実行中に共通用語の独自定義
- `Draft v0.1` 注記の省略
- TODO / FIXME を残してコミット
- File Scope 外への書き込み

## 完了条件

- [ ] AC: `ls package-templates/docs/philosophy/given-when-then.md` が成功
- [ ] AC: `head -1 package-templates/docs/philosophy/given-when-then.md` が `# Given-When-Then` で始まる
- [ ] AC: `grep -q "Draft v0.1" package-templates/docs/philosophy/given-when-then.md` が成功
- [ ] AC: `grep -q "^## 出典" package-templates/docs/philosophy/given-when-then.md` が成功
- [ ] AC: `grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/docs/philosophy/given-when-then.md` の出力が空
- [ ] AC: `wc -l < package-templates/docs/philosophy/given-when-then.md` が 100..600 の範囲
- [ ] AC: `grep -qE "Given.When.Then" package-templates/docs/philosophy/given-when-then.md` が成功
- [ ] AC: `grep -q "形名参同" package-templates/docs/philosophy/given-when-then.md` が成功（SPEC-0001 AC-05）

## Done Definition（ラウンド単位）

参照: SPEC-0001 受け入れ条件 AC-01..AC-08 のうち本 TASK 対象は AC-01..AC-08（given-when-then.md 単体に対する subset）。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0001 および PLAN-0001 から以下を継承する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0001 §Quality Gate マッピング | 完了条件 AC が Gate 1 / Gate 2 / Gate 4 に対応 |
| テスト種別 | PLAN-0001 §必要な検証 | structural test のみ。unit / integration / e2e は N/A |
| カバレッジ閾値 | SPEC-0001 §非機能要件 NFR-04 | N/A。代替指標として「Given-When-Then」概念のカバー |
| commit-msg hook | SPEC-0001 §契約 | 各 commit に TASK-0003 を含める |
| Error Resolution | SPEC-0001 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0001 §Knowledge Management | 固有語混入 3 回累積 → failures.md → anti-patterns.md 昇格候補 |
| 採用メトリクス | PLAN-0001 §採用メトリクス | TASK 完了 + 該当 AC 全 pass |
| 段階移行 | PLAN-0001 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0001 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/docs/philosophy/given-when-then.md` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
