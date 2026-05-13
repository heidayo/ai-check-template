# TASK-0027: docs/phase-1-feedback-template.md 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0027 |
| SPEC-ID | SPEC-0008 |
| PLAN-ID | PLAN-0008 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 30m |

## 責務

`docs/phase-1-feedback-template.md` を作成。dogfooding フィードバック 1 件分の記録テンプレ。

## 入力

- SPEC-0008 §実装メモ §feedback-template.md の構成
- `sage/failures.md` の FAIL-XXXX 形式（既存）

## 出力

- `docs/phase-1-feedback-template.md` 80-200 行
- フィードバック 1 件分のテンプレ（プロジェクト名 / 採用 profile / 該当成果物 / 問題 / 期待 / 原因仮説 / 推奨修正 / 影響度 / SPEC-ID 連携 / 対応ステータス）
- 記入例 1 件以上
- Draft v0.1 注記、`## 関連リンク` または `## 出典`

## File Scope

作成: `docs/phase-1-feedback-template.md`
変更/削除: なし
変更禁止: TASK-0026 の対象、SAGE 管理ファイル、配布物

## 禁止事項

PLAN-0008 §Forbidden Shortcuts 継承 + 固有:
- apps/web 等の gakuten 固有 app 構造名
- 記入例で実際の secret / API key を例示
- TODO / FIXME

## 完了条件

- [ ] ファイル存在、H1 タイトル、Draft v0.1 注記、`## 関連リンク` or `## 出典`
- [ ] テンプレ必須項目存在: プロジェクト名 / 採用 profile / 問題 / 期待 / 原因（`grep -qE "プロジェクト名|採用 profile|問題|期待|原因" <file>`）
- [ ] protocol.md または `sage/failures.md` への参照
- [ ] gakuten 固有 app 構造名不在
- [ ] secret パターン不在
- [ ] 行数 80-250

## Done Definition
SPEC-0008 AC-01（部分）, AC-02, AC-03, AC-04, AC-06, AC-08, AC-10。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0008（Gate 1/2/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0027 |
| Error Resolution | SPEC-0008 |
| failures/anti-patterns | PLAN-0008 |
| 採用メトリクス | PLAN-0008 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
