# TASK-0058: CLI tests and docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0058 |
| SPEC-ID   | SPEC-0015 |
| PLAN-ID   | PLAN-0015 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0056, TASK-0057 |
| 見積     | 55m |

## 責務

CLI init の black-box tests と user-facing CLI alpha documentation を追加する。

## 入力

- SPEC-0015 AC-03, AC-04, AC-07..AC-12
- `src/cli/*.mjs`
- Existing README / roadmap language policy

## 出力

- `tests/cli/init.test.mjs`
- `docs/cli.md`
- README / README-ja / roadmap CLI alpha links

## File Scope（変更許可範囲）

- 作成: `tests/cli/init.test.mjs`
- 作成: `docs/cli.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `package.json`
- 削除: なし

## 禁止事項

- tests で network / npm install に依存しない
- docs に npm publish 済みと誤読される表現を入れない
- 個人 secret / email を書かない
- `package-templates/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `node --test tests/cli/*.test.mjs` が pass
- [x] tests が package scripts merge と scripts copy を検証する
- [x] tests が dry-run no write を検証する
- [x] tests が direct CI, reusable CI, Claude hooks を検証する
- [x] tests が no default overwrite と invalid profile reject を検証する
- [x] `docs/cli.md` が required flags に言及する
- [x] README / README-ja / roadmap が `docs/cli.md` にリンクする
- [x] TASK-0058 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`
- `grep -E "init|--profile|--dry-run|--overwrite|--ci|--claude-hooks" docs/cli.md`
- `grep -R "docs/cli.md" README.md README-ja.md docs/roadmap.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| CLI test failure | failing fixture を特定し、implementation または expected contract を SPEC に合わせて修正 |
| docs required flag missing | `docs/cli.md` に不足 flag と safety behavior を追加 |
| README link missing | README / README-ja / roadmap に CLI alpha docs link を追加 |

## Knowledge Management

Test gap が見つかった場合は missing scenario を `sage/failures.md` に記録し、CLI regression が繰り返される場合は `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

Docs は CLI alpha と明記し、npm publish 済みと誤読されないように repository-local usage を先に案内する。

## Done Definition

SPEC-0015 AC-03, AC-04, AC-07..AC-12 が test / docs として検証可能。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0015-task-0058 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
