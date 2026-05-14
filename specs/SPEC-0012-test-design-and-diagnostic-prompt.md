# SPEC-0012: Test design template and diagnostic repair prompt

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0012 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001, SPEC-0003, SPEC-0004, SPEC-0010, SPEC-0011 |
| 権限レベル | platform |

## 背景・目的

v0.1.0 では、AI 実装前の Plan-first prompt、QA 技法別 prompt、CI / `ai:check`、Before / After example が揃った。一方で、利用者が「要件をテスト設計へ落とす」ための copyable template と、`ai:check` や diagnostic output が失敗した後に AI へ修復を依頼する prompt がまだ分離されていない。

本 SPEC では、Requirement → AC → Test Design → AI Implementation → Quality Check → Repair → Re-check → Human Acceptance の loop のうち、Test Design と Repair の接続を配布物として追加する。

## 対象ユーザー

- AI に実装させる前にテスト観点を固定したい開発者
- `ai:check` 失敗ログを AI に渡して安全に修復させたい reviewer
- v0.1.0 の manual template set をコピーして使う外部利用者

## スコープ（含む）

- `package-templates/docs/test-design-template.md` を追加する
- `package-templates/prompts/diagnostic-repair.md` を追加する
- `package-templates/prompts/README.md` に diagnostic repair prompt を追加する
- `package-templates/README.md` に test design template と diagnostic repair prompt を追加する
- `README.md`, `README-ja.md`, `docs/roadmap.md` に SPEC-0012 成果物への導線を追加する
- `Makefile` の structural validation に新規配布物の存在と必須セクション検証を追加する

## スコープ外（明示的に除外）

- `package-templates/scripts/ai-check*.sh` の実行ロジック変更
- `.github/workflows/**` の変更
- npm package 化、CLI scaffolding
- Playwright / Semgrep / React Doctor 等の toolchain 追加
- `CLAUDE.md`, `.claude/**`, `.sage/**`, `sage/**`, `templates/**` の変更
- examples の追加・変更

## File Scope

