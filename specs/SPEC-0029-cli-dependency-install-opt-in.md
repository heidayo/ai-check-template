# SPEC-0029: CLI dependency install opt-in

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0029 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0026, SPEC-0027, SPEC-0028 |
| 権限レベル | platform |

## 背景・目的

SPEC-0028 で `init` / `update` は missing support scripts を作れるようになったが、`typescript`, `eslint`, `vitest`, `knip`, `@playwright/test` などの npm dev dependencies はまだ利用者が手動で入れる必要がある。次に、明示 opt-in の `--install-deps` を追加し、CLI alpha が生成した package scripts を実行するための最小 dev dependencies を安全に導入できるようにする。

本 SPEC は actual npm publish ではなく、target project 内の dependency install を扱う。dry-run は install command を表示するだけで、実行時だけ package manager binary を preflight し、既存 dependency declarations は重複追加しない。

## 対象ユーザー

- `init` 後に support script defaults の依存もまとめて導入したい early adopter
- `update --install-deps --dry-run` で導入予定コマンドを確認したい maintainer
- fake package manager で install path を回帰テストしたい CLI developer

## スコープ（含む）

- `init` / `update` に `--install-deps` を追加する
- `--install-deps --dry-run` は package manager install command を表示し、target に書き込まない
- `--install-deps --yes` は package manager binary を preflight してから install command を実行する
- dependency resolver は selected profile から npm dev dependencies を返す
- dependency resolver は `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies` に既存の package を重複追加しない
- `pnpm`, `npm`, `yarn`, `bun` の dev dependency install command を生成する
- tests は fake package manager binary で実行 command を検証し、real dependency install は行わない
- README / README-ja / `docs/cli.md` / roadmap / package smoke test を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- actual npm publish / registry publish
- `npx ai-check-template init` の registry 経由 smoke
- production dependencies の install
- lockfile content の semantic verification
- Supabase CLI / Maestro / React Doctor など npm dev dependency 以外の external toolchain install
- package templates の変更
- `doctor` の dependency presence check
- dependency version pinning / package manager-specific catalog support
- interactive prompt
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/dependency-installer.mjs`（新規）
- `src/cli/init.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `src/cli/index.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0029-cli-dependency-install-opt-in.md`（新規）
- `plans/PLAN-0029-cli-dependency-install-opt-in.md`（新規）
- `tasks/TASK-0107-dependency-installer-core.md`（新規）
- `tasks/TASK-0108-dependency-installer-cli-integration.md`（新規）
- `tasks/TASK-0109-dependency-installer-tests-docs.md`（新規）
- `tasks/TASK-0110-verify-dependency-install-opt-in.md`（新規）

**変更禁止:**
- `src/cli/doctor.mjs`
- `src/cli/profile-diagnostics.mjs`
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

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook / no dangerous command の既存ルールを守る。追加で守る具体ルールは「`--install-deps` がない限り dependency install command を実行しない」「tests では fake package manager binary のみを使い real dependency install を行わない」「package templates と doctor は変更しない」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--install-deps` なしで dependency install を実行する
- tests で real package manager install を実行する
- package templates を変更する
- `doctor` に dependency install / dependency presence check を追加する
- actual npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `init --install-deps --dry-run` は selected profile と package manager に対応する install command を表示し、target files を変更しない
- [FR-02] `init --install-deps --yes` は preflight 後に missing dev dependencies の install command を実行する
- [FR-03] `update --install-deps --dry-run` / `--yes` は install state または explicit flags から effective profile / package manager を使う
- [FR-04] dependency resolver は already declared packages を missing set から除外する
- [FR-05] supported package managers は `pnpm add -D`, `npm install --save-dev`, `yarn add --dev`, `bun add --dev` を生成する
- [FR-06] install 対象は npm dev dependencies に限定し、external CLIs は docs で明示的に除外する

### 非機能要件

- [NFR-01] CLI runtime dependencies は追加しない
- [NFR-02] `--install-deps` がない既存 init/update behavior は変えない
- [NFR-03] install command は deterministic package order にする
- [NFR-04] tests は fake binary と temp fixture のみで完結する

### セキュリティ要件

- [SEC-01] install package list は固定 allowlist から生成し、target package.json の任意文字列を command arguments に混ぜない
- [SEC-02] child process は `shell: false` で実行し、package manager command と args を分離する
- [SEC-03] docs / code / tests に secret-like literal を含めない
- [SEC-04] failed preflight は target writes before install を発生させない

### 運用要件

- [OPS-01] PR は dependency install opt-in のみに限定する
- [OPS-02] GitHub Actions では fake install test のみを実行し、real target dependency install は行わない
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | help/docs grep, dry-run snapshot |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/*.test.mjs` with fake binary |
| Gate 3: Security | AC-07, AC-08, AC-09 | failed preflight snapshot, secret grep, shell-free child process review |
| Gate 4: Architecture | AC-10 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `README.md`, `README-ja.md`, `docs/cli.md`, `docs/roadmap.md`, and CLI help mention `--install-deps`
- [x] AC-02: `init --install-deps --dry-run` reports `would-install` and writes no target file
- [x] AC-03: `init --install-deps --yes` invokes a fake package manager with the expected missing dev dependency args
- [x] AC-04: `update --install-deps --yes --json` invokes a fake package manager and emits an `install` operation
- [x] AC-05: declared packages in dependency sections are skipped from install args
- [x] AC-06: package smoke test includes `src/cli/dependency-installer.mjs` in packed runtime files

