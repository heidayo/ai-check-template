# TASK-0063: npm readiness validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0063 |
| SPEC-ID   | SPEC-0016 |
| PLAN-ID   | PLAN-0016 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0061, TASK-0062 |
| 見積     | 35m |

## 責務

package readiness を `make validate` と user-facing docs に接続する。

## 入力

- `Makefile`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`
- SPEC-0016 AC-06

## 出力

- package readiness validation target
- publish-not-yet docs

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `specs/SPEC-0016-npm-package-readiness.md`
- 変更: `plans/PLAN-0016-npm-package-readiness.md`
- 変更: `tasks/TASK-0061-npm-package-metadata.md`
- 変更: `tasks/TASK-0062-npm-pack-smoke-tests.md`
- 変更: `tasks/TASK-0063-npm-readiness-validation.md`
- 変更: `tasks/TASK-0064-verify-npm-package-readiness.md`
- 削除: なし

## 禁止事項

- docs で npm publish 済みと表現しない
- validation を skip しない
- generated tarball を commit しない
- File Scope 外の protected files を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `make validate` が npm package readiness を検証する
- [x] docs が local tarball readiness と publish-not-yet を説明する
- [x] roadmap が npm pack readiness を current alpha scope に追加する
- [x] AC-01..AC-09 の機械検証結果を確認済み
- [x] TASK-0063 採点が 100/S++

## Tests

- `make validate`
- `npm pack --dry-run --json`
- `grep -R "npm pack" README.md README-ja.md docs/cli.md docs/roadmap.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| `make validate` が pack readiness を実行しない | Makefile target dependency を修正 |
| docs が publish 済みに見える | publish-not-yet wording に修正 |
| roadmap link missing | v0.2.0 current alpha scope を更新 |

## Knowledge Management

validation gap が見つかった場合、maintainer が command / expected / actual を `sage/failures.md` に記録し、同種 gap 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

`make validate` に readiness check を足すだけに留め、publish operation は別 SPEC に残す。

## Done Definition

SPEC-0016 AC-06 と docs discoverability が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0016-task-0063 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
