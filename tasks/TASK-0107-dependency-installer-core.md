# TASK-0107: Dependency installer core

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0107 |
| SPEC-ID   | SPEC-0029 |
| PLAN-ID   | PLAN-0029 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

profile-aware npm dev dependency allowlist、missing dependency detection、package manager install command construction、preflight / execution helpers を実装する。

## 入力

- SPEC-0029 FR-04, FR-05, SEC-01, SEC-02
- existing package manager names from SPEC-0026

## 出力

- `src/cli/dependency-installer.mjs`
- exported helpers for install planning, preflight, and execution

## File Scope（変更許可範囲）

- 作成: `src/cli/dependency-installer.mjs`
- 削除: なし

## 禁止事項

- init / update / docs / tests を変更しない
- runtime dependencies を追加しない
- package templates を変更しない
- target package.json の arbitrary values を command args に混ぜない
- `shell: true` を使わない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] fixed allowlist から profile dev dependencies を取得できる
- [x] existing dependency declarations は missing install args から除外される
- [x] package manager ごとに deterministic install command が構築される
- [x] preflight failure は `CliError` で報告される
- [x] TASK-0107 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| wrong package args | allowlist / package manager command map を修正 |
| duplicate package args | dependency section scan を修正 |
| shell usage | `spawnSync(command, args, { shell: false })` に戻す |

## Knowledge Management

install args regression が再発した場合、maintainer が command, profile, package.json dependency sections, expected args, actual args を `sage/failures.md` に記録する。

## 段階採用

core helper は init/update integration から分離し、`--install-deps` opt-in 以外では呼ばれないようにする。

## Done Definition

SPEC-0029 AC-03, AC-04, AC-05, AC-07 の core path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0029-task-0107 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
