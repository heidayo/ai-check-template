# TASK-0081: Doctor warning output integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0081 |
| SPEC-ID   | SPEC-0021 |
| PLAN-ID   | PLAN-0021 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0080 |
| 見積     | 40m |

## 責務

`doctor` に profile diagnostics warnings を統合し、JSON / human output に warnings を additive に追加する。

## 入力

- `src/cli/doctor.mjs`
- `src/cli/profile-diagnostics.mjs`
- SPEC-0021 FR-01..FR-05

## 出力

- `src/cli/doctor.mjs` updates

## File Scope（変更許可範囲）

- 変更: `src/cli/doctor.mjs`
- 削除: なし

## 禁止事項

- warnings を exit status failure にしない
- `init`, `update`, `install-state` を変更しない
- target file contents を output しない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `doctor --json` が `warnings` array を含む
- [x] human output が warnings count と details を表示する
- [x] warnings だけでは exit 0 のまま
- [x] malformed package.json では warnings generation を skip する
- [x] TASK-0081 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| warnings cause fail | status calculation を `issues.length` のみに修正 |
| JSON consumers break | existing fields を残し `warnings` を additive にする |
| malformed package throws | invalid-json branch で diagnostics を skip |

## Knowledge Management

doctor warning regression が再発した場合、maintainer が command, output, expected status を `sage/failures.md` に記録する。

## 段階採用

read-only `doctor` の output enhancement に限定し、write command には影響させない。

## Done Definition

SPEC-0021 AC-02, AC-04, AC-08, AC-10 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0021-task-0081 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
