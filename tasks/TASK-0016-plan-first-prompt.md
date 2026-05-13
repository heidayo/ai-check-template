# TASK-0016: plan-first プロンプト作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0016 |
| SPEC-ID | SPEC-0004 |
| PLAN-ID | PLAN-0004 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 25m |

## 責務

`package-templates/prompts/plan-first.md` を作成。形名参同の Phase A（実装前の成功基準先出し）を AI に依頼するプロンプト雛形。

## 入力

- SPEC-0004 §実装メモ
- philosophy: `package-templates/docs/philosophy/formal-name-match.md`（Phase A / B、§実装パターン §パターン 1: Plan-First プロンプト）
- philosophy: `package-templates/docs/philosophy/given-when-then.md`（受け入れ条件先出し）

## 出力

ファイル 80-200 行。共通構造（H1 / ステータス / 目的 / プロンプト本文 / 利用例 / 隣接思想 / 出典）。

- 目的: 「実装前に成功基準・検証コマンド・リスクを宣言させる」
- プロンプト本文: Plan に含めるべき項目（変更対象ファイル / 実装方針 / 成功基準 / 検証コマンド / 想定リスク / 未確認事項）

## File Scope

作成: `package-templates/prompts/plan-first.md`
変更/削除: なし
変更禁止: TASK-0015, TASK-0017 の対象、SAGE 内部物

## 禁止事項

PLAN-0004 §Forbidden Shortcuts 継承 + 固有:
- gakuten 固有語
- 業務例で特定企業ドメイン使用
- secret / 危険コマンド指示

## 完了条件

- [ ] ファイル作成、H1 タイトル、`## 出典` セクション
- [ ] プロンプト本文コードブロック（`grep -q '^```' package-templates/prompts/plan-first.md`）
- [ ] 「Plan」「成功基準」「形名参同」のいずれかを含む
- [ ] philosophy への相互リンク（特に formal-name-match.md）
- [ ] gakuten 固有語不在
- [ ] secret パターン不在
- [ ] 行数 80-250

## Done Definition
SPEC-0004 AC-01（部分）, AC-02, AC-03, AC-04, AC-05（1 件）, AC-07, AC-08, AC-09, AC-10。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0004（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0016 |
| Error Resolution | SPEC-0004 |
| failures/anti-patterns | PLAN-0004 |
| 採用メトリクス | PLAN-0004 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
