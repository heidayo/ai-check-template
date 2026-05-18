# TASK-0158: Playwright Docs and CI Guidance

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0158 |
| SPEC-ID   | SPEC-0042 |
| PLAN-ID   | PLAN-0042 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0156, TASK-0157 |
| 見積     | 30m |

## 責務

Playwright templates と E2E prompt への導線を profile / CI / usage docs に追加する。

## 入力

- TASK-0156 outputs
- TASK-0157 outputs
- 既存 CI examples / usage model / React Next.js profile

## 出力

- `package-templates/ci-examples/github-actions/ai-check.yml`
- `package-templates/ci-examples/README.md`
- `package-templates/profiles/react-nextjs/README.md`
- `docs/usage-model.md`

## File Scope（変更許可範囲）

- 変更: `package-templates/ci-examples/github-actions/ai-check.yml`
- 変更: `package-templates/ci-examples/README.md`
- 変更: `package-templates/profiles/react-nextjs/README.md`
- 変更: `docs/usage-model.md`
- 削除: なし

## 禁止事項

- CI example を Playwright 未導入プロジェクトで必ず失敗する構成にしない
- hosted reusable workflow contract を変更しない
- secret を含む trace upload を無条件推奨しない

## 完了条件

- [x] CI example に Playwright artifact guidance がある
- [x] React Next.js profile に templates / prompt / artifact guidance への導線がある
- [x] usage model の E2E loop が Playwright stabilization templates に接続される

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0042-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | RUN-20260518-0042-0158 |
| 開始     | 2026-05-18 00:00 |
| 完了     | 2026-05-18 00:00 |
| 結果     | Pass |
| Gate結果  | structural: Pass / functional: Pass / security: Pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0158-playwright-docs-ci-guidance.md"
  target_type: TASK
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
