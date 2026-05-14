# TASK-0089: Doctor strict tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0089 |
| SPEC-ID   | SPEC-0023 |
| PLAN-ID   | PLAN-0023 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0088 |
| 見積     | 40m |

## 責務

`doctor --strict` の default compatibility / strict failure / JSON shape / read-only behavior を tests で固定し、docs に opt-in strict mode を説明する。

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
- docs に default strict を示唆しない
- warning severity / ignore config を実装済みと書かない
- `package-templates/**` を変更しない
- 未完了 marker comment を残さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] warning-only default test が exit 0 を確認する
- [x] warning-only strict test が exit 1 を確認する
- [x] strict JSON shape test が `strict: true`, warnings retained, issues empty を確認する
- [x] strict read-only snapshot test が pass
- [x] README / README-ja / `docs/cli.md` / roadmap が strict mode に言及する
- [x] TASK-0089 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| default test fails | implementation status calculation を修正 |
| strict test fails | implementation strict condition を修正 |
| docs overclaim | opt-in wording に修正 |
| snapshot changed | doctor implementation を read-only に戻す |

## Knowledge Management

strict tests の false positive / false negative が発生した場合、maintainer が fixture, command, expected, actual を `sage/failures.md` に記録する。

## 段階採用

docs は opt-in strict warnings として説明し、warning severity / ignore config は未完了として残す。

## Done Definition

SPEC-0023 AC-02, AC-03, AC-04, AC-05, AC-06, AC-08 の test / docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0023-task-0089 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
