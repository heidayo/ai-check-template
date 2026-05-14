# TASK-0080: Profile diagnostics module

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0080 |
| SPEC-ID   | SPEC-0021 |
| PLAN-ID   | PLAN-0021 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

effective profile と package scripts から non-blocking profile advisory warnings を生成する module を追加する。

## 入力

- `src/cli/profile.mjs` read-only
- `package-templates/profiles/**/README.md` read-only
- SPEC-0021 FR-06..FR-10

## 出力

- `src/cli/profile-diagnostics.mjs`

## File Scope（変更許可範囲）

- 作成: `src/cli/profile-diagnostics.mjs`
- 削除: なし

## 禁止事項

- `doctor` integration をこの TASK で変更しない
- `package-templates/**` を変更しない
- warning message に package script command 全文を含めない
- runtime dependencies を追加しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] profile diagnostics module が warning array を返す
- [x] 5 profiles の advisory path が module 内にある
- [x] warning object が `{ code, path, message }` shape を持つ
- [x] TASK-0080 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| warning command leak | message builder から command value を削除 |
| profile not covered | base / addon branch を追加 |
| warning shape mismatch | `{ code, path, message }` に統一 |

## Knowledge Management

profile advisory failure が再発した場合、maintainer が profile, package scripts shape, expected, actual を `sage/failures.md` に記録する。

## 段階採用

fail ではなく advisory warning として追加し、strict gates は follow-up SPEC に残す。

## Done Definition

SPEC-0021 AC-05, AC-06 の module path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0021-task-0080 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
