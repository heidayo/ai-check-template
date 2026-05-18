# PLAN-0045: Reviewability CLI Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0045 |
| SPEC-ID   | SPEC-0045 |
| ステータス | Completed |
| 作成日    | 2026-05-18 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] controller
- [x] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [x] test
- [x] docs
- [x] package-template

## 影響範囲

- CLI option parsing and help output: `src/cli/index.mjs`, `src/cli/init.mjs`, `src/cli/update.mjs`, `src/cli/doctor.mjs`
- Install state persistence and default resolution: `src/cli/install-state.mjs`
- CLI regression tests: `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`
- User docs and validation: `README.md`, `README-ja.md`, `docs/cli.md`, `docs/usage-model.md`, `package-templates/README.md`, `Makefile`
- SAGE artifacts for SPEC-0045

## 実装方針

1. `reviewTemplates` を install state に boolean として追加し、missing field は `false` に normalize する。
2. `init` は明示 `--review-templates` のときだけ reviewability files をコピーし、既存 file は default skip / `--overwrite` replacement とする。
3. `update` / `doctor` は `--claude-hooks` と同じ precedence で、explicit flag > install state > default false を採用する。
4. `doctor` は `checkTemplateFile` で source template と target file を比較し、read-only を維持する。
5. CLI tests は copy / skip / install state default / drift / old install state compatibility を直接検証する。
6. Docs は manual-copy fallback と CLI option の両方を説明し、Review gate が optional であることを明示する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0170 | install state と top-level CLI help に reviewTemplates option を追加する | Implementation | 35m | none | Yes |
| TASK-0171 | init / update / doctor の copy・repair・diagnostic behavior を実装する | Implementation | 45m | TASK-0170 | No |
| TASK-0172 | CLI regression tests を追加・更新する | Test | 45m | TASK-0171 | No |
| TASK-0173 | docs / validation を更新する | Implementation | 35m | TASK-0171 | Yes |
| TASK-0174 | AC 検証、SAGE status 更新、commit / PR を行う | Review | 30m | TASK-0172, TASK-0173 | No |

## リスク

- install state 互換性が崩れる → missing `reviewTemplates` を default false にし、old state test を更新する
- custom PR template を上書きする → `copyTextFileSafe` / `--overwrite` の既存 semantics を再利用する
- option が docs / help / tests のどこかに漏れる → Makefile grep と CLI help tests で presence を固定する
- reviewability templates が必須化されたように見える → docs で optional Review gate として説明する

## 必要な検証

- [x] unit test: `node --test tests/cli/*.test.mjs`
- [x] integration test: `make validate`
- [x] security scan: secret-like pattern scan
- [x] e2e test: not applicable
- [x] architecture boundary check: File Scope check + `bash scripts/sage-validate.sh`

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0045-reviewability-cli-templates.md"
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
