# TASK-0142: Reviewability PR template

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0142 |
| SPEC-ID   | SPEC-0039 |
| PLAN-ID   | PLAN-0039 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 20m |

## 責務

導入先 repository に手動コピーできる reviewability-focused PR template を `package-templates/.github/` に追加する。

## 入力

- SPEC-0039
- PLAN-0039
- 既存 root `.github/PULL_REQUEST_TEMPLATE.md` は参照のみ

## 出力

- `package-templates/.github/PULL_REQUEST_TEMPLATE.md`

## File Scope（変更許可範囲）

- 作成: `package-templates/.github/PULL_REQUEST_TEMPLATE.md`
- 変更: なし
- 削除: なし

## 禁止事項

- root `.github/PULL_REQUEST_TEMPLATE.md` を変更しない
- `.github/workflows/**` を変更しない
- CLI 自動コピー済みと書かない
- external article の文面を長文転載しない

## 完了条件

- [x] PR template contains AI-Generated Code Review, Adopted design, Alternatives considered, Risks and tradeoffs, Tests added or updated
- [x] PR template captures commands run and human understanding
- [x] file is English primary and product-agnostic

## Tests

- `grep -q "AI-Generated Code Review" package-templates/.github/PULL_REQUEST_TEMPLATE.md`
- `grep -q "Adopted design" package-templates/.github/PULL_REQUEST_TEMPLATE.md`
- `grep -q "Alternatives considered" package-templates/.github/PULL_REQUEST_TEMPLATE.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| required heading missing | Add exact heading or field |
| root PR template changed | Revert that out-of-scope diff and keep package template only |

## Knowledge Management

PR template が重すぎるという feedback が出た場合は `sage/failures.md` に affected fields と expected shorter wording を記録する。

## 段階採用

Manual-copy template として追加し、CLI auto-copy は別 SPEC に分離する。

## 採点

- TASK-0142: 100/S++

## Done Definition

TASK-0146 の検証で AC-01 が pass する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0039-task-0142 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