### 異常系

- [x] AC-07: missing package manager binary with `--install-deps --yes` exits nonzero before package scripts / files are written
- [x] AC-08: `--install-deps` without `--yes` and without `--dry-run` is rejected before writes
- [x] AC-09: `--install-deps --dry-run` does not require package manager binary and creates no lockfile
- [x] AC-10: secret grep, File Scope check, protected file check, and no real npm publish / real dependency install pass

## 異常系

- 想定エラー1: package manager binary が PATH にない → preflight error、target snapshot unchanged
- 想定エラー2: `--install-deps` が `--yes` なしで指定される → existing write guard が拒否し、target snapshot unchanged
- 境界ケース1: all dev dependencies declared → install command は実行せず `keep` operation
- 境界ケース2: dry-run on machine without package manager → command preview only、preflight なし

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | help text / README / CLI docs / roadmap の `--install-deps` 記述を更新 |
| AC-02 | dry-run branch が install runner を呼ばず operation だけ出すよう修正 |
| AC-03 | init integration の preflight / command args / fake binary PATH handling を修正 |
| AC-04 | update integration の JSON operation / effective options handling を修正 |
| AC-05 | package.json dependency section scan を修正 |
| AC-06 | package smoke requiredFiles を更新 |
| AC-07 | preflight を target writes より前に移動 |
| AC-08 | existing `--yes` guard の順序を維持 |
| AC-09 | dry-run で command availability check を行わない |
| AC-10 | out-of-scope diff / secret-like literal / real install command を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| dependency false install args | `sage/failures.md` | maintainer |
| package manager command false positive | `sage/failures.md` | maintainer |
| request for external toolchain install | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで install args / preflight / dry-run regression を確認する。
2. 記録: maintainer が command, package manager, profile, existing dependency sections, expected args, actual args を `sage/failures.md` に記録する。
3. 昇格: external CLI install request が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `init` / `update` accept `--install-deps`
- Output contract: operations may include `would-install`, `install`, or `keep` for dev dependency installation
- npm: actual publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: unintended dependency install → `--install-deps` opt-in only, dry-run available, tests use fake binary
- リスク2: command injection → fixed allowlist packages and `shell: false`
- リスク3: install failure after template writes → package manager binary preflight before writes; actual install failure remains explicit user opt-in
- リスク4: scope creep into external toolchains → Supabase CLI / Maestro / React Doctor install は scope 外として docs に明記

## 実装メモ

- No runtime dependencies. Use `node:child_process`, `node:fs/promises`, and existing CLI utilities.
- Suggested dev dependency allowlist:
  - common: `typescript`, `eslint`, `vitest`, `knip`
  - `react-nextjs`: common plus `@playwright/test`
  - `react-vanilla`, `node-cli`, `expo-rn`: common
  - `supabase-rls`: no extra npm package beyond common `vitest`
- Existing dependency sections to inspect: `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`.

## Properties

### Invariants

- [INV-01] (Gate 2) dependency install is never executed unless `--install-deps` is present
- [INV-02] (Gate 2) dry-run never writes target files or runs package manager commands
- [INV-03] (Gate 3) install command args are generated from a fixed allowlist
- [INV-04] (Gate 4) `package-templates/**` and `doctor` remain unchanged

### Pre-conditions

- [PRE-01] (Gate 2) target project has `package.json`
- [PRE-02] (Gate 2) package manager is valid per SPEC-0026
- [PRE-03] (Gate 3) actual install path requires package manager binary preflight success

### Post-conditions

- [POST-01] (Gate 2) missing allowlisted dev dependencies are passed to package manager install args
- [POST-02] (Gate 2) already declared dependency names are not included in install args
- [POST-03] (Gate 3) failed preflight leaves target snapshot unchanged

### Assumptions

- [ASM-01] (Gate 横断) package manager install command may create lockfiles during actual opt-in use
- [ASM-02] (Gate 横断) external toolchains remain user-managed in this alpha
- [ASM-03] (Gate 横断) fake package manager tests are sufficient for repository CI

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0029 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0029 と TASK-0107..0110 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-10 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| dry-run safety | `--install-deps --dry-run` leaves package.json and lockfiles absent / unchanged |
| actual opt-in | fake package manager receives expected command and missing package args |
| duplicate prevention | predeclared dependency names are absent from fake install log |
| validation | `make validate` and `bash scripts/sage-validate.sh` pass |

## 採点

- SPEC-0029: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0029: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- TASK-0107: 100/S++
- TASK-0108: 100/S++
- TASK-0109: 100/S++
- TASK-0110: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる dependency installer module / init-update integration / tests / docs / SAGE artifacts を revert する。`package-templates/**`, `doctor`, actual npm publish state には影響しない。

## 関連ID

- PLAN-ID: PLAN-0029
- TASK-ID: TASK-0107, TASK-0108, TASK-0109, TASK-0110
