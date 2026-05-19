# PLAN-0047: Release Readiness Onboarding Sync

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0047 |
| SPEC-ID   | SPEC-0047 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
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
- [x] agent-ops

## 影響範囲

- Public onboarding docs: `README.md`, `README-en.md`, `README-ja.md`
- Public support docs: `docs/cli.md`, `docs/roadmap.md`, `docs/usage-model.md`
- Philosophy docs: `package-templates/docs/philosophy/formal-name-match.md`
- Script docs / entrypoints: `package-templates/scripts/README.md`, `package-templates/scripts/ai-check*.sh`
- CLI lifecycle tests: `tests/cli/*.test.mjs`
- Root validation / package scripts: `package.json`, `Makefile`
- Claude Code operational docs: `CLAUDE.md`, `.claude/rules/ai-check-template.md`, `package-templates/.claude/*`
- SAGE artifacts for SPEC-0047

## 実装方針

1. Public docs の一次情報源を先に整理する。README は最初の dry-run path を短くし、release state / npm version / GitHub Actions foundation の関係を明示する。
2. Philosophy / script docs で、形名参同の限界と `ai-check*.sh` の責任分界を説明する。shell script 自体は必要がなければコメント更新に留める。
3. CLI fixture lifecycle test を強化し、`init -> doctor -> update -> doctor --strict` の導入回帰を検出できるようにする。
4. Claude Code 側文書は public docs が source of truth である前提で、古い Phase 表記を固定表から参照型へ寄せる。
5. 最後に cross-file validation を行い、README/docs/Claude docs/tests の整合を確認する。

### 段階昇格条件

| 移行 | 条件 | コマンド |
|---|---|---|
| Specify -> Plan | SPEC-0047 に scope / out-of-scope / AC / 異常系 / Properties が揃う | `bash scripts/sage-validate.sh` |
| Plan -> Execute | PLAN-0047 と TASK-0179..0183 に File Scope と依存関係が揃い、重複がない | `git diff --check` + scope review |
| TASK-0179 -> parallel tasks | README / public docs の source of truth が確定する | `make validate-structure` |
| TASK-0180/0181/0182 -> TASK-0183 | 各TASKの完了条件が pass し、実行ログが更新される | 各TASKの完了条件コマンド |
| TASK-0183 -> Merge ready | 全AC、`make validate`、SAGE validation、diff check が pass | `make validate` + `bash scripts/sage-validate.sh` + `git diff --check` |

## Error Resolution / Knowledge Management

- 失敗時の責任者は失敗を発見した担当Agentとする。
- 失敗を検出したら、まず該当 TASK の実行ログに RUN-ID / 失敗コマンド / 結果 `Fail` を記録する。
- 既知パターン確認は `sage/anti-patterns.md` を使う。
- 新規失敗は修正前に `sage/failures.md` へ FAIL-XXXX 形式で記録する。
- 同種失敗が3回発生したら、TASK-0183 で `sage/anti-patterns.md` への昇格候補として記録する。
- commit を作る場合は commit-msg hook に従い、TASK-ID を含める。`--no-verify` は使わない。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0179 | README / public docs の onboarding と release state を同期する | Codex Implementation | 45m | none | No |
| TASK-0180 | 形名参同の限界と ai-check entrypoint の責任分界を文書化する | Codex Implementation | 35m | TASK-0179 | Yes |
| TASK-0181 | CLI fixture lifecycle と root self-validation の検証を強化する | Codex Test | 45m | TASK-0179 | Yes |
| TASK-0182 | Claude/SAGE operational docs を現行 public docs に追従させる | Claude Code Implementation | 40m | TASK-0179 | Yes |
| TASK-0183 | SPEC-0047 全体の整合検証と SAGE status 更新を行う | Review | 30m | TASK-0180, TASK-0181, TASK-0182 | No |

## 依存グラフ

```text
TASK-0179
  -> TASK-0180
  -> TASK-0181
  -> TASK-0182

TASK-0180 + TASK-0181 + TASK-0182
  -> TASK-0183
```

## リスク

- リスク1: README と Claude 文書が同じ release state を別表現で二重管理する → 軽減策: Claude 文書は `docs/roadmap.md` / `docs/cli.md` を参照し、固定の Phase 表を減らす
- リスク2: Codex と Claude Code が同じファイルを触る → 軽減策: TASK File Scope を disjoint にし、TASK-0183 で scope check を行う
- リスク3: fixture lifecycle test が `--strict` warnings で不安定になる → 軽減策: support scripts を含む fixture を作るか、`update` 後の期待状態を明示して warning を解消する
- リスク4: README の情報削減で既存の詳細導線が失われる → 軽減策: 削除ではなく詳細 docs への移動とリンク整理にする
- リスク5: `package.json` に `ai:check` alias を足す場合、existing `test` semantics と混同する → 軽減策: 追加前に `make validate` を正規入口として docs 明示するだけで足りるか確認する

## 必要な検証

- [x] unit test: `node --test tests/cli/*.test.mjs`
- [x] integration test: `make validate`
- [x] security scan: secret-like pattern scan through `bash scripts/sage-validate.sh`
- [x] e2e test: CLI fixture lifecycle test (`init -> doctor -> update -> doctor --strict`)
- [x] architecture boundary check: TASK File Scope check + `git diff --check`
- [x] stale wording check: `rg "Phase 1.*未着手|Phase 2.*未着手|Phase 3.*未着手|Draft v0.1" .claude/rules/ai-check-template.md package-templates/.claude`
- [x] package contract check: `node -e "const p=require('./package.json'); if ((p.files||[]).includes('CLAUDE.md')) process.exit(1)"`
- [x] unfinished marker check: `rg "TODO|FIXME" README.md README-en.md docs package-templates/.claude package-templates/docs/philosophy/formal-name-match.md`

## ロールバック

- Public docs の変更で導線が悪化した場合: TASK-0179 の File Scope に含まれる README / docs 変更だけを revert する。
- Philosophy / script docs の変更で誤解が増えた場合: TASK-0180 の File Scope に含まれる template docs / shell comment 変更だけを revert する。
- CLI fixture test が不安定な場合: TASK-0181 の test / validation 変更だけを revert し、runtime CLI source は触らない。
- Claude 文書が public docs と乖離した場合: TASK-0182 の File Scope に含まれる Claude docs 変更だけを revert する。
- いずれも `git reset --hard` は使わず、差分単位で通常 revert する。

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0047-release-readiness-onboarding-sync.md"
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
