# SPEC-0030: CLI profile document migrations

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0030 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0012, SPEC-0015, SPEC-0019, SPEC-0020 |
| 権限レベル | platform |

## 背景・目的

v0.2.0 alpha の CLI は scripts / CI / Claude hooks / package scripts を導入できるようになったが、AI 駆動開発で重要な test design template、思想 docs、選択 profile README はまだ手動で参照・コピーする必要がある。次に、`init` / `update` が target project 内へ profile-aware docs を安全に配置し、手動 copy と CLI 導入の差を縮める。

本 SPEC は documentation migration の最小スライスである。`package-templates/**` の内容は変更せず、target の既存 docs は default で上書きしない。copied profile README の既存相対リンクを壊さないため、target 配置は `docs/ai-check-template/` 配下に package-template-like structure を保持する。

## 対象ユーザー

- `init` 後に test design / profile guidance を target repo 内で参照したい early adopter
- selected profile に対応する README だけを target に置きたい maintainer
- docs migration を package scripts / CI migration と同じ CLI operation として検証したい CLI developer

## スコープ（含む）

- `src/cli/profile-docs.mjs` を追加し、profile-aware doc file plan を返す
- `init` は common docs と selected profile docs を target に copy する
- `update` は missing profile docs を create し、existing docs は preserve する
- target 配置は `docs/ai-check-template/` 配下で相対リンクが保たれる形にする
- base profile README と addon profile README を selected profile から決定する
- common docs は test design template / philosophy docs / diagnostic repair prompt / profile index を含める
- `package.test.mjs` の package smoke に new runtime module を追加する
- README / README-ja / `docs/cli.md` / roadmap / CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- `package-templates/**` の内容変更
- copied Markdown のリンク変換・本文変換
- `doctor` による profile docs diagnostics
- inactive profile docs cleanup
- arbitrary docs directory cleanup
- external docs hosting
- npm actual publish / registry smoke
- dependency install
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/profile-docs.mjs`（新規）
- `src/cli/init.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0030-cli-profile-doc-migrations.md`（新規）
- `plans/PLAN-0030-cli-profile-doc-migrations.md`（新規）
- `tasks/TASK-0111-profile-docs-resolver.md`（新規）
- `tasks/TASK-0112-profile-docs-cli-integration.md`（新規）
- `tasks/TASK-0113-profile-docs-tests-docs.md`（新規）
- `tasks/TASK-0114-verify-profile-doc-migrations.md`（新規）

**変更禁止:**
- `src/cli/doctor.mjs`
- `src/cli/profile-diagnostics.mjs`
- `src/cli/profile-scripts.mjs`
- `src/cli/dependency-installer.mjs`
- `src/cli/package-manager.mjs`
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「target docs は `docs/ai-check-template/` 配下のみ」「`package-templates/**` は変更しない」「existing target docs は update でも上書きしない」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `package-templates/**` を変更する
- copied Markdown の ad hoc link rewrite を行う
- existing target docs を update で overwrite する
- `doctor` に docs diagnostics を追加する
- npm publish / real dependency install を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `init --profile react-nextjs+supabase-rls --yes` は common docs、`react-nextjs` profile README、`supabase-rls` profile README を copy する
- [FR-02] `init --profile node-cli --yes` は `node-cli` profile README を copy し、unselected profile README は copy しない
- [FR-03] `init --dry-run` は profile doc operations を表示し、target docs を作成しない
- [FR-04] `update --profile <name> --yes` は missing profile docs を create する
- [FR-05] `update` は existing docs を overwrite せず `keep` operation にする
- [FR-06] copied profile README の relative links が成立する target layout を使う

### 非機能要件

- [NFR-01] CLI runtime dependencies は追加しない
- [NFR-02] docs migration は additive にする
- [NFR-03] file list は deterministic order にする
- [NFR-04] docs operation output は init / update の既存形式に合わせる

### セキュリティ要件

- [SEC-01] copy source は fixed allowlist と selected profile names からのみ生成する
- [SEC-02] target path は `docs/ai-check-template/` 配下のみ
- [SEC-03] docs migration は secrets / env / absolute path を生成しない
- [SEC-04] invalid profile は existing parser により target writes 前に reject される

### 運用要件

- [OPS-01] PR は profile docs migration のみに限定する
- [OPS-02] docs diagnostics / cleanup は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | file existence / dry-run snapshot |
| Gate 2: Functional | AC-04, AC-05, AC-06 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | secret grep / path allowlist check |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `init --profile react-nextjs+supabase-rls --yes` creates common docs plus selected base/addon profile docs under `docs/ai-check-template/`
- [x] AC-02: `init --profile node-cli --yes` creates `profiles/node-cli/README.md` and does not create `profiles/react-nextjs/README.md`
- [x] AC-03: `init --dry-run` reports profile doc operations and leaves target docs absent
- [x] AC-04: `update --profile node-cli --yes --json` creates missing profile docs and emits `create` operations
- [x] AC-05: `update` preserves existing target docs and emits `keep` instead of overwriting
- [x] AC-06: package smoke includes `src/cli/profile-docs.mjs`

### 異常系

- [x] AC-07: invalid profile remains rejected before profile docs are written
- [x] AC-08: secret grep passes and docs migration does not add secret-like literals
- [x] AC-09: changed files are File Scope only, with no `package-templates/**`, protected file, npm publish, or real dependency install changes

## 異常系

- 想定エラー1: target docs already exist → `keep` / `skip` operation、content unchanged
- 想定エラー2: invalid profile → existing parser rejects before any target writes
- 境界ケース1: addon profile included → base and addon README are copied
- 境界ケース2: dry-run → would-copy / would-create only、writeなし

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | profile doc resolver の common/base/addon mapping を修正 |
| AC-02 | selected-only profile mapping を修正 |
| AC-03 | dry-run branch が write しないよう copy path を修正 |
| AC-04 | update create-missing path を修正 |
| AC-05 | update existing-file branch を keep に戻す |
| AC-06 | package smoke requiredFiles を更新 |
| AC-07 | parser order / invalid profile no-write test を修正 |
| AC-08 | secret-like literal を削除 |
| AC-09 | out-of-scope diff を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| profile doc false mapping | `sage/failures.md` | maintainer |
| target docs overwrite regression | `sage/failures.md` | maintainer |
| repeated request for docs diagnostics | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで docs mapping / overwrite regression を確認する。
2. 記録: maintainer が command, profile, expected files, actual files, existing target content を `sage/failures.md` に記録する。
3. 昇格: docs diagnostics / cleanup request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `init` / `update` copy or create profile docs under `docs/ai-check-template/`
- Output contract: operations may include profile doc copy/create/keep/skip reasons
- npm: actual publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: target docs overwrite → update は create-missing only、init は default skip
- リスク2: copied links break → package-template-like structure を target 配下に保持
- リスク3: scope creep into diagnostics → doctor changes は scope 外に固定
- リスク4: package payload missing module → package smoke required file を追加

## 実装メモ

- No runtime dependencies. Use Node stdlib and existing `copyFileSafe` / `fromTemplates` helpers.
- Suggested target root: `docs/ai-check-template/`
- Common files:
  - `docs/test-design-template.md` → `docs/ai-check-template/docs/test-design-template.md`
  - `docs/philosophy/*.md` → `docs/ai-check-template/docs/philosophy/*.md`
  - `prompts/diagnostic-repair.md` → `docs/ai-check-template/prompts/diagnostic-repair.md`
  - `profiles/README.md` → `docs/ai-check-template/profiles/README.md`
- Selected profile files:
  - `profiles/<base>/README.md` → `docs/ai-check-template/profiles/<base>/README.md`
  - `profiles/<addon>/README.md` → `docs/ai-check-template/profiles/<addon>/README.md`

## Properties

### Invariants

- [INV-01] (Gate 2) update never overwrites existing target profile docs
- [INV-02] (Gate 2) unselected base profile README is not copied by init
- [INV-03] (Gate 3) source paths come from fixed template allowlist and parsed profile names
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) target project has `package.json`
- [PRE-02] (Gate 2) selected profile parses successfully
- [PRE-03] (Gate 2) package templates file layout from v0.1.0 exists

### Post-conditions

- [POST-01] (Gate 2) selected profile docs exist after init/update write path
- [POST-02] (Gate 2) existing docs content remains unchanged after update
- [POST-03] (Gate 3) all created docs are under `docs/ai-check-template/`

### Assumptions

- [ASM-01] (Gate 横断) copied Markdown relative links remain valid when package-template-like structure is preserved
- [ASM-02] (Gate 横断) doctor docs diagnostics can be added later without changing this copy contract

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0030 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0030 と TASK-0111..0114 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| profile docs copied | selected base/addon docs exist under `docs/ai-check-template/profiles/` |
| unselected docs avoided | node-cli init does not create react-nextjs profile doc |
| overwrite safety | update keeps existing target docs unchanged |
| validation | `make validate` and `bash scripts/sage-validate.sh` pass |

## 採点

- SPEC-0030: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0030: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- TASK-0111: 100/S++
- TASK-0112: 100/S++
- TASK-0113: 100/S++
- TASK-0114: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる profile docs resolver / init-update integration / tests / docs / SAGE artifacts を revert する。`package-templates/**`, `doctor`, actual npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0030
- TASK-ID: TASK-0111, TASK-0112, TASK-0113, TASK-0114
