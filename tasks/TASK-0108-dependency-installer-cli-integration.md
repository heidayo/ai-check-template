# TASK-0108: Dependency installer CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0108 |
| SPEC-ID   | SPEC-0029 |
| PLAN-ID   | PLAN-0029 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0107 |
| 見積     | 45m |

## 責務

`init` / `update` / global help に `--install-deps` を統合し、dry-run / actual opt-in の operation output と preflight order を実装する。

## 入力

- `src/cli/init.mjs`
- `src/cli/update.mjs`
- `src/cli/index.mjs`
- TASK-0107 dependency installer helpers

## 出力

- `init --install-deps`
- `update --install-deps`
- CLI help updates
- preflight before target writes for actual install

## File Scope（変更許可範囲）

- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 変更: `src/cli/index.mjs`
- 削除: なし

## 禁止事項

- dependency installer core module を変更しない
- tests / docs / SAGE status を変更しない
- `--install-deps` なしの behavior を変更しない
- `doctor` を変更しない
- package templates を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init parser accepts `--install-deps`
- [x] update parser accepts `--install-deps`
- [x] dry-run reports `would-install` without preflight / execution
- [x] actual install preflights before target writes
- [x] global help documents `--install-deps`
- [x] TASK-0108 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| unknown option | parser / usage text を更新 |
| dry-run invokes package manager | dry-run branch を operation-only に戻す |
| preflight after writes | preflight call を merge/copy/update 前へ移動 |

## Knowledge Management

CLI integration regression が再発した場合、maintainer が command, flags, expected operation order, actual output を `sage/failures.md` に記録する。

## 段階採用

existing init/update users への影響を避けるため、`--install-deps` が指定されたときだけ new path を有効化する。

## Done Definition

SPEC-0029 AC-01, AC-02, AC-03, AC-04, AC-07, AC-08, AC-09 の CLI integration path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0029-task-0108 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
