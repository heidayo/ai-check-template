# TASK-0035: reusable workflow examples

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0035 |
| SPEC-ID   | SPEC-0010 |
| PLAN-ID   | PLAN-0010 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 60m |

## Goal

利用者が reusable workflow 方式で `ai:check` を呼べるようにする example を追加する。

## Scope

- direct workflow examples に最小権限を追加する
- reusable workflow example を追加する
- caller workflow example を追加する

## Non-goals

- Marketplace Composite Action
- 本リポの実運用 workflow として reusable workflow を有効化すること
- profile-specific workflow 生成

## File Scope（変更許可範囲）

- 作成: `package-templates/ci-examples/github-actions/ai-quality-reusable.yml`
- 作成: `package-templates/ci-examples/github-actions/ai-quality-call.yml`
- 変更: `package-templates/ci-examples/github-actions/ai-check.yml`
- 変更: `package-templates/ci-examples/github-actions/ai-check-fast.yml`
- 削除: なし

## 禁止事項

- `package-templates/ci-examples/github-actions/ai-check.yml` / `ai-check-fast.yml` の既存 trigger と `pnpm ai:check*` 呼び出しを壊さない
- secret 直書きパターンを入れない
- 特定プロジェクト固有語を入れない

## 完了条件

- [x] reusable workflow に `workflow_call` がある
- [x] reusable workflow に `package-manager`, `node-version`, `check-command` inputs がある
- [x] `pnpm`, `npm`, `yarn`, `bun` の install path がある
- [x] caller example が `uses: ./.github/workflows/ai-quality-reusable.yml` を含む
- [x] direct workflow examples に `permissions: contents: read` がある
- [x] YAML syntax validation が pass

## Tests

- `grep -q "workflow_call" package-templates/ci-examples/github-actions/ai-quality-reusable.yml`
- `ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f) }' package-templates/ci-examples/github-actions/*.yml`

## Done Definition

SPEC-0010 AC-01, AC-04, AC-05, AC-07, AC-08, AC-11, AC-12。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0010 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: pass / functional: pass / security: pass / architecture: pass |
