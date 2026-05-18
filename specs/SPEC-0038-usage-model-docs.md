# SPEC-0038: Usage model documentation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0038 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0037 |
| 権限レベル | product |

## 背景・目的

`ai-check-template` は v0.3.0 までに manual templates、npm CLI、hosted reusable workflow / Composite Action を提供できる状態になった。一方で、導入者視点では「このパッケージを入れると、AI 開発のどの場面に効くのか」がまだ README だけでは整理しきれていない。

本 SPEC では、AI 実装後の検証基盤としての価値を Local loop / Repair loop / E2E loop / CI gate / Review gate の 5 つに分解し、導入者が使いどころを判断できる usage model docs を追加する。

## スコープ（含む）

- `docs/usage-model.md` を追加する
- README / README-ja に usage model への導線と 5 ループの短い説明を追加する
- `docs/roadmap.md` に post-v0.3.0 adoption focus として usage model を追加する
- `Makefile` structural validation に usage model docs の guard を追加する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点し、検証結果を記録する

## スコープ外（明示的に除外）

- package runtime behavior の変更
- `package.json`, `src/**`, `bin/**` の変更
- `package-templates/**` の変更
- GitHub Actions workflow / Composite Action の変更
- security split / `ai:check:secure` 追加
- Playwright config template 追加
- PR template / reviewability worksheet 追加
- React Doctor / Expo profile assumption correction
- local-only research memo の commit
- `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `docs/usage-model.md`（新規）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `Makefile`（更新）
- `specs/SPEC-0038-usage-model-docs.md`（新規）
- `plans/PLAN-0038-usage-model-docs.md`（新規）
- `tasks/TASK-0139-usage-model-doc.md`（新規）
- `tasks/TASK-0140-usage-model-doc-links-validation.md`（新規）
- `tasks/TASK-0141-verify-usage-model-docs.md`（新規）

**変更禁止:**
- `package.json`
- `src/**`
- `bin/**`
- `package-templates/**`
- `.github/workflows/**`
- `ai-quality/action.yml`
- `examples/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「usage model docs に限定する」「未実装の security split / reviewability / Playwright 強化を完了済みと書かない」「local-only research memo を commit しない」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに docs 更新へ進む
- File Scope 外の変更
- 未実装機能を shipped と表現する
- local-only research memo を commit する
- npm publish / Git tag / GitHub Release を行う
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `docs/usage-model.md` は Local loop / Repair loop / E2E loop / CI gate / Review gate を説明する
- [FR-02] docs は `ai-check-template` が AI 実装そのものではなく post-implementation verification stack であることを明記する
- [FR-03] README / README-ja は usage model にリンクし、導入者が何に効くかを把握できる
- [FR-04] roadmap は post-v0.3.0 adoption focus として usage model を示す
- [FR-05] `Makefile` は usage model docs と README links を検証する

### 非機能要件

- [NFR-01] docs は英語 primary、README-ja は日本語併記
- [NFR-02] docs は gakuten 固有の product wording に依存しない
- [NFR-03] validation は dependency install なしで pass する

### セキュリティ要件

- [SEC-01] docs に secret / token / private URL を含めない
- [SEC-02] local-only research memo を git tracked files に含めない

### 運用要件

- [OPS-01] PR は usage model docs に限定する
- [OPS-02] follow-up tracks は docs 内で future / next steps として扱い、完了済みと書かない
- [OPS-03] `make validate` と GitHub Actions `validate` pass 後に merge する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | file existence / docs grep |
| Gate 2: Functional | AC-04 | `make validate` |
| Gate 3: Security | AC-05 | secret grep / tracked file check |
| Gate 4: Architecture | AC-06 | File Scope / protected file check |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `docs/usage-model.md` exists and contains Local loop / Repair loop / E2E loop / CI gate / Review gate
- [x] AC-02: README / README-ja link `docs/usage-model.md`
- [x] AC-03: `docs/roadmap.md` references usage model as post-v0.3.0 adoption focus
- [x] AC-04: `Makefile` validates usage model docs and links

### 異常系

- [x] AC-05: changed docs contain no secret / token / private URL literal and local-only research memo is not tracked
- [x] AC-06: changed files are File Scope only, with no package/runtime/template/workflow/action/protected file changes
- [x] AC-07: `node --test tests/cli/*.test.mjs`, `make validate`, `bash scripts/sage-validate.sh`, and `git diff --check` pass

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | usage model に 5 ループ section を追加 |
| AC-02 | README / README-ja に link を追加 |
| AC-03 | roadmap に adoption focus を追加 |
| AC-04 | Makefile guard を exact phrases に narrow |
| AC-05 | secret / private URL literal を削除し、tracked files から local memo を除外 |
| AC-06 | out-of-scope diff を取り除く |
| AC-07 | failing validation output に従い File Scope 内で修正 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| package value explanation confusion | `sage/failures.md` | maintainer |
| docs overclaim unimplemented follow-up tracks | `sage/anti-patterns.md` 昇格候補 | maintainer |
| local-only memo accidentally tracked | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: docs review、PR CI、external user feedback のいずれかで usage model confusion を確認する。
2. 記録: maintainer が confusing phrase, expected wording, affected doc を `sage/failures.md` に記録する。
3. 昇格: 同じ confusion が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- CLI: runtime behavior unchanged
- GitHub Actions: workflow behavior unchanged
- docs: usage model is explanatory, not a new shipped runtime feature
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: 未実装の future tracks を shipped と誤読される → future / next steps wording に限定
- リスク2: docs が抽象的で導入価値が伝わらない → 5 loops と "what it gives / when to use" table で具体化
- リスク3: local-only memo が混入する → `git status` / tracked file check で検証

## Properties

### Invariants

- [INV-01] (Gate 4) runtime source and package templates remain unchanged
- [INV-02] (Gate 3) local-only research memo remains untracked
- [INV-03] (Gate 1) usage model does not claim security split / reviewability / Playwright enhancement is already shipped

### Pre-conditions

- [PRE-01] (Gate 1) v0.3.0 release exists
- [PRE-02] (Gate 1) local research memo is available outside tracked files

### Post-conditions

- [POST-01] (Gate 1) users can identify where the package helps: Local / Repair / E2E / CI / Review
- [POST-02] (Gate 1) follow-up SPECs have a stable product narrative to build on

## 採点

- SPEC-0038: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
