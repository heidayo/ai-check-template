# TASK-0102: Missing script diagnostics tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0102 |
| SPEC-ID   | SPEC-0027 |
| PLAN-ID   | PLAN-0027 |
| ステータス | Done |
| 担当Agent | Test+Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0101 |
| 見積     | 45m |

## 責務

doctor tests と external docs に missing script diagnostics の behavior を固定する。

## 入力

- `tests/cli/doctor.test.mjs`
- `tests/cli/update.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- Updated doctor tests
- Updated CLI docs / README / roadmap

## File Scope（変更許可範囲）

- 変更: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation outside TASK-0101 を変更しない
- dependency install 実装済みと書かない
- script auto-creation 実装済みと書かない
- package templates を変更しない
- 未完了 marker comment を残さない

## 完了条件

- [x] doctor JSON warning test が pass
- [x] doctor strict warning failure test が pass
- [x] defined scripts no-warning test が pass
- [x] npm / yarn / bun / pnpm parser coverage test が pass
- [x] README / README-ja / `docs/cli.md` / roadmap が missing script diagnostics に言及する
- [x] TASK-0102 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- docs grep
- `make validate`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| strict test not failing | warning emission と strict status logic を確認 |
| docs overclaim | dependency install / auto-creation claim を削除 |
| parser coverage gap | missing package manager pattern の fixture を追加 |

## Knowledge Management

docs mismatch が発生した場合、maintainer が stale docs location, expected behavior, actual text を `sage/failures.md` に記録する。

## 段階採用

docs は read-only diagnostics に限定し、dependency install と support script auto-creation は future work として残す。

## Done Definition

SPEC-0027 AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 の tests/docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0027-task-0102 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
