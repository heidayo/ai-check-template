# TASK-0030: docs/vision.md + docs/roadmap.md 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0030 |
| SPEC-ID | SPEC-0009 |
| PLAN-ID | PLAN-0009 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 50m |

## 責務

`docs/vision.md`（OSS 思想・解決課題・スコープ外）と `docs/roadmap.md`（v0.1.0 / v0.2.0 / v0.3.0+ マイルストーン）を新規作成。両方英語。

## 入力

- SPEC-0009 §実装メモ §docs/vision.md / docs/roadmap.md の主旨
- 既存 philosophy ドキュメント（参照先）
- レビュー本文の v0.1.0 / v0.2.0 / v0.3.0+ 構造

## 出力

### `docs/vision.md`（英語、100-300 行）
- AI 駆動開発の「検証ギャップ」問題
- 形名参同を中核とする思想（簡潔に、philosophy ドキュメントへのリンクで深掘り）
- 「品質ゲート」と「形名照合」の役割
- スコープ外（AI モデルの代替・LLM の改良・既存テストフレームワーク代替等）

### `docs/roadmap.md`（英語、50-200 行）
- v0.1.0: Manual templates for AI code verification
- v0.2.0: CLI (`npx ai-check-template init`)
- v0.3.0+: Composite Action / Marketplace listing
- 各バージョン: スコープ・成果物・関連 Issue ラベル

## File Scope

- 作成: `docs/vision.md`, `docs/roadmap.md`
- 変更/削除: なし

**変更禁止**: TASK-0029, TASK-0031, TASK-0032 の対象、SAGE 内部物、配布物、`docs/phase-1-*`, `docs/claude-collaboration-brief.md`, `docs/codex-delegation-packet.md`

## 禁止事項

PLAN-0009 §Forbidden Shortcuts 継承 + 固有:
- gakuten 等固有語の使用
- 内向き Phase 表をそのまま流用（外部向けに v0.X.Y 形式で書き直す）
- 「絶対動く」等過剰保証
- secret / TODO / FIXME

## 完了条件

- [x] 2 ファイル存在、H1 タイトル
- [x] vision.md が形名参同・philosophy への参照を含む
- [x] roadmap.md が v0.1.0 / v0.2.0 / v0.3.0 の 3 マイルストーン以上を含む
- [x] gakuten 固有語不在
- [x] 行数: vision 100-350、roadmap 50-250

## Done Definition
SPEC-0009 AC-01（部分）, AC-05, AC-06, AC-11, AC-13。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0009（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0030 |
| Error Resolution | SPEC-0009 |
| failures/anti-patterns | PLAN-0009 |
| 採用メトリクス | PLAN-0009 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | 2026-05-14-spec-0009 |
| 開始 / 完了 / 結果 / Gate | 2026-05-14 / 2026-05-14 / PASS / Gate 1,2,3,4 |
