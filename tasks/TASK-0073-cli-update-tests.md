# TASK-0073: CLI update tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0073 |
| SPEC-ID   | SPEC-0019 |
| PLAN-ID   | PLAN-0019 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0072 |
| 見積     | 50m |

## 責務

update の drift repair / optional CI and Claude hooks / dry-run / JSON / guarded write behavior を Node tests で検証する。

## 入力

- `src/cli/update.mjs`
- `src/cli/doctor.mjs`
- `bin/ai-check-template.mjs`
- SPEC-0019 AC-04..AC-10

## 出力

- `tests/cli/update.test.mjs`
- `tests/cli/package.test.mjs` update

## File Scope（変更許可範囲）

- 作成: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- tests を network / npm registry に依存させない
- target fixture に secret data を書かない
- generated tarball を repo に残さない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `node --test tests/cli/update.test.mjs` が pass
- [x] tests が update 後 doctor pass を検証する
- [x] tests が direct / reusable / Claude update を検証する
- [x] tests が dry-run no write と `--yes` guard を検証する
- [x] tests が JSON parse と unmanaged file unchanged を検証する
- [x] package tests が `src/cli/update.mjs` を tarball contents に含める
- [x] TASK-0073 採点が 100/S++

## Tests

- `node --test tests/cli/update.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| update test failure | failing fixture と operation output を確認し mapping を修正 |
| dry-run mutation | write path を dry-run branch から除外 |
| unmanaged file changed | write set を known managed paths に制限 |

## Knowledge Management

test gap が見つかった場合、maintainer が missing scenario を `sage/failures.md` に記録し、update regression が繰り返される場合は `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

tests は local fixture に限定し、external project dogfooding は follow-up で扱う。

## Done Definition

SPEC-0019 AC-04..AC-10 が test で検証可能。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0019-task-0073 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
