# TASK-0028: Phase 1 dogfooding AC 検証

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0028 |
| SPEC-ID | SPEC-0008 |
| PLAN-ID | PLAN-0008 |
| ステータス | Done |
| 担当 | Test / Review |
| 並列可否 | No（最終） |
| 依存 | TASK-0026, TASK-0027 |
| 見積 | 15m |

## 責務

SPEC-0008 AC-01..AC-10 を機械検証 + protocol.md と feedback-template.md の整合手動レビュー。

## File Scope

検証のみ。書き込みなし。

## 完了条件

### Phase 1: 機械検証
SPEC-0008 §受け入れ条件 AC-01..AC-10 を順次実行。

### Phase 2: 整合手動レビュー
- [ ] protocol.md の必須セクションが SPEC-0008 §背景・目的の主旨と一致
- [ ] feedback-template.md のテンプレが `sage/failures.md` の FAIL-XXXX 形式と整合
- [ ] 2 ファイル間の相互リンクが有効

### Phase 3: Architecture Gate (Properties INV-01..INV-02)
- [ ] INV-01: 2 ファイルが `docs/` 配下のみ、`package-templates/` に複製なし
- [ ] INV-02: gakuten 固有 app 構造名不在（AC-08 で機械検証）

## Done Definition
SPEC-0008 AC-01..AC-10 全 pass + Phase 2/3 全 pass。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0008（全 Gate 一括） |
| テスト種別 | structural + grep + 手動 review |
| カバレッジ | N/A |
| commit-msg hook | TASK-0028 |
| Error Resolution | 失敗時 TASK 再オープン |
| failures/anti-patterns | PLAN-0008 |
| 採用メトリクス | TASK 完了 + 全 AC pass で SPEC-0008 Approved → Phase 1 開始 |
| 段階移行 | TASK 完了 → PLAN Completed → SPEC Approved → Phase 1 開始 |
| ロールバック | Level 2 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
