# TASK-0139: Usage model guide

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0139 |
| SPEC-ID   | SPEC-0038 |
| PLAN-ID   | PLAN-0038 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 25m |

## 責務

導入者向けに `ai-check-template` の使いどころを Local loop / Repair loop / E2E loop / CI gate / Review gate として整理する。

## File Scope（変更許可範囲）

- 作成: `docs/usage-model.md`
- 削除: なし

## 禁止事項

- runtime source を変更しない
- package templates を変更しない
- 未実装の follow-up tracks を shipped と書かない
- local-only research memo を commit しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `docs/usage-model.md` が 5 loops を説明する
- [x] post-implementation verification stack としての位置付けが明記される
- [x] when to use / what it gives / next tracks が具体化される
- [x] TASK-0139 採点が 100/S++

## Tests

- `rg -n "Local loop|Repair loop|E2E loop|CI gate|Review gate" docs/usage-model.md`
- `rg -n "post-implementation verification|does not make AI write code" docs/usage-model.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| missing loop | 5 loops section に追加 |
| overclaim | planned / future wording に修正 |
| too abstract | concrete commands and use cases を追加 |

## Knowledge Management

usage model confusion が再発した場合、maintainer が confusing phrase, expected wording, affected doc を `sage/failures.md` に記録する。同じ confusion が 3 回累積した場合は `sage/anti-patterns.md` への昇格候補にする。

## 段階採用

docs-only change として導入者理解を先に整え、security split / reviewability / Playwright stabilization は後続 SPEC に分離する。

## Done Definition

SPEC-0038 AC-01 の docs path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0038-task-0139 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
