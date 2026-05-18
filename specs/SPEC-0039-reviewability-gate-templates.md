# SPEC-0039: Reviewability gate templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0039 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0038 |
| 権限レベル | product |

## 背景・目的

SPEC-0038 で `ai-check-template` の価値を Local loop / Repair loop / E2E loop / CI gate / Review gate に整理した。ただし Review gate はまだ思想説明に留まっており、導入者が PR 上で「AI 生成コードを人間が理解し、説明し、受け入れられる状態」にするための配布テンプレートが不足している。

本 SPEC では、AI 生成コードの成熟度を生成速度ではなくレビュー品質で測るため、PR テンプレート、理解度ワークシート、設計説明・トレードオフ分析・理解度確認・レビュー訓練プロンプトを `package-templates/` に追加する。

## 対象ユーザー

- AI coding tools を使う開発者
- AI 生成コードをレビューする maintainer / reviewer
- `ai-check-template` を既存プロジェクトに手動導入するチーム

## スコープ（含む）

- `package-templates/.github/PULL_REQUEST_TEMPLATE.md` を追加する
- `package-templates/worksheet/ai-code-understanding.md` を追加する
- `package-templates/prompts/design-explanation.md` を追加する
- `package-templates/prompts/tradeoff-analysis.md` を追加する
- `package-templates/prompts/self-understanding-check.md` を追加する
- `package-templates/prompts/review-training.md` を追加する
- `package-templates/README.md` と `package-templates/prompts/README.md` に新テンプレートの導線を追加する
- README / README-ja / docs/usage-model.md / docs/roadmap.md に Review gate の配布物を明記する
- `Makefile` structural validation に reviewability guard を追加する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点し、検証結果を記録する

## スコープ外（明示的に除外）

- CLI runtime behavior の変更
- `init` / `update` が `.github` や worksheet を自動コピーする挙動の追加
- `package.json`, `src/**`, `bin/**`, `tests/**` の変更
- ルート `.github/PULL_REQUEST_TEMPLATE.md` の変更
- `.github/workflows/**`, `ai-quality/action.yml` の変更
- security split / `ai:check:secure` 追加
- Playwright config / E2E stabilization template 追加
- React Doctor / Expo profile assumption correction
- `CLAUDE.md`, `.claude/**`, `sage/**`, `.sage/**`, `templates/**` の変更
- local-only research memo の commit

## File Scope

