# TASK-0138: Verify v0.3.0 release

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0138 |
| SPEC-ID   | SPEC-0037 |
| PLAN-ID   | PLAN-0037 |
| ステータス | Done |
| 担当Agent | Verify |
| 並列可否  | No |
| 依存TASK  | TASK-0136, TASK-0137 |
| 見積     | 35m |

## 責務

SPEC-0037 の AC-01..AC-09 を機械検証し、SPEC / PLAN / TASK status と採点欄を完了状態に更新して commit / push / PR を作成する。PR merge 後、clean `main` で `v0.3.0` tag と GitHub Release を作成し、release state を確認する。

## File Scope（変更許可範囲）

- 変更: `specs/SPEC-0037-v0.3.0-release.md`
- 変更: `plans/PLAN-0037-v0.3.0-release.md`
- 変更: `tasks/TASK-0136-v0.3.0-release-docs.md`
- 変更: `tasks/TASK-0137-v0.3.0-release-validation.md`
- 変更: `tasks/TASK-0138-verify-v0.3.0-release.md`
- 削除: なし

## 禁止事項

- docs / validation files を追加修正しない
- failing validation を無視しない
- PR merge 前に tag / release を作らない
- npm publish / dist-tag mutation を実行しない
- Marketplace listing / `v1` tag を作らない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] SPEC-0037 AC-01..AC-09 が全 pass
- [x] `node --test tests/cli/*.test.mjs` pass
- [x] `make validate` pass
- [x] `bash scripts/sage-validate.sh` pass
- [x] `git diff --check` pass
- [x] secret / auth URL / private URL grep pass
- [x] File Scope / protected file check pass
- [x] `v0.3.0` tag and GitHub Release verification pass after merge
- [x] SPEC-0037 / PLAN-0037 / TASK-0136..0138 採点が 100/S++
- [x] commit message includes `TASK-0136 TASK-0137 TASK-0138`

## Tests

- `node --test tests/cli/*.test.mjs`
- `make validate`
- `bash scripts/sage-validate.sh`
- `git diff --check`
- secret / auth URL / private URL grep
- File Scope / protected scope check
- `git tag --list v0.3.0`
- `gh release view v0.3.0 --json tagName,isDraft,isPrerelease,url`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| AC failure | 対応 TASK の File Scope 内で修正して再検証 |
| SAGE validation failure | SAGE artifact status / traceability を修正 |
| CI failure | same branch で修正し GitHub Actions を再確認 |
| release creation failure | tag / release state を確認し、destructive mutation は user に確認 |

## Knowledge Management

検証で gate false positive や release operation mismatch があれば、maintainer が `sage/failures.md` に command, expected, actual, workaround を記録する。npm release と GitHub Actions release の混同が 3 回累積した場合は `sage/anti-patterns.md` への昇格候補にする。

## 段階採用

v0.3.0 は exact tag pin の GitHub Actions release として閉じ、Marketplace listing と `@v1` alias は follow-up に残す。

## Done Definition

PR が merge され、`v0.3.0` tag と GitHub Release が public normal release として確認できる。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0037-task-0138 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
