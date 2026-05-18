# TASK-0143: AI code understanding worksheet

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0143 |
| SPEC-ID   | SPEC-0039 |
| PLAN-ID   | PLAN-0039 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 20m |

## 責務

AI 生成コードを人間が説明・批評・再実装できるか確認する worksheet を追加する。

## 入力

- SPEC-0039
- PLAN-0039
- docs/usage-model.md の Review gate

## 出力

- `package-templates/worksheet/ai-code-understanding.md`

## File Scope（変更許可範囲）

- 作成: `package-templates/worksheet/ai-code-understanding.md`
- 変更: なし
- 削除: なし

## 禁止事項

- 特定プロダクト固有の項目にしない
- 実行コマンドを mandatory tool に固定しすぎない
- external article の文面を長文転載しない

## 完了条件

- [x] worksheet contains AI Request, Adopted Design, Alternatives Considered, Fragile Areas, Reimplementation Check
- [x] worksheet captures tests, evidence, and follow-up questions
- [x] file is English primary and product-agnostic

## Tests

- `grep -q "AI Request" package-templates/worksheet/ai-code-understanding.md`
- `grep -q "Reimplementation Check" package-templates/worksheet/ai-code-understanding.md`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| worksheet is too generic | Add concrete evidence and explanation fields |
| line count becomes excessive | Move deep prompts to prompt files instead |

## Knowledge Management

Worksheet の運用負荷が高い場合は feedback を `sage/failures.md` に記録し、short-form / long-form 分割を検討する。

## 段階採用

PR template に全てを詰め込まず、深い理解確認は worksheet に逃がす。

## 採点

- TASK-0143: 100/S++

## Done Definition

TASK-0146 の検証で AC-02 が pass する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0039-task-0143 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
