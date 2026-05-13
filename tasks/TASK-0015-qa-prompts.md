# TASK-0015: QA 技法系 4 プロンプト作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0015 |
| SPEC-ID | SPEC-0004 |
| PLAN-ID | PLAN-0004 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 60m |

## 責務

`package-templates/prompts/` 配下に 4 つの QA 技法プロンプト（decision-table, state-transition, boundary-value, rls-permission）を作成する。

## 入力

- SPEC-0004 §実装メモ §共通プロンプトテンプレ構造
- philosophy: `package-templates/docs/philosophy/qa-techniques.md`（6 技法の元定義）

## 出力

各ファイル 80-250 行。共通構造（H1 / ステータス / 目的 / プロンプト本文コードブロック / 利用例 / 隣接思想リンク / 出典）。

### decision-table.md
- 目的: 複数条件の組み合わせ漏れを防ぐデシジョンテーブル生成
- プロンプト本文: 条件数 N → 2^N パターン全列挙 → 各組み合わせの期待結果

### state-transition.md
- 目的: 状態遷移の許可・禁止両方をテスト
- プロンプト本文: 状態リスト → 遷移表 → 不正遷移の拒否確認

### boundary-value.md
- 目的: 同値分割 + 境界値で入力空間網羅
- プロンプト本文: 入力範囲 → グループ分け → 各境目の値

### rls-permission.md
- 目的: RLS / 権限境界の機械検証
- プロンプト本文: role / user_id / tenant_id 等の境界 → 「見える」「見えない」両テスト

## File Scope

作成: `package-templates/prompts/{decision-table,state-transition,boundary-value,rls-permission}.md`
変更/削除: なし
変更禁止: TASK-0016, TASK-0017 の対象、SAGE 内部物

## 禁止事項

PLAN-0004 §Forbidden Shortcuts 継承 + 固有:
- 4 プロンプトを 1 ファイルにまとめる
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- 業務例で特定企業ドメインを使う（汎用例 user / item / order 等のみ）
- プロンプト内に secret / 危険コマンド指示

## 完了条件

- [ ] 4 ファイル作成、H1 タイトル、`## 出典` セクション
- [ ] 各ファイルにコードブロックで「プロンプト本文」（`grep -l '^```' <file>` で各 match）
- [ ] 固有キーワード: decision-table.md に「デシジョンテーブル」, state-transition.md に「状態遷移」, boundary-value.md に「同値分割」, rls-permission.md に「RLS」
- [ ] philosophy への相互リンク（`grep -q "../docs/philosophy" <file>`）
- [ ] gakuten 固有語不在
- [ ] secret パターン不在
- [ ] 行数 80-300

## Done Definition
SPEC-0004 AC-01（部分）, AC-02, AC-03, AC-04, AC-05（4 件）, AC-07（部分）, AC-08, AC-09, AC-10。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0004 §Quality Gate（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0015 |
| Error Resolution | SPEC-0004 |
| failures/anti-patterns | PLAN-0004 |
| 採用メトリクス | PLAN-0004 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1: 該当ファイル復元 |

## 実行ログ
| RUN-ID | TBD |
| 開始 | TBD |
| 完了 | TBD |
| 結果 | TBD |
| Gate | structural / functional / security / architecture: TBD |