**書き込み許可:**
- `package-templates/.github/PULL_REQUEST_TEMPLATE.md`（新規）
- `package-templates/worksheet/ai-code-understanding.md`（新規）
- `package-templates/prompts/design-explanation.md`（新規）
- `package-templates/prompts/tradeoff-analysis.md`（新規）
- `package-templates/prompts/self-understanding-check.md`（新規）
- `package-templates/prompts/review-training.md`（新規）
- `package-templates/prompts/README.md`（更新）
- `package-templates/README.md`（更新）
- `docs/usage-model.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `Makefile`（更新）
- `specs/SPEC-0039-reviewability-gate-templates.md`（新規）
- `plans/PLAN-0039-reviewability-gate-templates.md`（新規）
- `tasks/TASK-0142-reviewability-pr-template.md`（新規）
- `tasks/TASK-0143-reviewability-worksheet.md`（新規）
- `tasks/TASK-0144-reviewability-prompts.md`（新規）
- `tasks/TASK-0145-reviewability-docs-validation.md`（新規）
- `tasks/TASK-0146-verify-reviewability-gate.md`（新規）

**変更禁止:**
- `package.json`
- `src/**`
- `bin/**`
- `tests/**`
- root `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/workflows/**`
- `ai-quality/action.yml`
- `examples/**`
- `CLAUDE.md`, `.claude/**`
- `sage/**`, `.sage/**`, `templates/**`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「ルート PR テンプレートを変更しない」「CLI 自動コピー済みと表現しない」「レビュー可能性を補助するテンプレートに限定する」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしにテンプレート実装へ進む
- File Scope 外の変更
- external article の文面をそのまま長文転載する
- 未実装の CLI 自動コピーを shipped と表現する
- local-only research memo を commit する
- npm publish / Git tag / GitHub Release を行う
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] PR テンプレートは AI-generated code review の確認欄を含む
- [FR-02] PR テンプレートは design / alternatives / risks / tests / commands / human understanding を記録できる
- [FR-03] worksheet は AI request、採用設計、代替案、壊れやすい箇所、追加テスト、AI なし再実装可否を記録できる
- [FR-04] 4 つの新プロンプトは設計説明、トレードオフ分析、理解度確認、レビュー訓練を支援する
- [FR-05] package template README と prompts README は新規配布物へリンクする
- [FR-06] usage model / README / roadmap は Review gate の具体配布物を示す
- [FR-07] `Makefile` は reviewability files と key phrases を検証する

### 非機能要件

- [NFR-01] package template 配布物は英語 primary とする
- [NFR-02] docs は特定プロダクト固有語に依存しない
- [NFR-03] validation は dependency install なしで pass する
- [NFR-04] 新規 prompt は既存 prompt library の構成に揃える

### セキュリティ要件

- [SEC-01] 新規テンプレートに secret / token / private URL を含めない
- [SEC-02] PR テンプレートは security / trust boundary risk の記載を促す
- [SEC-03] local-only research memo を git tracked files に含めない

### 運用要件

- [OPS-01] PR は reviewability template docs に限定する
- [OPS-02] CLI 自動コピーは future track として扱い、必要なら別 SPEC に分離する
- [OPS-03] `make validate` と GitHub Actions `validate` pass 後に merge する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03, AC-04 | file existence / docs grep |
| Gate 2: Functional | AC-05 | `make validate` |
| Gate 3: Security | AC-06 | secret grep / tracked file check |
| Gate 4: Architecture | AC-07 | File Scope / protected file check |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `package-templates/.github/PULL_REQUEST_TEMPLATE.md` exists and contains AI-Generated Code Review, Adopted design, Alternatives considered, Risks and tradeoffs, Tests added or updated
- [x] AC-02: `package-templates/worksheet/ai-code-understanding.md` exists and contains AI Request, Adopted Design, Alternatives Considered, Fragile Areas, Reimplementation Check
- [x] AC-03: four prompt files exist and each includes Purpose, Prompt, Usage, and Review Output sections
- [x] AC-04: `package-templates/README.md`, `package-templates/prompts/README.md`, README / README-ja, `docs/usage-model.md`, and `docs/roadmap.md` link the new reviewability templates
- [x] AC-05: `Makefile` validates reviewability templates and links

### 異常系

- [x] AC-06: changed files contain no secret / token / private URL literal and local-only research memo is not tracked
- [x] AC-07: changed files are File Scope only, with no runtime / root PR template / workflow / action / protected file changes
- [x] AC-08: `node --test tests/cli/*.test.mjs`, `make validate`, `bash scripts/sage-validate.sh`, and `git diff --check` pass

## 異常系

- 想定エラー1: prompt の表現が抽象的で reviewer が何を確認すべきか分からない
- 想定エラー2: package template PR template と root repository PR template を混同する
- 境界ケース1: 導入者が CLI で自動コピーされると誤読する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | PR template に required reviewability fields を追加 |
| AC-02 | worksheet の理解度確認項目を追加 |
| AC-03 | prompt files の required section を追加 |
| AC-04 | docs link と wording を更新 |
| AC-05 | Makefile guard を exact phrases に narrow |
| AC-06 | secret / private URL literal を削除し、tracked files から local memo を除外 |
| AC-07 | out-of-scope diff を取り除く |
| AC-08 | failing validation output に従い File Scope 内で修正 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| Review gate wording causes confusion | `sage/failures.md` | maintainer |
| CLI auto-copy expectation appears repeatedly | future SPEC | maintainer |
| PR template creates checkbox fatigue | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: docs review、PR CI、external user feedback のいずれかで reviewability confusion を確認する。
2. 記録: maintainer が confusing phrase, expected wording, affected template を `sage/failures.md` に記録する。
3. 昇格: 同じ confusion が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- CLI: runtime behavior unchanged
- GitHub Actions: workflow behavior unchanged
- package template surface: manual-copy reviewability templates only
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: 既存 root PR template と混同される → `package-templates/.github/` 配布物であることを docs に明記
- リスク2: Review gate が手作業だけの負担に見える → prompts と worksheet で記入補助を提供
- リスク3: 未実装の CLI auto-copy と誤読される → docs で manual-copy / future track を明記

## 実装メモ（Implementation Agent向け）

- 既存 prompt files は `## プロンプト本文` を使う日本語構成だが、今回の package template prompts は英語 primary で統一する
- external article の文面は参考にし、長文転載は避ける
- root `.github/PULL_REQUEST_TEMPLATE.md` は maintainer 用であり変更しない

## Properties

### Invariants

- [INV-01] (Gate 4) runtime source, CLI behavior, workflows, and root PR template remain unchanged
- [INV-02] (Gate 3) no secret / token / private URL literal is added to tracked files
- [INV-03] (Gate 1) docs do not claim CLI auto-copy for reviewability templates

### Pre-conditions

- [PRE-01] (Gate 1) SPEC-0038 usage model has established Review gate as a package value
- [PRE-02] (Gate 1) package templates can be adopted manually

### Post-conditions

- [POST-01] (Gate 1) users can copy reviewability templates into a project
- [POST-02] (Gate 1) users can ask AI to explain, critique, and test its implementation before human acceptance
- [POST-03] (Gate 4) follow-up CLI auto-copy can be specified separately without ambiguity

### Assumptions

- [ASM-01] (Gate 横断) Reviewability templates are documentation assets, not executable runtime code

## 採点

- SPEC-0039: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）

## 関連ID

- PLAN-ID: PLAN-0039
- TASK-ID: TASK-0142, TASK-0143, TASK-0144, TASK-0145, TASK-0146
