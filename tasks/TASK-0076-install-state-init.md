# TASK-0076: Install state module and init write

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0076 |
| SPEC-ID   | SPEC-0020 |
| PLAN-ID   | PLAN-0020 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## 責務

install state schema v1 の read / write helper を追加し、`init` が target root の `.ai-check-template.json` に導入時 metadata を保存する。

## 入力

- `src/cli/init.mjs`
- `src/cli/profile.mjs`
- `src/cli/utils.mjs`
- `package.json` read-only
- SPEC-0020 FR-01, FR-02

## 出力

- `src/cli/install-state.mjs`
- `src/cli/init.mjs` updates

## File Scope（変更許可範囲）

- 作成: `src/cli/install-state.mjs`
- 変更: `src/cli/init.mjs`
- 削除: なし

## 禁止事項

- `package.json` を変更しない
- `package-templates/**` を変更しない
- target state に timestamp / absolute target path / environment values を保存しない
- `--dry-run` で state file を書かない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `init` が `.ai-check-template.json` を作成する
- [x] state が schemaVersion 1 / packageName / packageVersion / profile / ci / claudeHooks / managedBy を含む
- [x] `--dry-run` では state を書かない
- [x] TASK-0076 採点が 100/S++

## Tests

- `node --test tests/cli/init.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| state file missing | `init` completion path に `writeInstallState` を追加 |
| state has absolute path | schema builder から target path field を削除 |
| dry-run writes | `writeInstallState` に dry-run guard を追加 |

## Knowledge Management

install state creation failure が再発した場合、maintainer が command、expected state、actual state を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

既存 CLI behavior に state write を additive に追加し、existing projects without state は後続 TASK で legacy defaults を維持する。

## Done Definition

SPEC-0020 AC-02 の implementation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0020-task-0076 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
