# TASK-0154: Expo React Doctor tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0154 |
| SPEC-ID   | SPEC-0041 |
| PLAN-ID   | PLAN-0041 |
| ステータス | Done |
| 担当Agent | Test |
| 並列可否  | No |
| 依存TASK  | TASK-0152 |
| 見積     | 20m |

## 責務

`expo-rn` profile が React Doctor script を生成し、React Doctor unsupported warning を出さないことをテストする。

## File Scope（変更許可範囲）

- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/doctor.test.mjs`
- 削除: なし

## 禁止事項

- React Doctor binary を実行するテストを追加しない
- exact command drift を見逃すように assertion を緩めない

## 完了条件

- [x] init test covers `expo-rn` generated `doctor` script
- [x] doctor test covers no React Doctor unsupported warning for `expo-rn`
- [x] `node --test tests/cli/*.test.mjs` pass

## Tests

- `node --test tests/cli/*.test.mjs`

## 採点

- TASK-0154: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0041-task-0154 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
