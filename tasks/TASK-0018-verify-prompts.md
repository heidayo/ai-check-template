# TASK-0018: prompts/ AC 機械検証 + 整合手動レビュー

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0018 |
| SPEC-ID | SPEC-0004 |
| PLAN-ID | PLAN-0004 |
| ステータス | Done |
| 担当 | Test / Review |
| 並列可否 | No（最終） |
| 依存 | TASK-0015, TASK-0016, TASK-0017 |
| 見積 | 20m |

## 責務

SPEC-0004 AC-01..AC-12 の機械検証 + 5 プロンプト × README 間のトーン整合手動レビュー。

## File Scope

検証のみ（書き込みなし）。

## 完了条件

### Phase 1: 機械検証
SPEC-0004 §受け入れ条件 AC-01..AC-12 を順次実行。

### Phase 2: 整合手動レビュー
- [ ] 5 プロンプトのトーンが一貫（共通テンプレ構造に従う）
- [ ] README 概要と各プロンプトの目的が一致
- [ ] philosophy 相互リンクが有効（相対パス）

### Phase 3: Architecture Gate (Properties INV-01..INV-03)
- [ ] INV-01: 6 ファイルが prompts/ 配下のみ、templates/ 等に複製なし
- [ ] INV-02: gakuten 固有業務例不在（AC-08）
- [ ] INV-03: secret / 危険コマンド指示不在（AC-10, AC-11）

## Done Definition
SPEC-0004 AC-01..AC-12 全 pass + Phase 2/3 全 pass。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0004（全 Gate 一括） |
| テスト種別 | structural + grep + 手動 review |
| カバレッジ | N/A |
| commit-msg hook | TASK-0018 |
| Error Resolution | 失敗時に該当 TASK 再オープン |
| failures/anti-patterns | PLAN-0004 |
| 採用メトリクス | TASK 完了 + 全 AC pass で SPEC-0004 Approved |
| 段階移行 | TASK 完了 → PLAN Completed → SPEC Approved → Phase 0 サブ成果物 4/7 |
| ロールバック | Level 2: prompts/ 一括復元 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