**書き込み許可:**
- `package-templates/docs/test-design-template.md`（新規）
- `package-templates/prompts/diagnostic-repair.md`（新規）
- `package-templates/prompts/README.md`（更新）
- `package-templates/README.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `Makefile`（更新）
- `specs/SPEC-0012-test-design-and-diagnostic-prompt.md`（新規）
- `plans/PLAN-0012-test-design-and-diagnostic-prompt.md`（新規）
- `tasks/TASK-0043-test-design-template.md`（新規）
- `tasks/TASK-0044-diagnostic-repair-prompt.md`（新規）
- `tasks/TASK-0045-template-catalog-updates.md`（新規）
- `tasks/TASK-0046-validation-for-test-design-template.md`（新規）
- `tasks/TASK-0047-verify-test-design-template.md`（新規）

**変更禁止:**
- `package-templates/scripts/**`
- `.github/workflows/**`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `examples/**`
- `CLAUDE.md`
- `.claude/**`, `.sage/**`, `sage/**`, `templates/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/rules/**` を変更しない。実装エージェントは既存の SAGE lifecycle / File Scope / Forbidden Shortcuts を適用し、配布物としての test design / diagnostic repair の説明は `package-templates/` 内に閉じる。

| ルール | 実装時の遵守事項 |
|---|---|
| SAGE lifecycle | SPEC / PLAN / TASK / 採点後に実装する |
| Codex-only boundary | Claude Code-specific files は変更しない |
| 配布物分離 | `package-templates/` の template と SAGE 内部物を混在させない |
| 汎用ファースト | 特定プロジェクト固有語を含めない |

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- secret / token / API key の直書き
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等の固有語混入
- diagnostic repair prompt で acceptance criteria の後付け変更を許す
- diagnostic output を「AI が自己判断で無視してよい」と書く
- package template に unfinished markers を残す

## 要件

### 機能要件

- [FR-01] test design template は Requirement / AC / Test Matrix / GWT / Verification Commands / Risks を含む
- [FR-02] test design template は static / unit / integration / E2E / security の責務分割を促す
- [FR-03] diagnostic repair prompt は diagnostic output を入力として受け取る
- [FR-04] diagnostic repair prompt は AC を変えずに repair plan → patch → re-check を要求する
- [FR-05] prompts README と package-templates README から新規配布物に到達できる
- [FR-06] root README / README-ja / roadmap から SPEC-0012 成果物に到達できる
- [FR-07] `make validate` が新規配布物の存在と必須セクションを検証する

### 非機能要件

- [NFR-01] 新規 template / prompt は manual copy で使える plain Markdown とする
- [NFR-02] root CI は dependency install なしで pass する
- [NFR-03] test design template は 120-350 行、diagnostic repair prompt は 80-250 行に収める
- [NFR-04] カバレッジ閾値: N/A。代替指標として AC-01..AC-13 と mandatory section grep を coverage gate とする

### セキュリティ要件

- [SEC-01] diagnostic repair prompt は secret 値を貼らずに redacted diagnostic output を使うよう明記する
- [SEC-02] template / prompt に secret 直書きパターンを含めない
- [SEC-03] test design template は security / trust boundary test row を含む
- [SEC-04] prompt は failing output の隠蔽や AC の改変を禁止する

### 運用要件

- [OPS-01] PR #7 では runtime behavior を変更しない
- [OPS-02] PR CI failure は同一ブランチで修正し、`make validate` と GitHub Actions 再実行結果で feedback loop を閉じる
- [OPS-03] 新規 prompt / template の改善要望は Issue template または dogfooding feedback から follow-up SPEC にする

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-04, AC-05, AC-06, AC-12, AC-13 | `test -f`, `grep`, `wc -l` |
| Gate 2: Functional | AC-03, AC-07 | `make validate`, prompt section grep |
| Gate 3: Security | AC-08, AC-09, AC-11 | secret grep, forbidden words grep, AC immutability grep |
| Gate 4: Architecture | AC-10 | File Scope / protected files check |
| Gate 5: Release | N/A | v0.1.0 release は SPEC-0014 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `package-templates/docs/test-design-template.md` と `package-templates/prompts/diagnostic-repair.md` が存在する
- [x] AC-02: test design template が `Requirement`, `Acceptance Criteria`, `Test Matrix`, `Given-When-Then`, `Verification Commands`, `Risks and Gaps` 見出しを含む
- [x] AC-03: diagnostic repair prompt が `Diagnostic Output`, `Repair Plan`, `Patch Rules`, `Re-check Commands`, `Do Not Change Acceptance Criteria` を含む
- [x] AC-04: `package-templates/prompts/README.md` が `diagnostic-repair.md` と実装後 repair flow に言及する
- [x] AC-05: `package-templates/README.md` が `test-design-template.md` と `diagnostic-repair.md` に言及する
- [x] AC-06: root README / README-ja / docs/roadmap が `test-design-template.md` と `diagnostic-repair.md` に言及する

### 機能検証

- [x] AC-07: `make validate` が pass する
- [x] AC-08: diagnostic repair prompt が redacted diagnostic output と secret 非貼付を要求する
- [x] AC-09: test design template が security / trust boundary test row を含む
- [x] AC-10: 変更ファイルが File Scope 内のみで、SAGE protected files と `package-templates/scripts/**` に変更がない

### 異常系

- [x] AC-11: secret 直書きパターンがない（`grep -riE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" package-templates/docs/test-design-template.md package-templates/prompts/diagnostic-repair.md package-templates/prompts/README.md package-templates/README.md README.md README-ja.md docs/roadmap.md Makefile` が空）
- [x] AC-12: 新規 template / prompt に unfinished marker patterns がない
- [x] AC-13: 新規 template / prompt が philosophy docs への相互参照を含む

## 異常系

- 想定エラー1: test design template が単なる checklist になり、AC と test mapping が分離する → AC-02 と AC-09 で Test Matrix / GWT / trust boundary を要求する
- 想定エラー2: diagnostic repair prompt が AC の後付け変更を許す → AC-03 と AC-08 で AC immutable / redacted output を要求する
- 想定エラー3: README から新規配布物へ到達できない → AC-04..AC-06 で導線を検証する
- 境界ケース1: template が長すぎて manual copy しづらい → AC-12 と NFR-03 で行数範囲を検証する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 欠落ファイルを File Scope 内に作成 |
| AC-02 | test design template の必須見出しを追加 |
| AC-03 | diagnostic repair prompt の必須見出しを追加 |
| AC-04 | prompts README の提供物表と推奨 flow を更新 |
| AC-05 | package-templates README の構造表を更新 |
| AC-06 | root README / README-ja / roadmap の導線を追加 |
| AC-07 | `make validate` の失敗箇所を修正 |
| AC-08 | redaction / secret 非貼付の明記を追加 |
| AC-09 | security / trust boundary row を Test Matrix に追加 |
| AC-10 | File Scope 外変更を取り除く |
| AC-11 | secret 直書き表現を削除または redacted placeholder に置換 |
| AC-12 | unfinished markers を削除 |
| AC-13 | philosophy docs への参照を追加 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| diagnostic repair prompt が失敗ログを誤解する | `sage/failures.md` | maintainer |
| template が dogfooding で使いにくい | `docs/phase-1-feedback-template.md` → follow-up SPEC | maintainer |
| 同種の repair prompt 失敗が累積する | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: PR CI、manual `ai:check`、dogfooding feedback のいずれかで template / prompt 起因の失敗を確認する。
2. 記録: maintainer が再現条件、入力 prompt、diagnostic output の redacted excerpt、期待修復、実際の失敗を `sage/failures.md` に記録する。
3. 昇格: 同種の test design gap / repair prompt failure が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `make validate`
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: template が抽象的すぎて利用者の test design に効かない → 軽減策: concrete table / GWT / command sections を必須化
- リスク2: diagnostic repair prompt が failing output を過信する → 軽減策: root cause / evidence / re-check commands を必須化
- リスク3: 配布物 README と実ファイルが乖離する → 軽減策: `make validate` に structural checks を追加

## 実装メモ

- Existing prompt style は日本語本文 + Markdown + `## プロンプト本文` コードブロック
- New prompt file name は `diagnostic-repair.md`
- Test design template は prompt ではなく copyable document template として `package-templates/docs/` に置く
- `make validate` は dependency install を行わず、file presence / grep / line count に留める

## Properties

### Invariants

- [INV-01] (Gate 4) 新規配布物は `package-templates/` 配下にのみ存在する
- [INV-02] (Gate 3) diagnostic repair prompt は AC の後付け変更を禁止する
- [INV-03] (Gate 3) template / prompt は secret 値の貼付を要求しない
- [INV-04] (Gate 4) `package-templates/scripts/**` と SAGE protected files は変更しない

### Pre-conditions

- [PRE-01] (Gate 2) 利用者は自プロジェクトの要件、AC、検証コマンドを template に貼り付ける
- [PRE-02] (Gate 3) diagnostic output は secret を redacted した状態で prompt に渡す

### Post-conditions

- [POST-01] (Gate 2) 利用者は実装前に AC と test matrix を固定できる
- [POST-02] (Gate 2) 利用者は diagnostic output から repair plan / patch / re-check へ進める
- [POST-03] (Gate 1) README / roadmap から新規配布物へ到達できる

### Assumptions

- [ASM-01] (Gate 横断) v0.1.0 は manual copy の template set であり CLI scaffolding は不要
- [ASM-02] (Gate 横断) prompt quality は dogfooding feedback で継続改善する

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0012 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0012 と TASK-0043..0047 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-13 全 pass | `make validate` + AC commands + `git diff --check` |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| template completeness | AC-02 pass |
| repair prompt safety | AC-03 / AC-08 / AC-11 pass |
| docs discoverability | AC-04..AC-06 pass |
| side effects | AC-10 pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる新規 template / prompt と README / Makefile 更新を revert する。runtime scripts と SAGE protected files は変更しないため、既存利用者の `ai:check` 実行動作には影響しない。

## 関連ID

- PLAN-ID: PLAN-0012
- TASK-ID: TASK-0043, TASK-0044, TASK-0045, TASK-0046, TASK-0047
