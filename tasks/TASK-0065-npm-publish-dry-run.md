# TASK-0065: npm publish dry-run validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0065 |
| SPEC-ID   | SPEC-0017 |
| PLAN-ID   | PLAN-0017 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 25m |

## 責務

`make validate` に prerelease-safe な `npm publish --dry-run --tag next --json` preflight を追加し、npm dry-run が package metadata を auto-correct しないよう `bin` path を正規化する。

## 入力

- `Makefile`
- `package.json`
- SPEC-0017 AC-01, AC-04

## 出力

- `validate-npm-publish-dry-run` target
- npm-normalized `bin.ai-check-template` path

## File Scope（変更許可範囲）

- 変更: `Makefile`
- 変更: `package.json`
- 作成: なし
- 削除: なし

## 禁止事項

- actual `npm publish` を実行しない
- `npm whoami` を validation に要求しない
- `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `npm publish --dry-run --tag next --json` が pass
- [x] `make validate` が publish dry-run preflight を実行して pass
- [x] `package.json` の `bin.ai-check-template` が `bin/ai-check-template.mjs`
- [x] TASK-0065 採点が 100/S++

## Tests

- `npm publish --dry-run --tag next --json`
- `make validate`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| tag missing failure | command に `--tag next` を追加 |
| auth required failure | `--dry-run` が付いているか確認し、`npm whoami` dependency を除外 |
| Makefile target missing | validate dependency と target を追加 |
| package auto-corrected | `bin.ai-check-template` path を npm-normalized form に修正 |

## Knowledge Management

publish dry-run failure が再発した場合、maintainer が npm version, command, expected, actual output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

dry-run のみを validation に追加し、actual publish は explicit approval 後に分離する。

## Done Definition

SPEC-0017 AC-01 と AC-04 が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0017-task-0065 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
