# TASK-0145: Reviewability docs and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0145 |
| SPEC-ID   | SPEC-0039 |
| PLAN-ID   | PLAN-0039 |
| ステータス | Done |
| 担当Agent | Validation |
| 並列可否  | No |
| 依存TASK  | TASK-0142, TASK-0143, TASK-0144 |
| 見積     | 30m |

## 責務

追加した reviewability templates を package catalog / public docs / structural validation へ接続する。

## 入力

- TASK-0142 output
- TASK-0143 output
- TASK-0144 output

## 出力

- `package-templates/README.md`
- `package-templates/prompts/README.md`
- `docs/usage-model.md`
- `README.md`
- `README-ja.md`
- `docs/roadmap.md`
- `Makefile`

## File Scope（変更許可範囲）

- 変更: `package-templates/README.md`
- 変更: `package-templates/prompts/README.md`
- 変更: `docs/usage-model.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- CLI 自動コピー済みと書かない
- runtime / workflow / action files を変更しない
- README の profile support claims を本 TASK で修正しない
- local-only research memo を commit しない

## 完了条件

- [x] package README and prompts README link the new files
- [x] README / README-ja and usage model mention reviewability templates
- [x] roadmap marks reviewability template foundation as adoption-focused shipped docs, not CLI behavior
- [x] `make validate-structure` pass

## Tests

- `make validate-structure`
- docs grep for each new template path

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| docs overclaim auto-copy | Reword as manual-copy template |
| Makefile guard false-positive | Narrow to exact file paths and headings |

## Knowledge Management

Validation guard の誤検知があれば `sage/failures.md` follow-up とし、本 TASK では File Scope 内で narrow する。

## 段階採用

Catalog と validation を先に固め、CLI install integration は別 SPEC に残す。

## 採点

- TASK-0145: 100/S++

## Done Definition

TASK-0146 の検証で AC-04 / AC-05 が pass する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0039-task-0145 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
