# TASK-0152: Expo React Doctor CLI correction

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0152 |
| SPEC-ID   | SPEC-0041 |
| PLAN-ID   | PLAN-0041 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 25m |

## 責務

`expo-rn` profile scripts and diagnostics を React Doctor React Native support に合わせて修正する。

## File Scope（変更許可範囲）

- 変更: `src/cli/profile-scripts.mjs`
- 変更: `src/cli/profile-diagnostics.mjs`
- 削除: なし

## 禁止事項

- non-Expo profile command を変更しない
- React Doctor dependency install を追加しない
- E2E tooling を変更しない

## 完了条件

- [x] `expo-rn` generated `ai:check` includes `doctor`
- [x] `expo-rn` generated scripts include `doctor`
- [x] `profile-diagnostics` no longer warns that Expo React Native does not support React Doctor

## Tests

- `node --test tests/cli/*.test.mjs`

## 採点

- TASK-0152: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0041-task-0152 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
