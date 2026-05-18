# TASK-0147: Security script template

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0147 |
| SPEC-ID   | SPEC-0040 |
| PLAN-ID   | PLAN-0040 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 25m |

## 責務

`ai:check:secure` の package script fragment と shell entry point を配布テンプレートに追加する。

## File Scope（変更許可範囲）

- 作成: `package-templates/scripts/ai-check-secure.sh`
- 変更: `package-templates/package.scripts.fragment.json`
- 変更: `package-templates/scripts/README.md`
- 削除: なし

## 禁止事項

- `ai:check` command を変更しない
- Semgrep dependency install を追加しない
- GitHub Actions workflow を変更しない

## 完了条件

- [x] `package-templates/package.scripts.fragment.json` contains `ai:check:secure`
- [x] `package-templates/scripts/ai-check-secure.sh` delegates to `${PM} ai:check:secure`
- [x] `bash -n package-templates/scripts/ai-check-secure.sh` pass

## Tests

- `bash -n package-templates/scripts/ai-check-secure.sh`
- `grep -q '"ai:check:secure"' package-templates/package.scripts.fragment.json`

## 採点

- TASK-0147: 100/S++

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-18-spec-0040-task-0147 |
| 開始     | 2026-05-18 |
| 完了     | 2026-05-18 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
