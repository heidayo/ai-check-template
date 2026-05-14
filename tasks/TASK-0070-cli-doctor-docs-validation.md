# TASK-0070: CLI doctor docs and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0070 |
| SPEC-ID   | SPEC-0018 |
| PLAN-ID   | PLAN-0018 |
| ステータス | Done |
| 担当Agent | Documentation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0068, TASK-0069 |
| 見積     | 35m |

## 責務

doctor command の docs と Makefile validation を追加する。

## 入力

- `README.md`
- `README-ja.md`
- `docs/cli.md`
- `docs/roadmap.md`
- `Makefile`
- SPEC-0018 AC-02, AC-03

## 出力

- doctor docs
- structural validation updates
- SAGE artifact status updates

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `specs/SPEC-0018-cli-doctor-foundation.md`
- 変更: `plans/PLAN-0018-cli-doctor-foundation.md`
- 変更: `tasks/TASK-0068-cli-doctor-command.md`
- 変更: `tasks/TASK-0069-cli-doctor-tests.md`
- 変更: `tasks/TASK-0070-cli-doctor-docs-validation.md`
- 変更: `tasks/TASK-0071-verify-cli-doctor-foundation.md`
- 削除: なし

## 禁止事項

- docs で update / repair 実装済みと表現しない
- validation を skip しない
- File Scope 外の protected files を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `make validate` が doctor tests を実行して pass
- [x] docs / README / roadmap が `doctor` に言及する
- [x] roadmap が doctor foundation 完了と update 未完了を区別する
- [x] AC-01..AC-11 の機械検証結果を確認済み
- [x] TASK-0070 採点が 100/S++

## Tests

- `make validate`
- `grep -R "doctor" README.md README-ja.md docs/cli.md docs/roadmap.md Makefile`
- `git diff --check`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| docs missing | docs / README / roadmap に doctor 導線を追加 |
| validation missing | Makefile structural / CLI target を修正 |
| update 済み誤読 | doctor foundation と update out-of-scope を明記 |

## Knowledge Management

validation gap が見つかった場合、maintainer が command / expected / actual を `sage/failures.md` に記録し、同種 gap 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

docs は doctor foundation のみを記述し、update / repair は follow-up に残す。

## Done Definition

SPEC-0018 AC-02, AC-03, AC-10, AC-11 が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0018-task-0070 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
