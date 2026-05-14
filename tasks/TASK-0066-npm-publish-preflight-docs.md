# TASK-0066: npm publish preflight docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0066 |
| SPEC-ID   | SPEC-0017 |
| PLAN-ID   | PLAN-0017 |
| ステータス | Done |
| 担当Agent | Documentation |
| 並列可否  | No |
| 依存TASK  | TASK-0065 |
| 見積     | 25m |

## 責務

docs / README / roadmap に `npm publish --dry-run --tag next` と actual publish 未実行を明記する。

## 入力

- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`
- SPEC-0017 AC-02, AC-03

## 出力

- publish preflight docs
- roadmap current alpha scope update

## File Scope（変更許可範囲）

- 変更: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 削除: なし

## 禁止事項

- npm publish 済みと表現しない
- auth token / personal credential を書かない
- `package.json`, `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] docs / README / roadmap が `npm publish --dry-run --tag next` に言及する
- [x] roadmap が dry-run preflight と actual publish を分離する
- [x] TASK-0066 採点が 100/S++

## Tests

- `grep -R "npm publish --dry-run --tag next" README.md README-ja.md docs/cli.md docs/roadmap.md`
- `grep -q "actual publish" docs/roadmap.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| command missing | docs / README / roadmap に preflight command を追加 |
| publish 済み誤読 | actual publish 未実行の wording に修正 |
| auth secret risk | credential-like literal を削除 |

## Knowledge Management

publish docs の誤解が再発した場合、maintainer が該当 wording と修正方針を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

docs は dry-run preflight のみを追加し、actual publish 手順は approval 後の operation に残す。

## Done Definition

SPEC-0017 AC-02 と AC-03 が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0017-task-0066 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
