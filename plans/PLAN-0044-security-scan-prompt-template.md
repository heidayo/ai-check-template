# PLAN-0044: Security Scan Prompt Template

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0044 |
| SPEC-ID   | SPEC-0044 |
| ステータス | Completed |
| 作成日    | 2026-05-18 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [x] test
- [x] docs
- [x] package-template

## 影響範囲

- `package-templates/prompts/security-scan.md`
- `package-templates/prompts/README.md`
- `docs/usage-model.md`
- `Makefile`
- `tests/cli/package.test.mjs`
- SAGE artifacts

## 実装方針

1. `diagnostic-repair.md` と同じ使い勝手で、security finding 専用 prompt を追加する。
2. Semgrep / CodeQL / dependency audit の output を evidence として扱い、AI 推測だけで severity を変えない rule を入れる。
3. suppression は reason / owner / expiration 必須にする。
4. Makefile と pack dry-run test で presence / inclusion を検証する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0166 | security-scan prompt を追加する | Implementation | 30m | none | Yes |
| TASK-0167 | prompt catalog / usage model を更新する | Implementation | 20m | TASK-0166 | No |
| TASK-0168 | validation / pack test を追加し AC 検証する | Test | 25m | TASK-0167 | No |
| TASK-0169 | SAGE status 更新・commit・PR を行う | Review | 25m | TASK-0168 | No |

## リスク

- security prompt が一般論に流れる → output format を evidence-first に固定する
- secret を貼る運用が残る → redaction rule を冒頭に置く
- Semgrep 以外に閉じる → CodeQL / dependency audit 欄も用意する

## 必要な検証

- [x] unit test: `node --test tests/cli/*.test.mjs`
- [x] integration test: `make validate`
- [x] security scan: secret-like pattern scan
- [x] e2e test: not applicable
- [x] architecture boundary check: File Scope check + `bash scripts/sage-validate.sh`

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0044-security-scan-prompt-template.md"
  target_type: PLAN
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
