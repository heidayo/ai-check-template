# TASK-0150: Security split tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0150 |
| SPEC-ID   | SPEC-0040 |
| PLAN-ID   | PLAN-0040 |
| ステータス | Done |
| 担当Agent | Test |
| 並列可否  | No |
| 依存TASK  | TASK-0148 |
| 見積     | 35m |

## 責務

CLI と package smoke tests が `ai:check:secure` の init / doctor / update / pack 挙動を検証するよう更新する。

## File Scope（変更許可範囲）

- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- テスト期待値だけを緩めて実装不備を隠さない
- external Semgrep binary を実行するテストを追加しない
- test fixture cleanup 以外の destructive command を使わない

## 完了条件

- [x] init tests assert secure package script and shell file
- [x] doctor/update tests pass with secure script expectations
- [x] package test asserts packed CLI init creates secure script
- [x] `node --test tests/cli/*.test.mjs` pass

## Tests

- `node --test tests/cli/*.test.mjs`

## 採点

- TASK-0150: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0040-task-0150 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
