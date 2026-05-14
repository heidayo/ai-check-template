# TASK-0077: State-aware doctor and update

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0077 |
| SPEC-ID   | SPEC-0020 |
| PLAN-ID   | PLAN-0020 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0076 |
| 見積     | 55m |

## 責務

`doctor` / `update` が install state を読み、explicit flags > install state > legacy defaults の順で effective options を決定する。JSON output に installation / effectiveOptions を追加し、`update` は successful write 時に state を refresh する。

## 入力

- `src/cli/install-state.mjs`
- `src/cli/doctor.mjs`
- `src/cli/update.mjs`
- SPEC-0020 FR-03..FR-09

## 出力

- `src/cli/doctor.mjs` updates
- `src/cli/update.mjs` updates

## File Scope（変更許可範囲）

- 変更: `src/cli/doctor.mjs`
- 変更: `src/cli/update.mjs`
- 削除: なし

## 禁止事項

- `doctor` で target を書き換えない
- malformed install state を無視して `update` write に進まない
- explicit flags より state を優先しない
- `--dry-run` で state file を書かない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `doctor` が state defaults を使う
- [x] `update` が state defaults を使う
- [x] `doctor --json` / `update --json` が installation / effectiveOptions を含む
- [x] `update` が successful write 時に state を refresh する
- [x] malformed state では `update` が write 前に reject する
- [x] TASK-0077 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| explicit flags ignored | parser に explicit flag presence を追加し resolver を修正 |
| doctor writes | doctor path から write helper 呼び出しを削除 |
| update writes malformed state | state parse result を write operation 前に検査 |
| JSON missing fields | output builder に additive fields を追加 |

## Knowledge Management

state-aware default mismatch が再発した場合、maintainer が command、state JSON、expected effective options、actual output を `sage/failures.md` に記録する。

## 段階採用

existing targets without state は legacy defaults を維持し、state-aware behavior は additive に導入する。

## Done Definition

SPEC-0020 AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0020-task-0077 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
