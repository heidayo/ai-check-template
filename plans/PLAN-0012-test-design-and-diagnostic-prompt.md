# PLAN-0012: Test design template and diagnostic repair prompt plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0012 |
| SPEC-ID   | SPEC-0012 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [x] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package-templates/docs/test-design-template.md` | Requirement / AC / Test Matrix をつなぐ copyable template を追加 |
| `package-templates/prompts/diagnostic-repair.md` | `ai:check` 失敗後の repair prompt を追加 |
| `package-templates/prompts/README.md` | prompt catalog と推奨 flow を更新 |
| `package-templates/README.md` | 配布物構造を更新 |
| `README.md` / `README-ja.md` / `docs/roadmap.md` | root-level discoverability を追加 |
| `Makefile` | new template / prompt の structural validation を追加 |
| `package-templates/scripts/**` | 変更なし |

## 実装方針

### 採用案

1. Test design は prompt ではなく copyable Markdown template として `package-templates/docs/` に置く
2. Diagnostic repair は existing prompt style に合わせて `package-templates/prompts/diagnostic-repair.md` に置く
3. README / roadmap は導線追加に限定し、v0.1.0 release 済みとは書かない
4. `make validate` は dependency install せず、file presence / required heading / line count / script grep のみ行う

### 不採用案

- `.claude/rules/**` に repair rule を追加する: Codex-only boundary と File Scope を超える
- `ai-check.sh` に diagnostic repair を組み込む: manual template set の範囲を超え、runtime behavior が変わる
- examples を追加する: SPEC-0011 で example は追加済みであり、本 SPEC は template / prompt に限定する

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0043 | Test design template 作成 | Implementation | 45m | none | Yes |
| TASK-0044 | Diagnostic repair prompt 作成 | Implementation | 45m | none | Yes |
| TASK-0045 | Catalog / root docs 更新 | Implementation | 35m | TASK-0043, TASK-0044 | No |
| TASK-0046 | Makefile validation 追加 | Implementation / Test | 30m | TASK-0043, TASK-0044 | No |
| TASK-0047 | AC verification and scoring closure | Test / Review | 30m | TASK-0043..0046 | No |

## 依存グラフ

```
TASK-0043 ┐
          ├─→ TASK-0045 → TASK-0046 → TASK-0047
TASK-0044 ┘
```

## リスク

- リスク1: template が抽象的で使われない → concrete matrix / examples / verification commands を template 内に置く
- リスク2: diagnostic repair prompt が AC の後付け変更を誘発する → AC immutable section を必須にする
- リスク3: validation が runtime install を始める → `Makefile` は grep / wc に限定する

## 必要な検証

- [x] structural: required files, README links, package catalog links, required headings
- [x] syntax: Markdown only, `make validate`, `git diff --check`
- [x] unit: N/A（plain Markdown templates）
- [x] integration: N/A（runtime integration なし）
- [x] security: secret pattern grep, redacted diagnostic output requirement
- [x] architecture: File Scope check, protected file check
- [x] e2e: N/A（SPEC-0012 scope 外）

## Quality Gate マッピング

SPEC-0012 を継承。

## Error Resolution

SPEC-0012 を継承。

## Knowledge Management

SPEC-0012 を継承。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0012 と TASK-0043..0047 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| TASK chain → Verification | TASK-0043..0046 Done | `rg -n 'ステータス \\| Pending|ステータス \\| In Progress' tasks/TASK-0043-test-design-template.md tasks/TASK-0044-diagnostic-repair-prompt.md tasks/TASK-0045-template-catalog-updates.md tasks/TASK-0046-validation-for-test-design-template.md` が空 |
| SPEC Implemented | AC-01..AC-13 全 pass | `make validate` + SPEC-0012 AC commands + `git diff --check` |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| TASK completion | TASK-0043..0047 Done |
| template completeness | required headings present |
| repair prompt safety | AC immutable + redaction requirements present |
| docs discoverability | README / README-ja / roadmap / catalog links present |
| side effects | File Scope 外変更なし |

## 関連ID

- SPEC: SPEC-0012
- TASK: TASK-0043, TASK-0044, TASK-0045, TASK-0046, TASK-0047
