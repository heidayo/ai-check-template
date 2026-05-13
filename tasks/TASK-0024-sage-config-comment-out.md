# TASK-0024: .sage/config.yaml project_checks コメントアウト

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0024 |
| SPEC-ID | SPEC-0007 |
| PLAN-ID | PLAN-0007 |
| ステータス | Done |

sage-managed: true
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 15m |

## 責務

`.sage/config.yaml` の `project_checks` セクションを修正する。現在の Go サンプル（`go vet`, `gofmt`, `go build`, `go test`）を全てコメントアウトし、「Phase 2 で Node 化」のメモを追加する。結果として SAGE Gate は SKIPPED 状態になる（FAIL ではない）。

## 入力

- SPEC-0007 §実装メモ §`.sage/config.yaml` の `project_checks` 修正案
- 現在の `.sage/config.yaml`（既存 `project_checks` の Go サンプル）

## 出力

更新後の `.sage/config.yaml`。`project_checks` セクションは以下のいずれか:
- 全キーがコメント `#` 始まり
- Phase 2 で Node 化するという日本語コメントを追加

active な command（`lint:`, `format:`, `type_check:`, `test_command:`, `coverage_command:`）が一つも残らないこと。

## File Scope

- 変更: `.sage/config.yaml`
- 作成/削除: なし

**変更禁止**: 上記以外。`project_checks` 以外の section（quality_gates, metrics, harness, hooks, lanes 等）は触らない。

## 禁止事項

PLAN-0007 §Forbidden Shortcuts 継承 + 固有:
- `project_checks` 以外のセクションを編集
- Node 用 project_checks の **実体** を追加（Phase 2 で扱う、本 TASK ではコメントアウトのみ）
- secret / API key の追加
- gakuten 固有語

## 完了条件

- [ ] `project_checks` 配下に active な command が存在しない（`grep -E "^\s+(lint|format|type_check|test_command|coverage_command):\s+['\"]" .sage/config.yaml | grep -v "^[[:space:]]*#"` が空）
- [ ] 「Phase 2」のコメントが `.sage/config.yaml` に存在（`grep -q "Phase 2" .sage/config.yaml`）
- [ ] 他セクションが unchanged（`git diff HEAD -- .sage/config.yaml | grep -E "^[+-]" | grep -v "^[+-]\s*#" | grep -v "^[+-]\s*$" | grep -v "project_checks"` のうち project_checks 関連でない差分が空）
- [ ] 差分が -10..+15 行程度（`git diff --stat HEAD -- .sage/config.yaml`）

## Done Definition
SPEC-0007 AC-04, AC-05, AC-09 の `.sage/config.yaml` 部分。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0007（Gate 1/2/4） |
| テスト種別 | structural |
| カバレッジ | N/A |
| commit-msg hook | TASK-0024 |
| Error Resolution | SPEC-0007 |
| failures/anti-patterns | PLAN-0007 |
| 採用メトリクス | PLAN-0007 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1: `git checkout HEAD -- .sage/config.yaml` |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
