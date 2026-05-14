# TASK-0101: Missing script diagnostics

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0101 |
| SPEC-ID   | SPEC-0027 |
| PLAN-ID   | PLAN-0027 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

`ai:check` / `ai:check:fast` が参照する package-manager-aware npm script invocation を解析し、未定義 script を `script-advice` warning として返す。

## 入力

- `src/cli/profile-diagnostics.mjs`
- SPEC-0027 FR-01..FR-06

## 出力

- Updated profile diagnostics parser
- `script-advice` warning generation

## File Scope（変更許可範囲）

- 変更: `src/cli/profile-diagnostics.mjs`
- 削除: なし

## 禁止事項

- controller / docs / tests を変更しない
- dependency install を実行しない
- missing scripts を作成しない
- package templates を変更しない
- warnings を issues に変換しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `ai:check` / `ai:check:fast` の script references を抽出できる
- [x] pnpm / npm / yarn / bun invocation を解析できる
- [x] defined scripts は warning にしない
- [x] duplicate missing script は dedupe される
- [x] TASK-0101 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| wrong parser match | regex を package manager invocation に限定する |
| duplicate warning | Set based dedupe を修正 |
| command contents leak | warning message を script name のみに戻す |

## Knowledge Management

missing script diagnostics regression が再発した場合、maintainer が command, package manager, package scripts, expected warning, actual warning を `sage/failures.md` に記録する。

## 段階採用

read-only diagnostics のみに限定し、dependency install / auto-creation は follow-up に分離する。

## Done Definition

SPEC-0027 AC-02, AC-04, AC-05, AC-06 の domain path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0027-task-0101 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
