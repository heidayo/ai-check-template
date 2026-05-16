# TASK-0119: CI workflow renderer

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0119 |
| SPEC-ID   | SPEC-0032 |
| PLAN-ID   | PLAN-0032 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

fixed CI workflow template files を selected package manager 用 content に render する helper を実装する。

## File Scope（変更許可範囲）

- 作成: `src/cli/ci-workflows.mjs`
- 削除: なし

## 禁止事項

- init / update / doctor / docs / tests を変更しない
- package templates を変更しない
- repository `.github/**` を変更しない
- runtime dependencies を追加しない
- unknown workflow file names を処理しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] direct workflow install/check command が package manager 別に render される
- [x] reusable caller workflow inputs が package manager 別に render される
- [x] reusable workflow body は template content を preserve する
- [x] managed workflow variants を exact match 判定できる
- [x] TASK-0119 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| wrong install command | renderer command table を SPEC-0032 FR に合わせる |
| wrong check command | `scriptCommand(packageManager, scriptName)` を使う |
| unsafe file name | fixed workflow file name allowlist に戻す |

## Knowledge Management

workflow renderer regression が再発した場合、maintainer が file name, package manager, expected snippet, actual snippet を `sage/failures.md` に記録する。

## 段階採用

renderer は target write を行わず、init/update/doctor integration からのみ使用する。

## Done Definition

SPEC-0032 AC-01, AC-02, AC-03, AC-07 の renderer path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0032-task-0119 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
