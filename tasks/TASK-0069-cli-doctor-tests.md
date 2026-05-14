# TASK-0069: CLI doctor tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0069 |
| SPEC-ID   | SPEC-0018 |
| PLAN-ID   | PLAN-0018 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0068 |
| 見積     | 45m |

## 責務

doctor の healthy / drift / JSON / read-only / optional CI and Claude hooks behavior を Node tests で検証する。

## 入力

- `src/cli/doctor.mjs`
- `bin/ai-check-template.mjs`
- SPEC-0018 AC-04..AC-09

## 出力

- `tests/cli/doctor.test.mjs`
- `tests/cli/package.test.mjs` update

## File Scope（変更許可範囲）

- 作成: `tests/cli/doctor.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 削除: なし

## 禁止事項

- tests を network / npm registry に依存させない
- target fixture に secret data を書かない
- generated tarball を repo に残さない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `node --test tests/cli/doctor.test.mjs` が pass
- [x] tests が healthy target pass を検証する
- [x] tests が missing / drift non-zero を検証する
- [x] tests が JSON parse と read-only snapshot を検証する
- [x] tests が direct / reusable / Claude checks を検証する
- [x] package tests が `src/cli/doctor.mjs` を tarball contents に含める
- [x] TASK-0069 採点が 100/S++

## Tests

- `node --test tests/cli/doctor.test.mjs`
- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| read-only test failure | doctor の write path を削除 |
| JSON parse failure | output schema を修正 |
| optional check failure | CI / Claude expected file mapping を修正 |

## Knowledge Management

test gap が見つかった場合、maintainer が missing scenario を `sage/failures.md` に記録し、doctor regression が繰り返される場合は `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

tests は local fixture に限定し、external project dogfooding は follow-up で扱う。

## Done Definition

SPEC-0018 AC-04..AC-09 が test で検証可能。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0018-task-0069 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
