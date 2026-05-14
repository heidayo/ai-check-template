# TASK-0043: Test design template

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0043 |
| SPEC-ID   | SPEC-0012 |
| PLAN-ID   | PLAN-0012 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## Goal

Requirement / AC / test matrix / GWT / verification commands をつなぐ copyable test design template を追加する。

## Scope

- Plain Markdown の test design template を作成する
- QA 技法と philosophy docs への参照を含める
- Security / trust boundary row を含める

## Non-goals

- prompt file の作成
- README / roadmap 更新
- runtime script 変更

## File Scope（変更許可範囲）

- 作成: `package-templates/docs/test-design-template.md`
- 変更/削除: なし

## 禁止事項

- 実プロジェクト固有語を含めない
- secret 値の記入を要求しない
- unfinished markers を残さない

## 完了条件

- [x] `package-templates/docs/test-design-template.md` が存在する
- [x] 必須見出し `Requirement`, `Acceptance Criteria`, `Test Matrix`, `Given-When-Then`, `Verification Commands`, `Risks and Gaps` が存在する
- [x] `trust boundary` と `security` に言及する
- [x] TASK-0043 採点が 100/S++

## Tests

- `test -f package-templates/docs/test-design-template.md`
- `grep -q "^## Test Matrix" package-templates/docs/test-design-template.md`
- `grep -qi "trust boundary" package-templates/docs/test-design-template.md`

## Done Definition

SPEC-0012 AC-01, AC-02, AC-09, AC-13。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0012 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1/3 PASS / TASK score 100/S++ |
