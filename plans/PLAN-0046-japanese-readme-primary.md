# PLAN-0046: Japanese README Primary

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0046 |
| SPEC-ID   | SPEC-0046 |
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

- Repository entry docs: `README.md`, `README-en.md`, `README-ja.md`
- npm package file list: `package.json`
- package / structure tests: `tests/cli/package.test.mjs`, `Makefile`
- related docs references: `docs/roadmap.md`, `docs/releases/v0.1.0.md`
- SAGE artifacts for SPEC-0046

## 実装方針

1. `README.md` を日本語本文、`README-en.md` を英語本文にする。
2. `README-ja.md` は互換案内として残し、`README.md` へ誘導する。
3. language links は `README.md` ↔ `README-en.md` を primary にし、旧 `README-ja.md` は alias と明記する。
4. `package.json` と package test を更新して、npm tarball に `README-en.md` も含める。
5. Makefile の README checks を新しい役割に合わせ、`README.md` 日本語、`README-en.md` 英語、`README-ja.md` alias を検証する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0175 | README files の役割を入れ替え、language links を更新する | Implementation | 25m | none | No |
| TASK-0176 | package manifest / package test / validation を更新する | Test | 30m | TASK-0175 | No |
| TASK-0177 | 関連 docs references を更新する | Implementation | 20m | TASK-0175 | Yes |
| TASK-0178 | AC 検証、SAGE status 更新、commit / PR を行う | Review | 25m | TASK-0176, TASK-0177 | No |

## リスク

- README-ja.md を削除して既存リンクが壊れる → alias file として残す
- Makefile checks が古い役割を検証し続ける → README-en.md / README.md / README-ja.md の役割別チェックに更新する
- npm package に英語版が入らない → package.json files と package.test を更新する

## 必要な検証

- [x] unit test: `node --test tests/cli/package.test.mjs`
- [x] integration test: `make validate`
- [x] security scan: secret-like pattern scan
- [x] e2e test: not applicable
- [x] architecture boundary check: File Scope check + `bash scripts/sage-validate.sh`

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0046-japanese-readme-primary.md"
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
