# TASK-0099: Package manager docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0099 |
| SPEC-ID   | SPEC-0026 |
| PLAN-ID   | PLAN-0026 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0098 |
| 見積     | 25m |

## 責務

package manager detection / explicit override / dependency install out-of-scope を external docs に反映する。

## 入力

- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`

## 出力

- Updated docs

## File Scope（変更許可範囲）

- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- implementation / tests を変更しない
- dependency install 実装済みと書かない
- npm publish 済みと書かない
- `package-templates/**` を変更しない
- 未完了 marker comment を残さない

## 完了条件

- [x] README / README-ja が package manager detection に言及する
- [x] `docs/cli.md` が `--package-manager` option / priority / detection を説明する
- [x] roadmap が package manager detection 完了と npm publish 未完了を区別する
- [x] TASK-0099 採点が 100/S++

## Tests

- docs grep
- `make validate`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| docs overclaim | dependency install / npm publish は scope 外に戻す |
| option missing | CLI options table を修正 |
| roadmap mismatch | v0.2.0 current alpha scope を修正 |

## Knowledge Management

docs mismatch が発生した場合、maintainer が stale docs location, expected behavior, actual text を `sage/failures.md` に記録する。

## 段階採用

docs は package scripts generation の package manager awareness に限定する。

## Done Definition

SPEC-0026 AC-02 の docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0026-task-0099 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
