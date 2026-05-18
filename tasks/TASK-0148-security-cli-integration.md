# TASK-0148: Security CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0148 |
| SPEC-ID   | SPEC-0040 |
| PLAN-ID   | PLAN-0040 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0147 |
| 見積     | 35m |

## 責務

CLI `init` / `doctor` / `update` と profile script generation に `ai:check:secure` を統合する。

## File Scope（変更許可範囲）

- 変更: `src/cli/profile-scripts.mjs`
- 変更: `src/cli/profile-diagnostics.mjs`
- 変更: `src/cli/init.mjs`
- 変更: `src/cli/doctor.mjs`
- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- package manager rendering の既存挙動を壊さない
- dependency installer に Semgrep を追加しない
- workflow / action contract を変更しない

## 完了条件

- [x] `getProfileScripts()` returns `ai:check:secure` for all base profiles
- [x] `init` copies `scripts/ai-check-secure.sh`
- [x] `doctor` checks `scripts/ai-check-secure.sh`
- [x] `update` creates / repairs `scripts/ai-check-secure.sh`

## Tests

- `node --test tests/cli/*.test.mjs`

## 採点

- TASK-0148: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0040-task-0148 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
