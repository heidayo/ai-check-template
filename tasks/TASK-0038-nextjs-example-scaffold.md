# TASK-0038: Next.js example scaffold

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0038 |
| SPEC-ID   | SPEC-0011 |
| PLAN-ID   | PLAN-0011 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 45m |

## Goal

`examples/nextjs-basic/` を runnable Next.js App Router project として成立させる最小 scaffold を追加する。

## Scope

- package / TypeScript / Next / Vitest config を追加する
- generated files を除外する example-local `.gitignore` を追加する
- base app page を追加する

## Non-goals

- API route behavior
- unit tests
- Before / After docs

## File Scope（変更許可範囲）

- 作成: `examples/nextjs-basic/.gitignore`
- 作成: `examples/nextjs-basic/package.json`
- 作成: `examples/nextjs-basic/tsconfig.json`
- 作成: `examples/nextjs-basic/next.config.mjs`
- 作成: `examples/nextjs-basic/vitest.config.ts`
- 作成: `examples/nextjs-basic/app/page.tsx`
- 変更/削除: なし

## 禁止事項

- root `package.json` を追加しない
- dependency lockfile を生成しない
- external API 依存を追加しない

## 完了条件

- [x] package scripts に `dev`, `build`, `typecheck`, `test`, `ai:check`, `ai:check:fast` がある
- [x] `tsconfig.json` が `"strict": true` を含む
- [x] `app/page.tsx` が example の entry page として存在する
- [x] TASK-0038 採点が 100/S++

## Tests

- `python3 -m json.tool examples/nextjs-basic/package.json >/dev/null`
- `grep -q '"strict": true' examples/nextjs-basic/tsconfig.json`

## Done Definition

SPEC-0011 AC-01, AC-02, AC-05。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0011 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | Gate 1 PASS / TASK score 100/S++ |
