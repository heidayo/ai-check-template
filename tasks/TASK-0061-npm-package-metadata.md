# TASK-0061: npm package metadata

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0061 |
| SPEC-ID   | SPEC-0016 |
| PLAN-ID   | PLAN-0016 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 25m |

## 責務

`package.json` を npm public package として publish-ready な metadata に補強する。

## 入力

- `package.json`
- SPEC-0016 FR-01 / AC-01

## 出力

- repository / bugs / homepage / keywords / publishConfig を含む `package.json`

## File Scope（変更許可範囲）

- 変更: `package.json`
- 作成: なし
- 削除: なし

## 禁止事項

- runtime dependency を追加しない
- npm auth token / private registry URL / personal email を書かない
- `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` を変更しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `python3 -m json.tool package.json` が pass
- [x] `node -e "const p=require('./package.json'); for (const k of ['repository','bugs','homepage','keywords','publishConfig']) if (!p[k]) process.exit(1)"` が pass
- [x] `package.json` に private registry / auth token がない
- [x] TASK-0061 採点が 100/S++

## Tests

- `python3 -m json.tool package.json`
- `npm pack --dry-run --json`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| JSON parse failure | comma / quote / object shape を修正 |
| metadata missing | required field を補完 |
| secret-like metadata | private registry / token / personal email を削除 |

## Knowledge Management

metadata 不足が再発した場合、maintainer が npm command, expected field, actual package.json を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階採用

metadata だけを補強し、publish operation は follow-up SPEC に残す。

## Done Definition

SPEC-0016 AC-01 の metadata requirements が pass。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0016-task-0061 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
