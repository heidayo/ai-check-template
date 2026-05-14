# TASK-0057: CLI init operations

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0057 |
| SPEC-ID   | SPEC-0015 |
| PLAN-ID   | PLAN-0015 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0056 |
| 見積     | 55m |

## 責務

`ai-check-template init` の profile validation, package scripts merge, scripts / CI / Claude hook copy を safe default で実装する。

## 入力

- `package-templates/package.scripts.fragment.json`
- `package-templates/scripts/ai-check.sh`
- `package-templates/scripts/ai-check-fast.sh`
- `package-templates/ci-examples/*.yml`
- `package-templates/.claude/**`
- SPEC-0015 FR-02..FR-08

## 出力

- `src/cli/init.mjs`
- `src/cli/profile.mjs`
- `src/cli/index.mjs` updates for init dispatch
- `src/cli/utils.mjs` file and JSON helpers

## File Scope（変更許可範囲）

- 作成: `src/cli/init.mjs`
- 作成: `src/cli/profile.mjs`
- 変更: `src/cli/index.mjs`
- 変更: `src/cli/utils.mjs`
- 変更: `bin/ai-check-template.mjs`
- 変更: `package.json`
- 削除: なし

## 禁止事項

- target existing files / scripts を default で上書きしない
- invalid profile を成功扱いにしない
- target に secret / private data を書き込まない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] fixture project で `node bin/ai-check-template.mjs init --target <dir> --profile react-nextjs --yes` が pass
- [x] `--dry-run` で target に file が追加されない
- [x] `--ci direct` と `--ci reusable` の copy path が実装される
- [x] `--claude-hooks` の rule copy と settings merge が実装される
- [x] TASK-0057 採点が 100/S++

## Tests

- `node bin/ai-check-template.mjs init --target <fixture> --profile react-nextjs --yes`
- `node bin/ai-check-template.mjs init --target <fixture> --profile react-nextjs --dry-run`
- `node bin/ai-check-template.mjs init --target <fixture> --profile invalid --yes`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| dry-run writes files | write adapter / `dryRun` branch を修正し、fixture diff を再確認 |
| existing file overwritten by default | copy guard / script merge guard を修正し、overwrite test を追加 |
| invalid profile succeeds | allowlist parser を修正し、path traversal / unknown profile test を再実行 |

## Knowledge Management

Init safety failure が見つかった場合、maintainer が target fixture, command, expected, actual を `sage/failures.md` に記録する。同種 safety bug が 3 回累積したら `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

既存 project には `--yes` 明示時のみ書き込み、default no overwrite と `--dry-run` で段階的導入を支える。

## Done Definition

SPEC-0015 AC-08, AC-09, AC-10, AC-11, AC-12 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0015-task-0057 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
