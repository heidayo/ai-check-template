# TASK-0031: .github/ Issue + PR テンプレート作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0031 |
| SPEC-ID | SPEC-0009 |
| PLAN-ID | PLAN-0009 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 45m |

## 責務

`.github/ISSUE_TEMPLATE/{bug_report,feature_request,template_request}.md` + `config.yml` + `PULL_REQUEST_TEMPLATE.md` を新規作成。Issue テンプレートは英語、PR テンプレートは日本語。

## 入力

- SPEC-0009 §実装メモ §.github/PULL_REQUEST_TEMPLATE.md の構造
- maintainer 運用に合わせた PR テンプレ案（概要 / 変更内容 / 確認手順 / 影響範囲 / Promotion / リスクとロールバック / チェックリスト）

## 出力

### `.github/ISSUE_TEMPLATE/bug_report.md`（英語、20-80 行）
- ファイル frontmatter: name / about / title / labels（`bug`）
- セクション: Describe the bug / Reproduction / Expected behavior / Environment / Logs

### `.github/ISSUE_TEMPLATE/feature_request.md`（英語、20-80 行）
- frontmatter: name / about / title / labels（`enhancement`）
- セクション: Problem / Proposed solution / Alternatives / Use case

### `.github/ISSUE_TEMPLATE/template_request.md`（英語、20-80 行、本リポ特有）
- frontmatter: name / about / title / labels（`area:templates`）
- セクション: What template are you missing / Why / Reference materials / Profile compatibility

### `.github/ISSUE_TEMPLATE/config.yml`（英語、5-30 行）
- `blank_issues_enabled: false`
- `contact_links`: ドキュメント / Discussion / Security advisories へのリンク

### `.github/PULL_REQUEST_TEMPLATE.md`（日本語、30-100 行）
- 7 必須セクション: 概要 / 変更内容 / 確認手順 / 影響範囲 / Promotion / リスクとロールバック / チェックリスト
- 変更内容は checkbox 形式（機能追加 / バグ修正 / ドキュメント更新 / リファクタ / SAGE governance / その他）
- チェックリストはブランチ命名、コミットメッセージ規約、CI、File Scope、TODO/FIXME、`make validate`、Gate 誤検知記録、レビュー観点を含む

## File Scope

- 作成: 5 ファイル（`.github/ISSUE_TEMPLATE/` 4 + `.github/PULL_REQUEST_TEMPLATE.md` 1）
- 変更/削除: なし

**変更禁止**: TASK-0029, TASK-0030, TASK-0032 の対象、SAGE 内部物、配布物

## 禁止事項

PLAN-0009 §Forbidden Shortcuts 継承 + 固有:
- gakuten 等固有語の使用
- secret / 個人 email の含有
- TODO / FIXME

## 完了条件

- [x] 5 ファイル全存在
- [x] 3 Issue テンプレが frontmatter（name/about/title/labels）を持つ（`grep -l "^---" .github/ISSUE_TEMPLATE/*.md | wc -l` が 3）
- [x] config.yml で blank issue 無効化（`grep -q "blank_issues_enabled: false" .github/ISSUE_TEMPLATE/config.yml`）
- [x] PR テンプレ 7 必須セクション存在（概要 / 変更内容 / 確認手順 / 影響範囲 / Promotion / リスクとロールバック / チェックリスト）
- [x] gakuten 固有語不在
- [x] secret パターン不在

## Done Definition
SPEC-0009 AC-01（部分）, AC-10, AC-11, AC-12, AC-13。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0009（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0031 |
| Error Resolution | SPEC-0009 |
| failures/anti-patterns | PLAN-0009 |
| 採用メトリクス | PLAN-0009 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | 2026-05-14-spec-0009 |
| 開始 / 完了 / 結果 / Gate | 2026-05-14 / 2026-05-14 / PASS / Gate 1,2,3,4 |
