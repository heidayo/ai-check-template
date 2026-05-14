# SPEC-0027: CLI missing script diagnostics

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0027 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0021, SPEC-0022, SPEC-0023, SPEC-0026 |
| 権限レベル | platform |

## 背景・目的

CLI alpha は profile-aware package scripts を生成できるが、`ai:check` が参照する `typecheck`, `lint`, `test:unit`, `test:e2e:smoke` などの project-specific scripts までは作成しない。これは既存 project の tool choice を壊さないための保守的な設計だが、導入直後に `ai:check` が未定義 script を参照していても `doctor` が advisory として示せない。

本 SPEC は dependency install や script auto-creation を行わず、`doctor` が `ai:check` / `ai:check:fast` 内の package-manager-aware script invocation を解析し、未定義 package script を `script-advice` warning として報告する。通常は advisory、`doctor --strict` では既存 strict behavior により failure になる。

## 対象ユーザー

- CLI alpha 導入後、足りない npm scripts を把握したい early adopter
- `doctor --strict` を release prep / CI の warning gate として使いたい maintainer
- dependency install / deeper migrations の前に read-only diagnostics を強化したい CLI developer

## スコープ（含む）

- `doctor` の profile diagnostics に missing referenced package script warning を追加する
- 対象 script は `ai:check` と `ai:check:fast`
- package-manager-aware invocation は `pnpm <script>`, `yarn <script>`, `npm run <script>`, `bun run <script>` を対象にする
- warning code は `script-advice` とし、既存 `{ code, path, message }` shape を維持する
- duplicate referenced script は warning を 1 件に dedupe する
- `doctor --strict` では既存 strict handling により missing script warning が failure になる
- README / README-ja / `docs/cli.md` / roadmap / CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- dependency install
- missing scripts の自動作成
- `init` / `update` による support script migration
- package templates の変更
- shell script content の変更
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/profile-diagnostics.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0027-cli-missing-script-diagnostics.md`（新規）
- `plans/PLAN-0027-cli-missing-script-diagnostics.md`（新規）
- `tasks/TASK-0101-missing-script-diagnostics.md`（新規）
- `tasks/TASK-0102-missing-script-diagnostics-tests-docs.md`（新規）
- `tasks/TASK-0103-verify-missing-script-diagnostics.md`（新規）

**変更禁止:**
- `src/cli/init.mjs`
- `src/cli/update.mjs`
- `src/cli/doctor.mjs`
- `src/cli/profile-scripts.mjs`
- `src/cli/package-manager.mjs`
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。SAGE ルールは AGENTS.md の File Scope / standard lane / TASK-ID commit hook を継続適用する。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- dependency install を実行する
- missing scripts を自動作成する
- package templates を変更する
- warnings を issues に変換する
- `doctor` の read-only invariant を壊す
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `doctor` は `ai:check` / `ai:check:fast` が参照する未定義 package script を warning として報告する
- [FR-02] warning は `code: "script-advice"`, `path: "package.json"` を持つ
- [FR-03] `pnpm <script>`, `yarn <script>`, `npm run <script>`, `bun run <script>` を解析する
- [FR-04] 同じ missing script は 1 回だけ報告する
- [FR-05] missing script がない target では新 warning を出さない
- [FR-06] `doctor --strict` は existing strict behavior により missing script warning で non-zero になる

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] `doctor` は read-only を維持する
- [NFR-03] output changes は additive にする
- [NFR-04] warning message は missing script 名を示すが command contents や secrets を出力しない

### セキュリティ要件

- [SEC-01] diagnostics は package script contents 全体を出力しない
- [SEC-02] CLI code / docs / tests に secret 直書きパターンを含めない
- [SEC-03] `doctor` は target snapshot を変更しない

### 運用要件

- [OPS-01] PR は missing script diagnostics のみを扱う
- [OPS-02] dependency install / script auto-creation は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | docs grep, warning shape grep |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/doctor.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | doctor snapshot, secret grep |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: README, README-ja, `docs/cli.md`, roadmap が missing script diagnostics に言及する
- [x] AC-02: `doctor --json` は missing referenced package scripts を `script-advice` warnings として出力する
- [x] AC-03: `doctor --strict --json` は `script-advice` warning がある場合に exit 1 になる
- [x] AC-04: missing scripts が定義済みの場合、`script-advice` warning は出ない
- [x] AC-05: `npm run`, `yarn`, `bun run`, `pnpm` invocation が missing script parser の対象になる

### 異常系

- [x] AC-06: duplicate referenced missing script は duplicate warnings にならない
- [x] AC-07: `doctor` は target snapshot を変更しない
- [x] AC-08: secret pattern grep が pass する
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: `ai:check` と `ai:check:fast` が同じ missing script を参照 → warning は 1 件
- 想定エラー2: custom command が package manager invocation ではない → missing script parser は無視
- 境界ケース1: package scripts が空 → existing script drift issues と missing script warnings が併存可能
- 境界ケース2: malformed package.json → existing invalid-json issue のみで diagnostics は実行しない

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | docs / README / roadmap に diagnostics 説明を追加 |
| AC-02 | profile diagnostics parser / warning code を修正 |
| AC-03 | existing strict status handling と warning emission を確認 |
| AC-04 | hasScriptName 判定を修正 |
| AC-05 | invocation regex を package manager 別に修正 |
| AC-06 | Set による dedupe を追加 |
| AC-07 | doctor path から write helper 呼び出しを排除 |
| AC-08 | secret-like literal を削除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| missing script false positive | `sage/failures.md` | maintainer |
| package-manager parser false negative | `sage/failures.md` | maintainer |
| recurring request for auto-created scripts | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで missing script diagnostics regression を確認する。
2. 記録: maintainer が command, package manager, package scripts, expected warning, actual warning を `sage/failures.md` に記録する。
3. 昇格: script auto-creation / dependency install request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `doctor` warning output may include `script-advice`
- Output contract: warnings remain `{ code, path, message }`
- npm: publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: custom command を missing script と誤判定する → package manager invocation 形式だけを解析する
- リスク2: warning が多すぎる → duplicate script names を dedupe する
- リスク3: secrets を含む command contents を漏らす → warning message には script name のみ出す

## 実装メモ

- No dependencies. Use Node stdlib only.
- Parse only `ai:check` and `ai:check:fast`.
- Supported invocation patterns:
  - `pnpm <script>`
  - `yarn <script>`
  - `npm run <script>`
  - `bun run <script>`
- Do not infer dependencies or tool packages in this SPEC.

## Properties

### Invariants

- [INV-01] (Gate 2) missing script warnings are advisory unless strict mode is enabled
- [INV-02] (Gate 2) defined package scripts are not reported as missing
- [INV-03] (Gate 3) doctor is read-only
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0021 profile diagnostics exist
- [PRE-02] (Gate 2) SPEC-0022 profile-aware scripts exist
- [PRE-03] (Gate 2) SPEC-0023 strict warning mode exists
- [PRE-04] (Gate 2) SPEC-0026 package-manager-aware scripts exist

### Post-conditions

- [POST-01] (Gate 2) doctor JSON can show missing script advice
- [POST-02] (Gate 3) target files remain unchanged after doctor

### Assumptions

- [ASM-01] (Gate 横断) dependency install is not required for read-only diagnostics
- [ASM-02] (Gate 横断) script auto-creation requires a separate migration policy SPEC

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0027 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0027 と TASK-0101..0103 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/doctor.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| missing script detection | `doctor --json` emits `script-advice` for missing referenced scripts |
| strict behavior | `doctor --strict --json` exits non-zero when `script-advice` exists |
| parser coverage | pnpm / npm / yarn / bun invocation patterns are covered by tests |
| validation | `make validate` pass |

## 採点

- SPEC-0027: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0027: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- TASK-0101: 100/S++
- TASK-0102: 100/S++
- TASK-0103: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる profile diagnostics / tests / docs / SAGE artifacts を revert する。`package-templates/**`, dependency install, npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0027
- TASK-ID: TASK-0101, TASK-0102, TASK-0103
