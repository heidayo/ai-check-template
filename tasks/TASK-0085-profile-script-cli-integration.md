# TASK-0085: Profile script CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0085 |
| SPEC-ID   | SPEC-0022 |
| PLAN-ID   | PLAN-0022 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0084 |
| 見積     | 50m |

## 責務

`init`, `doctor`, `update` の package script merge / check / migration path を profile scripts resolver に接続する。

## 入力

- `src/cli/profile-scripts.mjs`
- `src/cli/init.mjs`
- `src/cli/doctor.mjs`
- `src/cli/update.mjs`
- SPEC-0022 FR-02..FR-07

## 出力

- `src/cli/init.mjs` updates
- `src/cli/doctor.mjs` updates
- `src/cli/update.mjs` updates

## File Scope（変更許可範囲）

- 変更: `src/cli/init.mjs`
- 変更: `src/cli/doctor.mjs`
- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- `install-state` schema を変更しない
- `profile-diagnostics` warning behavior を変更しない
- `package-templates/**` を変更しない
- `init` の skip / overwrite semantics を壊さない
- `update --dry-run` で write しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `init` が selected profile scripts を merge する
- [x] `doctor` が effective profile scripts で drift check する
- [x] `update` が effective profile scripts へ migrate する
- [x] explicit profile override が update state refresh に反映される
- [x] TASK-0085 採点が 100/S++

## Tests

- `node --test tests/cli/init.test.mjs`
- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| init uses generic scripts | `mergePackageScripts` に parsed profile を渡す |
| doctor uses generic scripts | `checkPackageScripts` に effective profile を渡す |
| update ignores explicit profile | `writeOptions.profile` を effective profile にする |
| dry-run writes | `writeJson` guard と update branch を修正 |

## Knowledge Management

CLI integration mismatch が再発した場合、maintainer が command, profile, expected scripts, actual package.json を `sage/failures.md` に記録する。

## 段階採用

package scripts のみを profile-aware にし、shell scripts / CI / hooks の profile-specific migration は follow-up に残す。

## Done Definition

SPEC-0022 AC-04, AC-05, AC-06, AC-07, AC-08, AC-10 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0022-task-0085 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
