# TASK-0092: Stale CI tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0092 |
| SPEC-ID   | SPEC-0024 |
| PLAN-ID   | PLAN-0024 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0091 |
| 見積     | 40m |

## 責務

stale managed CI warnings の default compatibility / strict failure / false-positive guard / read-only behavior を tests で固定し、docs に diagnostics の意味を説明する。

## 入力

- `src/cli/doctor.mjs`
- `tests/cli/doctor.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- Updated doctor tests
- Updated docs

## File Scope（変更許可範囲）

- 変更: `tests/cli/doctor.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation files を変更しない
- docs に stale workflow cleanup 実装済みと書かない
- workflow YAML contents を変更しない
- `package-templates/**` を変更しない
- 未完了 marker comment を残さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] stale direct workflows + `--ci none` default test が exit 0 を確認する
- [x] stale direct workflows + `--ci none --strict` test が exit 1 を確認する
- [x] warning code / path test が `ci-advice` と workflow paths を確認する
- [x] custom workflow false-positive guard test が pass
- [x] README / README-ja / `docs/cli.md` / roadmap が stale CI diagnostics に言及する
- [x] TASK-0092 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| default test fails | stale CI warning を advisory に戻す |
| strict test fails | warnings merge と strict condition を修正 |
| custom false-positive test fails | exact template match 判定を修正 |
| docs overclaim | cleanup は未実装であることを明記 |

## Knowledge Management

stale CI tests の false positive / false negative が発生した場合、maintainer が fixture, command, expected, actual を `sage/failures.md` に記録する。

## 段階採用

docs は stale managed workflow diagnostics のみを記述し、cleanup / deletion は follow-up に残す。

## Done Definition

SPEC-0024 AC-01, AC-02, AC-03, AC-04, AC-05, AC-07 の test / docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0024-task-0092 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
