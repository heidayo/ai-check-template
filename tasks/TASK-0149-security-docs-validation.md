# TASK-0149: Security docs and validation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0149 |
| SPEC-ID   | SPEC-0040 |
| PLAN-ID   | PLAN-0040 |
| ステータス | Done |
| 担当Agent | Docs |
| 並列可否  | No |
| 依存TASK  | TASK-0147, TASK-0148 |
| 見積     | 35m |

## 責務

`ai:check:secure` の使い方を package docs、profile docs、CLI docs、README、usage model、roadmap、Makefile validation に接続する。

## File Scope（変更許可範囲）

- 変更: `package-templates/README.md`
- 変更: `package-templates/profiles/README.md`
- 変更: `package-templates/profiles/react-nextjs/README.md`
- 変更: `package-templates/profiles/react-vanilla/README.md`
- 変更: `package-templates/profiles/expo-rn/README.md`
- 変更: `package-templates/profiles/node-cli/README.md`
- 変更: `package-templates/profiles/supabase-rls/README.md`
- 変更: `docs/cli.md`
- 変更: `docs/usage-model.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 変更: `Makefile`
- 削除: なし

## 禁止事項

- `ai:check:secure` が full security assurance であると表現しない
- Semgrep install が CLI に含まれると表現しない
- React Doctor / Expo assumption correction を混ぜない

## 完了条件

- [x] docs mention `ai:check:secure`
- [x] docs mention `semgrep scan --config auto`
- [x] docs explain `ai:check` and `ai:check:secure` separation
- [x] `make validate-structure` pass

## Tests

- `make validate-structure`
- docs grep for `ai:check:secure` and `semgrep scan --config auto`

## 採点

- TASK-0149: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0040-task-0149 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
