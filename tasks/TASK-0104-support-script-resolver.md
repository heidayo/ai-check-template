# TASK-0104: Support script resolver

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0104 |
| SPEC-ID   | SPEC-0028 |
| PLAN-ID   | PLAN-0028 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

profile-aware support script defaults を resolver に追加し、`init` / `update` が missing の場合だけ package.json に追加する。

## 入力

- `src/cli/profile-scripts.mjs`
- `src/cli/init.mjs`
- `src/cli/update.mjs`
- SPEC-0028 FR-01..FR-06

## 出力

- `getProfileSupportScripts`
- init support script missing-only merge
- update support script missing-only create

## File Scope（変更許可範囲）

- 変更: `src/cli/profile-scripts.mjs`
- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- docs / tests / SAGE status を変更しない
- dependency install を実行しない
- existing support scripts を overwrite しない
- package templates を変更しない
- `doctor` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] support script defaults が resolver から取得できる
- [x] init が missing support scripts を追加する
- [x] update が missing support scripts を追加する
- [x] existing support scripts は保持される
- [x] TASK-0104 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| support script missing | resolver defaults を修正 |
| overwrite regression | existing script branch を missing-only に戻す |
| dry-run writes | writeJson の条件を修正 |

## Knowledge Management

support script resolver regression が再発した場合、maintainer が command, profile, package scripts, expected operation, actual operation を `sage/failures.md` に記録する。

## 段階採用

support scripts の entry creation に限定し、dependency install は follow-up に分離する。

## Done Definition

SPEC-0028 AC-02, AC-03, AC-04, AC-06 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0028-task-0104 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
