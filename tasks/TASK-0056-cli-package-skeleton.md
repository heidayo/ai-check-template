# TASK-0056: CLI package skeleton

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0056 |
| SPEC-ID   | SPEC-0015 |
| PLAN-ID   | PLAN-0015 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

Dependency-free Node CLI の package metadata, executable entrypoint, command dispatch skeleton を追加する。

## 入力

- `specs/SPEC-0015-cli-init-foundation.md`
- `plans/PLAN-0015-cli-init-foundation.md`
- `package-templates/**` は read-only source

## 出力

- `package.json`
- `bin/ai-check-template.mjs`
- `src/cli/index.mjs`
- `src/cli/utils.mjs`

## File Scope（変更許可範囲）

- 作成: `package.json`
- 作成: `bin/ai-check-template.mjs`
- 作成: `src/cli/index.mjs`
- 作成: `src/cli/utils.mjs`
- 変更: なし
- 削除: なし

## 禁止事項

- dependency を追加しない
- npm publish しない
- `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `python3 -m json.tool package.json` が pass
- [x] `node bin/ai-check-template.mjs --help` が usage を表示する
- [x] `package.json` の version が `0.2.0-alpha.0`
- [x] `package.json` に `bin.ai-check-template` が存在する
- [x] TASK-0056 採点が 100/S++

## Tests

- `python3 -m json.tool package.json`
- `node bin/ai-check-template.mjs --help`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| `package.json` JSON parse failure | metadata / comma / quote を修正し、`python3 -m json.tool package.json` を再実行 |
| help command failure | `bin/ai-check-template.mjs` entrypoint と `src/cli/index.mjs` dispatch を修正 |
| File Scope violation | scope 外変更を取り除き、TASK-0056 の許可ファイルだけを残す |

## Knowledge Management

Skeleton 由来の recurring failure が見つかった場合、maintainer が command / expected / actual を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

この TASK は executable skeleton のみを追加し、既存 runtime behavior と `package-templates/**` には影響しない。

## Done Definition

SPEC-0015 AC-01, AC-02, AC-06 の skeleton 部分が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0015-task-0056 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
