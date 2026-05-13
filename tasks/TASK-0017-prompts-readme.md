# TASK-0017: prompts/README.md 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0017 |
| SPEC-ID | SPEC-0004 |
| PLAN-ID | PLAN-0004 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 30m |

## 責務

`package-templates/prompts/README.md` を作成。ディレクトリの目的、5 プロンプトの概要、使い方を記載。

## 入力

- SPEC-0004 §スコープ §対象ユーザー
- 5 つのプロンプト（TASK-0015, TASK-0016 と並列実装中だが、ファイル名と概要は SPEC で既定）

## 出力

ファイル 60-200 行。

- H1: `# prompts/`
- ステータス: Draft v0.1
- 目的（philosophy ドキュメントからプロンプト雛形への橋渡し）
- 5 プロンプト一覧表（ファイル名 + 概要 + 適用場面）
- 使い方（コピペで AI に渡す + 自プロジェクトのドメインに置換）
- 隣接思想（philosophy への相互リンク）
- 出典

## File Scope

作成: `package-templates/prompts/README.md`
変更/削除: なし
変更禁止: TASK-0015, TASK-0016 の対象、SAGE 内部物

## 禁止事項

PLAN-0004 §Forbidden Shortcuts 継承 + 固有:
- gakuten 固有語
- 5 プロンプトのいずれかを README で言及漏れ
- 「絶対動く」等の過剰保証

## 完了条件

- [ ] ファイル作成、H1 タイトル、`## 出典` セクション
- [ ] 5 プロンプト名すべて登場（`grep -E "decision-table|state-transition|boundary-value|rls-permission|plan-first" README.md` が 5 行以上）
- [ ] philosophy への相互リンク
- [ ] gakuten 固有語不在
- [ ] secret パターン不在
- [ ] 行数 60-250

## Done Definition
SPEC-0004 AC-01（部分）, AC-02, AC-04, AC-06, AC-07（部分）, AC-08, AC-09, AC-10。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0004（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0017 |
| Error Resolution | SPEC-0004 |
| failures/anti-patterns | PLAN-0004 |
| 採用メトリクス | PLAN-0004 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
