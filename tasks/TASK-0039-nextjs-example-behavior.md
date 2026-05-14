# TASK-0039: user behavior, API route, and tests

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0039 |
| SPEC-ID   | SPEC-0011 |
| PLAN-ID   | PLAN-0011 |
| ステータス | Done |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0038 |
| 見積     | 60m |

## Goal

After state の user lookup behavior と unit tests を実装する。

## Scope

- public user contract
- API route
- user detail page
- Vitest unit tests

## Non-goals

- real DB
- auth / RLS
- browser E2E

## File Scope（変更許可範囲）

- 作成: `examples/nextjs-basic/lib/users.ts`
- 作成: `examples/nextjs-basic/app/api/users/[id]/route.ts`
- 作成: `examples/nextjs-basic/app/users/[id]/page.tsx`
- 作成: `examples/nextjs-basic/tests/users.test.ts`
- 変更/削除: なし

## 禁止事項

- public response に `email`, `internalNotes`, `role`, `createdAt` を含めない
- invalid id を silently accept しない
- 実在個人情報を fixture に使わない

## 完了条件

- [x] API route が invalid id で 400 を返す
- [x] API route が unknown user で 404 を返す
- [x] public response が public fields のみを返す
- [x] tests が public fields / 400 / 404 を検証する
- [x] TASK-0039 採点が 100/S++

## Tests

- `grep -q "getPublicUser" examples/nextjs-basic/app/api/users/[id]/route.ts`
- `grep -q "400" examples/nextjs-basic/app/api/users/[id]/route.ts`
- `grep -q "404" examples/nextjs-basic/app/api/users/[id]/route.ts`
- `grep -q "email" examples/nextjs-basic/tests/users.test.ts`

## Done Definition

SPEC-0011 AC-08, AC-09, AC-12。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0011 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 2/3 PASS / TASK score 100/S++ |
