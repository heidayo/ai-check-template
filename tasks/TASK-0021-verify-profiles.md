# TASK-0021: profiles/ AC 機械検証 + 整合手動レビュー

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0021 |
| SPEC-ID | SPEC-0005 |
| PLAN-ID | PLAN-0005 |
| ステータス | Done |
| 担当 | Test / Review |
| 並列可否 | No（最終） |
| 依存 | TASK-0019, TASK-0020 |
| 見積 | 20m |

## 責務

SPEC-0005 AC-01..AC-11 の機械検証 + 5 profile × インデックス README 間のトーン整合の手動レビュー。

## File Scope

検証のみ（書き込みなし）。

## 完了条件

### Phase 1: 機械検証
SPEC-0005 §受け入れ条件 AC-01..AC-11 を順次実行。

### Phase 2: 整合手動レビュー
- [ ] 5 profile のトーンが一貫（共通テンプレ構造に従う）
- [ ] profiles/README.md の概要表が各 profile README の目的と一致
- [ ] expo-rn の「React Doctor 非対応」が profiles/README.md でも触れられている
- [ ] supabase-rls の「他 profile と組み合わせる」が profiles/README.md でも明示
- [ ] philosophy 相互リンクが有効

### Phase 3: Architecture Gate (Properties INV-01..INV-03)
- [ ] INV-01: 6 ファイルが profiles/ 配下のみ
- [ ] INV-02: gakuten 固有語不在
- [ ] INV-03: secret / 危険コマンド不在

## Done Definition
SPEC-0005 AC-01..AC-11 全 pass + Phase 2/3 全 pass。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0005（全 Gate 一括） |
| テスト種別 | structural + grep + 手動 review |
| カバレッジ | N/A |
| commit-msg hook | TASK-0021 |
| Error Resolution | 失敗時 TASK 再オープン |
| failures/anti-patterns | PLAN-0005 |
| 採用メトリクス | TASK 完了 + 全 AC pass で SPEC-0005 Approved |
| 段階移行 | TASK 完了 → PLAN Completed → SPEC Approved → **Phase 0 全 7 完了** |
| ロールバック | Level 2: profiles/ 一括復元 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
