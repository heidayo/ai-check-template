# TASK-0188: Security Gate Expansion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0188 |
| SPEC-ID   | SPEC-0051 |
| PLAN-ID   | PLAN-0051 |
| ステータス | Done |
| 担当Agent | Security Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0187 |
| 見積     | 2h |

## 責務

`ai:check:secure` を secret scan / dependency audit / supply-chain / SAST の4 step に拡張する。

## 入力

SPEC-0051、PLAN-0051、既存 security split implementation。

## 出力

profile scripts、manual fragment、docs、tests の更新。

## File Scope（変更許可範囲）

- 変更: `src/cli/profile-scripts.mjs`
- 変更: `src/cli/profile-diagnostics.mjs`
- 変更: `src/cli/init.mjs`
- 変更: `src/cli/update.mjs`
- 変更: `src/cli/dependency-installer.mjs`
- 変更: `tests/cli/init.test.mjs`
- 変更: `tests/cli/update.test.mjs`
- 変更: `tests/cli/package.test.mjs`
- 変更: `package-templates/package.scripts.fragment.json`
- 変更: `package-templates/scripts/README.md`
- 変更: `package-templates/scripts/ai-check-secure.sh`
- 変更: `package-templates/profiles/README.md`
- 変更: `package-templates/profiles/react-nextjs/README.md`
- 変更: `package-templates/profiles/react-vanilla/README.md`
- 変更: `package-templates/profiles/expo-rn/README.md`
- 変更: `package-templates/profiles/node-cli/README.md`
- 変更: `package-templates/profiles/supabase-rls/README.md`
- 変更: `package-templates/README.md`
- 変更: `docs/cli.md`
- 変更: `docs/usage-model.md`
- 変更: `README.md`
- 変更: `README-en.md`
- 変更: `Makefile`
- 作成: `specs/SPEC-0051-security-gate-expansion.md`
- 作成: `plans/PLAN-0051-security-gate-expansion.md`
- 作成: `tasks/TASK-0188-security-gate-expansion.md`
- 削除: なし

## 禁止事項

- `ai:check` に security scripts を混ぜない
- scanner install を自動実行しない
- 既存 user support scripts を update で上書きしない

## 完了条件

- [x] `npm test` が pass
- [x] `make validate` が pass
- [x] `rg -n 'security:secrets|security:deps|security:supply-chain|security:sast' src/cli/profile-scripts.mjs package-templates/package.scripts.fragment.json` が hit

## Done Definition（ラウンド単位）

本 TASK の完了条件と SPEC-0051 AC を Done Definition とする。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-task-0188 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: PASS / functional: PASS / security: PASS / architecture: PASS |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0188-security-gate-expansion.md"
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
