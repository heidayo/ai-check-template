# TASK-0062: npm pack smoke tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0062 |
| SPEC-ID   | SPEC-0016 |
| PLAN-ID   | PLAN-0016 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0061 |
| 見積     | 45m |

## 責務

`npm pack` contents と local tarball-installed binary の `--help` / `init` smoke を Node tests で検証する。

## 入力

- `package.json`
- `bin/ai-check-template.mjs`
- `src/cli/*.mjs`
- `package-templates/**` read-only
- SPEC-0016 AC-02..AC-07

## 出力

- `tests/cli/package.test.mjs`

## File Scope（変更許可範囲）

- 作成: `tests/cli/package.test.mjs`
- 変更: `package.json`
- 削除: なし

## 禁止事項

- generated tarball を repository に残さない
- npm registry publish を実行しない
- tests を network publish / auth token に依存させない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `node --test tests/cli/package.test.mjs` が pass
- [x] tests が expected runtime files included を検証する
- [x] tests が SAGE artifacts / tests excluded を検証する
- [x] tests が installed binary `--help` を検証する
- [x] tests が installed binary `init` を fixture project で検証する
- [x] TASK-0062 採点が 100/S++

## Tests

- `node --test tests/cli/package.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| expected file missing | package `files` whitelist を修正 |
| excluded file included | package `files` whitelist を絞る |
| installed binary missing | `bin.ai-check-template` path / shebang を修正 |
| installed init failure | tarball 内 template path resolution を修正 |

## Knowledge Management

pack contents regression が見つかった場合、maintainer が npm version, command, expected files, actual files を `sage/failures.md` に記録する。同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

local tarball smoke に限定し、registry publish なしで publish readiness を検証する。

## Done Definition

SPEC-0016 AC-02..AC-07 の package tests が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0016-task-0062 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
