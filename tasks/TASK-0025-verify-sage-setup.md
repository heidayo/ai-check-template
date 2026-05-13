# TASK-0025: 本リポ SAGE 環境整備 AC 検証

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0025 |
| SPEC-ID | SPEC-0007 |
| PLAN-ID | PLAN-0007 |
| ステータス | Done |
| 担当 | Test / Review |
| 並列可否 | No（最終） |
| 依存 | TASK-0023, TASK-0024 |
| 見積 | 20m |

## 責務

SPEC-0007 AC-01..AC-10 の機械検証。特に `bash scripts/sage-validate.sh` の ERRORs が 0 になることを確認する。

## File Scope

検証のみ。書き込みなし。

## 完了条件

### Phase 1: 機械検証（SPEC-0007 AC-01..AC-10）

- [ ] AC-01: CLAUDE.md に 10 必須セクションすべて存在
- [ ] AC-02: Error Context Template 存在
- [ ] AC-03: auto-injected ブロック残存（開始タグ + 終了タグ）
- [ ] AC-04: `.sage/config.yaml` project_checks active command なし
- [ ] AC-05: `.sage/config.yaml` に Phase 2 コメント
- [ ] AC-06: `bash scripts/sage-validate.sh 2>&1 | grep -c "MISSING"` が 0
- [ ] AC-07: `bash scripts/sage-validate.sh 2>&1` で `ERROR(S) FOUND` の数値が 0
- [ ] AC-08: secret 直書きパターン不在
- [ ] AC-09: (a) `git diff --name-only HEAD` が `CLAUDE.md` のみ（`.sage/` は gitignored）+ (b) `.sage/config.yaml` の `project_checks` がローカルで active command なしになっている
- [ ] AC-10: 差分に新規 gakuten 固有語なし

### Phase 2: 副作用確認

- [ ] 配布物（`package-templates/`）に変更なし
- [ ] SAGE 管理ファイル（`sage/`, `templates/`, `.claude/rules/*-rules.md`, `.claude/skills/sage-*/`）に変更なし
- [ ] 他 SPEC/PLAN/TASK 成果物に変更なし

### Phase 3: SAGE Gate 動作確認

- [ ] `bash scripts/sage-validate.sh` を実行し、出力全体を実行ログに記録
- [ ] 終了コード 0 で完了

### 失敗時の対応

- AC 失敗 → 該当 TASK（0023 or 0024）を再オープン
- sage-validate.sh で新規 MISSING が出る場合、SPEC 改訂か追加セクションを判断
- 連続 3 回失敗 → human escalation

## Done Definition
SPEC-0007 AC-01..AC-10 全 pass + Phase 2/3 全 pass。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0007（全 Gate 一括） |
| テスト種別 | structural + sage-validate + 副作用確認 |
| カバレッジ | N/A |
| commit-msg hook | TASK-0025 |
| Error Resolution | 失敗時 TASK 再オープン |
| failures/anti-patterns | PLAN-0007 |
| 採用メトリクス | TASK 完了 + 全 AC pass で SPEC-0007 Approved |
| 段階移行 | TASK 完了 → PLAN Completed → SPEC Approved → 本リポ SAGE 整備完了 |
| ロールバック | Level 2: 両ファイル一括復元 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
