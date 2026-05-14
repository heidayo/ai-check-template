# TASK-0074: CLI update docs and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0074 |
| SPEC-ID   | SPEC-0019 |
| PLAN-ID   | PLAN-0019 |
| ステータス | Done |
| 担当Agent | Documentation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0072, TASK-0073 |
| 見積     | 35m |

## 責務

update command の docs と Makefile validation を追加する。

## 入力

- `README.md`
- `README-ja.md`
- `docs/cli.md`
- `docs/roadmap.md`
- `Makefile`
- SPEC-0019 AC-02, AC-03

## 出力

- update docs
- structural validation updates
- SAGE artifact status updates

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `specs/SPEC-0019-cli-update-foundation.md`
- 変更: `plans/PLAN-0019-cli-update-foundation.md`
- 変更: `tasks/TASK-0072-cli-update-command.md`
- 変更: `tasks/TASK-0073-cli-update-tests.md`
- 変更: `tasks/TASK-0074-cli-update-docs-validation.md`
- 変更: `tasks/TASK-0075-verify-cli-update-foundation.md`
- 削除: なし

## 禁止事項

- docs で profile-aware migration 実装済みと表現しない
- validation を skip しない
- File Scope 外の protected files を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `make validate` が update tests を実行して pass
- [x] docs / README / roadmap が `update` に言及する
- [x] roadmap が update foundation 完了と deeper migration 未完了を区別する
- [x] AC-01..AC-12 の機械検証結果を確認済み
- [x] TASK-0074 採点が 100/S++

## Tests

- `make validate`
- `grep -R "update" README.md README-ja.md docs/cli.md docs/roadmap.md Makefile`
- `git diff --check`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| docs missing | docs / README / roadmap に update 導線を追加 |
| validation missing | Makefile structural / CLI target を修正 |
| migration 済み誤読 | update foundation と profile-aware migration out-of-scope を明記 |

## Knowledge Management

validation gap が見つかった場合、maintainer が command / expected / actual を `sage/failures.md` に記録し、同種 gap 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

docs は update foundation のみを記述し、deeper migration は follow-up に残す。

## Done Definition

SPEC-0019 AC-02, AC-03, AC-11, AC-12 が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0019-task-0074 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
