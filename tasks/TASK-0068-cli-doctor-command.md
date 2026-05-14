# TASK-0068: CLI doctor command

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0068 |
| SPEC-ID   | SPEC-0018 |
| PLAN-ID   | PLAN-0018 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 50m |

## 責務

`ai-check-template doctor` の read-only command implementation と top-level dispatch を追加する。

## 入力

- `src/cli/index.mjs`
- `src/cli/utils.mjs`
- `package-templates/**` read-only
- SPEC-0018 FR-01..FR-07

## 出力

- `src/cli/doctor.mjs`
- `src/cli/index.mjs` updates

## File Scope（変更許可範囲）

- 作成: `src/cli/doctor.mjs`
- 変更: `src/cli/index.mjs`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- target files を書き換えない
- `package.json`, `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` を変更しない
- npm publish を実行しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `node bin/ai-check-template.mjs doctor --help` が pass
- [x] `node bin/ai-check-template.mjs --help` が `doctor` を表示する
- [x] healthy fixture で doctor が exit 0 を返す
- [x] drift fixture で doctor が exit 1 を返す
- [x] TASK-0068 採点が 100/S++

## Tests

- `node bin/ai-check-template.mjs doctor --help`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| help missing | `src/cli/index.mjs` usage / dispatch を修正 |
| healthy fixture fails | expected checks と init output の不整合を修正 |
| drift fixture passes | issue detection / exit code を修正 |

## Knowledge Management

doctor command failure が再発した場合、maintainer が command, fixture, expected, actual output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

read-only diagnosis のみを追加し、repair / update は follow-up SPEC に残す。

## Done Definition

SPEC-0018 AC-01, AC-04..AC-07 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0018-task-0068 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
