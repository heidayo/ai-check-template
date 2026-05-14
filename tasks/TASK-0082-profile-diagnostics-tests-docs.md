# TASK-0082: Profile diagnostics tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0082 |
| SPEC-ID   | SPEC-0021 |
| PLAN-ID   | PLAN-0021 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0080, TASK-0081 |
| 見積     | 45m |

## 責務

profile diagnostics warnings を CLI tests / package tests で固定し、README / README-ja / `docs/cli.md` / roadmap に non-blocking warnings を説明する。

## 入力

- `src/cli/profile-diagnostics.mjs`
- `src/cli/doctor.mjs`
- `tests/cli/doctor.test.mjs`
- `tests/cli/package.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- Updated doctor tests
- Updated package pack test
- Updated docs

## File Scope（変更許可範囲）

- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation files を変更しない
- `package-templates/**` を変更しない
- docs に strict warning failure mode を実装済みと書かない
- TODO/FIXME を残さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] warnings with no issues exits 0 の test が pass
- [x] node-cli / supabase addon / explicit profile / malformed package tests が pass
- [x] package dry-run test が `src/cli/profile-diagnostics.mjs` を required file として検証する
- [x] README / README-ja / `docs/cli.md` / roadmap が profile diagnostics warnings に言及する
- [x] TASK-0082 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/package.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| warning test fails | fixture package scripts と expected warning code を調整 |
| docs overclaim strict mode | strict / failure 表現を advisory に修正 |
| package test missing file | requiredFiles に `src/cli/profile-diagnostics.mjs` を追加 |

## Knowledge Management

profile diagnostics test false positive / false negative が発生した場合、maintainer が fixture, command, expected, actual を `sage/failures.md` に記録する。

## 段階採用

docs は non-blocking warning foundation として説明し、profile-specific migration と strict gates は未完了として残す。

## Done Definition

SPEC-0021 AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10 の test / docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0021-task-0082 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
