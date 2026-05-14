# SPEC-0028: CLI support script defaults

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0028 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0022, SPEC-0023, SPEC-0027 |
| 権限レベル | platform |

## 背景・目的

SPEC-0027 で `doctor` は `ai:check` / `ai:check:fast` が参照する未定義 package scripts を `script-advice` warning として検出できるようになった。次に、CLI alpha の `init` / `update` が安全な default support scripts を missing のときだけ追加し、導入直後の warning を減らす。

本 SPEC は dependency install を行わない。`typecheck`, `lint`, `test`, `test:unit`, `test:e2e:smoke` などの script entry を conservative defaults として作るだけで、既存 user scripts は overwrite しない。`doctor` は support scripts の exact command drift を issue にせず、missing reference warning のみを継続する。

## 対象ユーザー

- `init` 後に `doctor --strict` をすぐ通したい early adopter
- missing script warning を見て `update --yes` で安全に default scripts を補いたい maintainer
- dependency install なしで v0.2.0 alpha の導入摩擦を減らしたい CLI developer

## スコープ（含む）

- profile-aware support script defaults を CLI resolver に追加する
- support scripts は missing のときだけ `init` / `update` が追加する
- existing support scripts は `--overwrite` 有無に関係なく保持する
- support scripts は `doctor` の exact drift issue 対象にしない
- default scripts は base profile に限定する
- `react-nextjs` は `test:e2e:smoke` default を持つ
- `node-cli`, `react-vanilla`, `expo-rn` は `typecheck`, `lint`, `test`, `test:unit` defaults を持つ
- README / README-ja / `docs/cli.md` / roadmap / CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- dependency install
- package manager install command の実行
- package templates の変更
- support script command の semantic detection / package.json dependency detection
- existing user scripts の overwrite
- `doctor` による support script exact drift issue
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/profile-scripts.mjs`（更新）
- `src/cli/init.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0028-cli-support-script-defaults.md`（新規）
- `plans/PLAN-0028-cli-support-script-defaults.md`（新規）
- `tasks/TASK-0104-support-script-resolver.md`（新規）
- `tasks/TASK-0105-support-script-cli-tests-docs.md`（新規）
- `tasks/TASK-0106-verify-support-script-defaults.md`（新規）

**変更禁止:**
- `src/cli/doctor.mjs`
- `src/cli/profile-diagnostics.mjs`
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
- support scripts を overwrite する
- package templates を変更する
- `doctor` を write path にする
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `init --profile node-cli --yes` は missing `typecheck`, `lint`, `test:unit` を追加し、既存 `test` は保持する
- [FR-02] `init --profile react-nextjs --yes` は missing `typecheck`, `lint`, `test`, `test:unit`, `test:e2e:smoke` を追加する
- [FR-03] `update --yes` は missing support scripts を追加する
- [FR-04] `init` / `update` は existing support script contents を overwrite しない
- [FR-05] `doctor --strict` は support scripts が存在する target で `script-advice` warning を出さない
- [FR-06] `init --dry-run` / `update --dry-run` は support script operations を出力するが書き込まない

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] output changes は additive にする
- [NFR-03] default support scripts は docs に dependency install 不実施とセットで説明する
- [NFR-04] `doctor` read-only invariant を維持する

### セキュリティ要件

- [SEC-01] support script defaults に secret-like literal を含めない
- [SEC-02] CLI code / docs / tests に secret 直書きパターンを含めない
- [SEC-03] `doctor` は target snapshot を変更しない

### 運用要件

- [OPS-01] PR は support script defaults のみを扱う
- [OPS-02] dependency install は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | docs grep, operation output |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | secret grep, doctor snapshot |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: README, README-ja, `docs/cli.md`, roadmap が support script defaults に言及する
- [x] AC-02: `init` は profile-aware support scripts を missing のときだけ追加する
- [x] AC-03: `update` は profile-aware support scripts を missing のときだけ追加する
- [x] AC-04: existing support scripts は `init` / `update` で overwrite されない
- [x] AC-05: support scripts 作成後、`doctor --strict` は `script-advice` warning なしで pass できる
- [x] AC-06: dry-run は support script operations を表示し、target snapshot を変更しない

### 異常系

- [x] AC-07: dependency install / npm publish は実行しない
- [x] AC-08: secret pattern grep が pass する
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: user の custom `lint` script が存在する → keep operation、command は変更しない
- 想定エラー2: dry-run で support scripts が missing → would-merge / would-create のみ、write なし
- 境界ケース1: `test` は fixture 既存 script として保持される
- 境界ケース2: dependency が未インストール → support script entry は作るが install はしない

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | docs / README / roadmap に support script defaults 説明を追加 |
| AC-02 | init support script merge order / missing-only logic を修正 |
| AC-03 | update support script create logic を修正 |
| AC-04 | existing script keep branch を修正 |
| AC-05 | support defaults と missing script diagnostics の整合を修正 |
| AC-06 | dry-run branch で writeJson を呼ばない |
| AC-07 | publish / install command を削除 |
| AC-08 | secret-like literal を削除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| support script false default | `sage/failures.md` | maintainer |
| existing user script overwritten | `sage/failures.md` | maintainer |
| recurring request for dependency install | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで support script default regression を確認する。
2. 記録: maintainer が command, profile, existing scripts, expected operation, actual operation を `sage/failures.md` に記録する。
3. 昇格: dependency install request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `init` / `update` may add missing support package scripts
- Output contract: operations may include support script merge/create/keep reasons
- npm: publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: user script を上書きする → support scripts は missing-only で追加する
- リスク2: generated defaults が project tool choice と合わない → docs に conservative defaults and customize と明記する
- リスク3: dependency install 済みに読める → install は scope 外と明記する

## 実装メモ

- No dependencies. Use Node stdlib only.
- Suggested defaults:
  - `typecheck`: `tsc --noEmit`
  - `lint`: `eslint .`
  - `test`: `vitest run`
  - `test:unit`: `vitest run --dir tests/unit`
  - `test:e2e:smoke`: `playwright test --grep smoke` for `react-nextjs`
- Existing scripts always win.

## Properties

### Invariants

- [INV-01] (Gate 2) support scripts are created only when missing
- [INV-02] (Gate 2) existing support script values are preserved
- [INV-03] (Gate 3) doctor remains read-only
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0022 profile-aware scripts exist
- [PRE-02] (Gate 2) SPEC-0027 missing script diagnostics exist
- [PRE-03] (Gate 2) Target project has `package.json` for init/update

### Post-conditions

- [POST-01] (Gate 2) generated `ai:check` references have matching package script entries after init/update
- [POST-02] (Gate 2) custom support scripts remain unchanged

### Assumptions

- [ASM-01] (Gate 横断) support script entries are useful before dependency install is automated
- [ASM-02] (Gate 横断) exact support command drift should not block doctor in this alpha

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0028 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0028 と TASK-0104..0106 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| init support scripts | node-cli init creates `typecheck`, `lint`, and `test:unit` while preserving `test` |
| update support scripts | update creates missing support scripts without overwriting custom scripts |
| doctor strict | initialized target can pass `doctor --strict` without `script-advice` |
| validation | `make validate` pass |

## 採点

- SPEC-0028: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0028: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- TASK-0104: 100/S++
- TASK-0105: 100/S++
- TASK-0106: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる support script resolver / init-update integration / tests / docs / SAGE artifacts を revert する。`package-templates/**`, dependency install, npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0028
- TASK-ID: TASK-0104, TASK-0105, TASK-0106
