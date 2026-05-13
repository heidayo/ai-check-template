# TASK-0026: docs/phase-1-dogfooding-protocol.md 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0026 |
| SPEC-ID | SPEC-0008 |
| PLAN-ID | PLAN-0008 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 50m |

## 責務

`docs/phase-1-dogfooding-protocol.md` を作成。Phase 1 dogfooding の運用ルール本体。

## 入力

- SPEC-0008 §実装メモ §dogfooding-protocol.md の構成
- `package-templates/` 全 7 サブ成果物（参照リンクの宛先）
- `sage/failures.md` / `sage/anti-patterns.md`（フィードバック蓄積先）

## 出力

- `docs/phase-1-dogfooding-protocol.md` 150-400 行
- 必須セクション: 概要 / 対象プロジェクト選定基準 / 導入手順 / フィードバック収集ルール / Phase 1 → Phase 2 昇格条件 / 失敗パターン → SPEC 改訂ループ / 関連リンク
- Draft v0.1 注記、`## 出典` or `## 関連リンク`

## File Scope

作成: `docs/phase-1-dogfooding-protocol.md`
変更/削除: なし
変更禁止: TASK-0027 の対象、SAGE 管理ファイル、配布物

## 禁止事項

PLAN-0008 §Forbidden Shortcuts 継承 + 固有:
- 単一プロジェクト dogfooding を「Phase 1 完了」と提示
- apps/web / web_ipo / academy / internships / 学生転職 の使用（注: 「gakuten」単独は dogfooding 対象例として最低限の登場は許容）
- フィードバック収集を口頭で済ます提案
- secret / 危険コマンドの例示
- TODO / FIXME

## 完了条件

- [ ] ファイル存在、H1 タイトル、Draft v0.1 注記、`## 出典` or `## 関連リンク`
- [ ] 5 必須セクション存在: 「対象プロジェクト選定」「導入手順」「フィードバック収集」「昇格条件」「ループ」
- [ ] feedback-template への参照（`grep -q "feedback-template" <file>`）
- [ ] `package-templates` への参照（`grep -q "package-templates" <file>`）
- [ ] gakuten 固有 app 構造名不在（apps/web 等）
- [ ] 行数 150-450

## Done Definition
SPEC-0008 AC-01（部分）, AC-02, AC-03, AC-04, AC-05, AC-07, AC-08。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0008（Gate 1/2/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0026 |
| Error Resolution | SPEC-0008 |
| failures/anti-patterns | PLAN-0008 |
| 採用メトリクス | PLAN-0008 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
