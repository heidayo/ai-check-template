# TASK-0120: CI workflow CLI integration

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0120 |
| SPEC-ID   | SPEC-0032 |
| PLAN-ID   | PLAN-0032 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0119 |
| 見積     | 45m |

## 責務

`init` / `update` / `doctor` の CI workflow path で rendered workflow content を使う。

## File Scope（変更許可範囲）

- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 変更: `src/cli/doctor.mjs`
- 削除: なし

## 禁止事項

- renderer / tests / docs / package templates を変更しない
- custom workflow cleanup semantics を broad match にしない
- update の effective option resolution を迂回しない
- dry-run write guard を壊さない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] init は selected/detected package manager で rendered workflow を copy する
- [x] update は effective package manager で rendered workflow を compare/update する
- [x] doctor は effective package manager で rendered workflow を compare する
- [x] inactive cleanup / diagnostics は rendered variants exact match のみ managed と扱う
- [x] TASK-0120 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| init writes pnpm for npm project | copyCiFiles を rendered content write に差し替える |
| update keeps stale pnpm workflow | updateCi expected content を rendered content に差し替える |
| doctor false drift | checkCi expected content を rendered content に差し替える |
| custom workflow deleted | exact variant detection を使う |

## Knowledge Management

CI integration regression が再発した場合、maintainer が command, target workflow before/after, operation output を `sage/failures.md` に記録する。

## 段階採用

runtime render のみ追加し、manual copy templates と hosted reusable workflow contract は変更しない。

## Done Definition

SPEC-0032 AC-04, AC-05, AC-06, AC-07 の integration path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0032-task-0120 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
