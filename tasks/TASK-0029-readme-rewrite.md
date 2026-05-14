# TASK-0029: README.md 全面刷新 + README-ja.md 新規作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0029 |
| SPEC-ID | SPEC-0009 |
| PLAN-ID | PLAN-0009 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 80m |

## 責務

`README.md` を英語 Primary で全面刷新し、`README-ja.md` を日本語版として新規作成する。

## 入力

- SPEC-0009 §実装メモ §README.md（英語 Primary）の推奨構造
- 現 `README.md`（現状の日本語版、段階表中心）
- 配布物 `package-templates/` の構造（What you get セクションで参照）

## 出力

### `README.md`（英語、100-300 行）
冒頭: 「AI-generated code should not be trusted by default.」+ ai-check-template の一言価値
必須 10 セクション: What is this / Why / Core loop / What you get / Quick start / Supported profiles / Roadmap / Contributing / License / [日本語版 / Japanese: README-ja.md]

### `README-ja.md`（日本語、100-400 行）
README.md の構造を踏襲した日本語版。冒頭で「英語版 / English: README.md」へのリンク。

## File Scope

- 作成: `README-ja.md`
- 変更: `README.md`
- 削除: なし

**変更禁止**: TASK-0030..0032 の対象ファイル、SAGE 内部物、配布物、`docs/phase-1-*`

## 禁止事項

PLAN-0009 §Forbidden Shortcuts 継承 + 固有:
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- 過剰な訴求表現（「最強」「絶対」「完璧」等）
- Phase 表（内向き）を README 上部に置く
- 既存配布物への URL 直リンクで内部詳細に依存
- secret / token / 個人 email の含有
- TODO / FIXME を残す

## 完了条件

- [x] `README.md` の H1 が英語タイトル（`head -1 README.md | grep -E "^# .*[a-zA-Z]"`）
- [x] `README.md` が 10 必須セクション含む（What is this / Why / Core loop / What you get / Quick start / Profiles / Roadmap / Contributing / License / README-ja）
- [x] `README-ja.md` の H1 が日本語含む
- [x] `README.md` → `README-ja.md` 相互参照
- [x] gakuten 固有語不在
- [x] 行数: README.md 100-350、README-ja.md 100-450

## Done Definition
SPEC-0009 AC-01（部分）, AC-02, AC-03, AC-04, AC-06, AC-07, AC-11, AC-13。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0009（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0029 |
| Error Resolution | SPEC-0009 |
| failures/anti-patterns | PLAN-0009 |
| 採用メトリクス | PLAN-0009 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | 2026-05-14-spec-0009 |
| 開始 / 完了 / 結果 / Gate | 2026-05-14 / 2026-05-14 / PASS / Gate 1,2,3,4 |
