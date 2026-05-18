# TASK-0153: Expo React Doctor docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0153 |
| SPEC-ID   | SPEC-0041 |
| PLAN-ID   | PLAN-0041 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0152 |
| 見積     | 25m |

## 責務

README / profile / CLI docs の React Doctor 非対応表現を修正し、Makefile guard を追加する。

## File Scope（変更許可範囲）

- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/cli.md`
- 変更: `package-templates/profiles/README.md`
- 変更: `package-templates/profiles/expo-rn/README.md`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- `node-cli` の React Doctor 非対応表現を変更しない
- React Doctor を security scanner と書かない
- Official support を超えて full mobile QA を保証しない

## 完了条件

- [x] README / README-ja mention Expo React Doctor support
- [x] expo profile docs mention official React Native support
- [x] docs keep Maestro / Detox as mobile E2E guidance
- [x] `make validate-structure` pass

## Tests

- `make validate-structure`

## 採点

- TASK-0153: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0041-task-0153 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
