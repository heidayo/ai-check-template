# TASK-0134: GitHub Action docs and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0134 |
| SPEC-ID   | SPEC-0036 |
| PLAN-ID   | PLAN-0036 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0132, TASK-0133 |
| 見積     | 40m |

## 責務

hosted reusable workflow / Composite Action の導入 docs と `make validate` structural guard を追加する。

## File Scope（変更許可範囲）

- 作成: `docs/github-actions.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `package-templates/ci-examples/README.md`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- package code / templates を変更しない
- Marketplace listing 完了と書かない
- secret / private URL を書かない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] docs explain hosted workflow vs Composite Action vs copy examples
- [x] README / README-ja / roadmap link `docs/github-actions.md`
- [x] Makefile validates hosted workflow / action / docs structure
- [x] Marketplace listing remains planned
- [x] TASK-0134 採点が 100/S++

## Tests

- `make validate-structure`
- `rg -n "hosted reusable workflow|Composite Action|copy examples|Marketplace" docs/github-actions.md`
- `rg -n "docs/github-actions.md" README.md README-ja.md docs/roadmap.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| docs overclaim release | foundation / follow-up release wording に戻す |
| Makefile false positive | exact files / required phrases に narrow |
| missing distinction | comparison table を追加 |

## Knowledge Management

docs distinction の不足が再発した場合、maintainer が confusing phrase, expected wording, affected doc を `sage/failures.md` に記録する。同じ distinction gap が 3 回累積した場合は `sage/anti-patterns.md` への昇格候補にする。

## 段階採用

v0.3.0 foundation docs を追加し、actual release / Marketplace は follow-up に残す。

## Done Definition

SPEC-0036 AC-03, AC-04, AC-05 の docs and validation path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0036-task-0134 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
