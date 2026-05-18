# TASK-0140: Usage model links and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0140 |
| SPEC-ID   | SPEC-0038 |
| PLAN-ID   | PLAN-0038 |
| ステータス | Done |
| 担当Agent | Validation |
| 並列可否  | Yes |
| 依存TASK  | TASK-0139 |
| 見積     | 20m |

## 責務

README / README-ja / roadmap に usage model docs への導線を追加し、`make validate` の structural guard を追加する。

## File Scope（変更許可範囲）

- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- package code / templates を変更しない
- workflow / action source を変更しない
- 未実装の follow-up tracks を shipped と書かない
- secret / private URL を書かない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] README / README-ja が `docs/usage-model.md` にリンクする
- [x] roadmap が usage model を post-v0.3.0 adoption focus として参照する
- [x] Makefile validates usage model sections and links
- [x] `make validate-structure` pass
- [x] TASK-0140 採点が 100/S++

## Tests

- `make validate-structure`
- `rg -n "docs/usage-model.md" README.md README-ja.md docs/roadmap.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| missing link | README / roadmap に link を追加 |
| validation too broad | exact phrase / file に narrow |
| overclaim | future wording に修正 |

## Knowledge Management

validation false positive が発生した場合、maintainer が command, expected, actual, workaround を `sage/failures.md` に記録する。同じ false positive が 3 回累積した場合は `sage/anti-patterns.md` への昇格候補にする。

## 段階採用

README 導線と structural guard のみに限定し、runtime behavior は変更しない。

## Done Definition

SPEC-0038 AC-02, AC-03, AC-04 の docs and validation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0038-task-0140 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
