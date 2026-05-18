# SPEC-0041: Expo React Doctor profile correction

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0041 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0040 |
| 権限レベル | product |

## 背景・目的

`expo-rn` profile は React Doctor を「非対応」として扱っている。しかし React Doctor 公式 README は Next.js / Vite / React Native 対応を明記しており、React Native 向け rules も提供している。現状の記述と profile diagnostics は導入者に誤った判断を与える。

本 SPEC では、Expo / React Native profile の React Doctor 非対応表現を修正し、CLI profile scripts / diagnostics / docs / tests を現在の公式情報に合わせる。

## 対象ユーザー

- `--profile expo-rn` を使う CLI 利用者
- Expo / React Native で AI 生成 UI code を検証したい開発者
- profile guidance を参照する導入者

## スコープ（含む）

- `expo-rn` profile-generated `ai:check` に React Doctor `doctor` step を追加する
- `expo-rn` profile-generated support script に `doctor: npx -y react-doctor@latest . --fail-on warning` を追加する
- `profile-diagnostics` から Expo React Doctor 非対応 warning を削除する
- README / README-ja / docs/cli.md / profile README の React Doctor 非対応表現を修正する
- tests に `expo-rn` profile の React Doctor script coverage を追加する
- Makefile structural validation に Expo React Doctor support wording guard を追加する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点し、検証結果を記録する

## スコープ外（明示的に除外）

- React Doctor version pinning
- React Doctor config file の追加
- React Doctor npm dependency install
- `react-vanilla` profile に React Doctor を強制追加する変更
- `node-cli` profile の React Doctor 非対応表現変更
- Expo / Maestro / Detox E2E 設定の追加
- `CLAUDE.md`, `.claude/**`, `sage/**`, `.sage/**`, `templates/**` の変更
- npm publish / tag / release mutation

## File Scope

**書き込み許可:**
- `src/cli/profile-scripts.mjs`
- `src/cli/profile-diagnostics.mjs`
- `tests/cli/init.test.mjs`
- `tests/cli/doctor.test.mjs`
- `docs/cli.md`
- `README.md`
- `README-ja.md`
- `package-templates/profiles/README.md`
- `package-templates/profiles/expo-rn/README.md`
- `Makefile`
- `specs/SPEC-0041-expo-react-doctor-profile-correction.md`
- `plans/PLAN-0041-expo-react-doctor-profile-correction.md`
- `tasks/TASK-0152-expo-react-doctor-cli.md`
- `tasks/TASK-0153-expo-react-doctor-docs.md`
- `tasks/TASK-0154-expo-react-doctor-tests.md`
- `tasks/TASK-0155-verify-expo-react-doctor-correction.md`

**変更禁止:**
- `package.json`
- `bin/**`
- `.github/workflows/**`
- `ai-quality/action.yml`
- `package-templates/scripts/**`
- `package-templates/package.scripts.fragment.json`
- `package-templates/profiles/node-cli/README.md`
- `CLAUDE.md`, `.claude/**`
- `sage/**`, `.sage/**`, `templates/**`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「公式情報に基づく profile correction に限定する」「node-cli の React Doctor 非対応表現を変更しない」「React Doctor dependency install を追加しない」の 3 点である。

## Forbidden Shortcuts

- 公式情報の確認なしに profile support claim を変更する
- File Scope 外の変更
- React Doctor dependency install を追加する
- Expo E2E / Maestro / Detox 変更を混ぜる
- failing tests を無視する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `expo-rn` generated `ai:check` includes `doctor`
- [FR-02] `expo-rn` generated scripts include `doctor: npx -y react-doctor@latest . --fail-on warning`
- [FR-03] `profile-diagnostics` no longer warns that Expo / React Native does not support React Doctor
- [FR-04] docs state React Doctor supports React Native / Expo, while mobile E2E still uses Maestro / Detox
- [FR-05] tests cover `expo-rn` generated React Doctor scripts

### 非機能要件

- [NFR-01] `react-nextjs`, `react-vanilla`, `node-cli` generated commands remain unchanged except shared helper behavior
- [NFR-02] Semgrep / `ai:check:secure` behavior remains unchanged
- [NFR-03] validation is dependency-install-free

### セキュリティ要件

- [SEC-01] docs に secret / private URL を含めない
- [SEC-02] React Doctor is described as code quality diagnostics, not a security scanner

### 運用要件

- [OPS-01] official React Doctor GitHub source is cited in profile docs
- [OPS-02] `make validate` and GitHub Actions `validate` pass before merge

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | docs grep / file grep |
| Gate 2: Functional | AC-04 | CLI tests / `make validate` |
| Gate 3: Security | AC-05 | secret grep |
| Gate 4: Architecture | AC-06 | File Scope / protected file check |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `getProfileScripts("expo-rn")` generates `ai:check` with `doctor` and `doctor` support script
- [x] AC-02: `profile-diagnostics` has no React Doctor unsupported warning for `expo-rn`
- [x] AC-03: README / README-ja / docs/cli.md / expo profile docs mention React Doctor support for React Native / Expo
- [x] AC-04: CLI tests cover `expo-rn` React Doctor generation

### 異常系

- [x] AC-05: changed files contain no secret / private URL literal
- [x] AC-06: changed files are File Scope only, with no package metadata / workflow / protected file changes
- [x] AC-07: `node --test tests/cli/*.test.mjs`, `make validate`, `bash scripts/sage-validate.sh`, and `git diff --check` pass

## 異常系

- 想定エラー1: React Doctor を security scanner と誤解する
- 想定エラー2: React Doctor support correction と mobile E2E tool selection を混同する
- 境界ケース1: `node-cli` は React なしのため React Doctor 非対応のまま

## 契約

- API: なし
- DB: なし
- CLI: `expo-rn` profile scripts now include React Doctor diagnostics
- GitHub Actions: workflow behavior unchanged
- package scripts: `ai:check:secure` unchanged
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: Expo users see a new `doctor` step in `ai:check` and need React Doctor availability → generated `doctor` script uses `npx -y react-doctor@latest`
- リスク2: RN-specific React Doctor rules may need tuning → docs mention project-level config and review before making it a hard CI gate
- リスク3: Correction touches docs in multiple places → Makefile guard and grep validate consistency

## Properties

### Invariants

- [INV-01] (Gate 4) workflow, action, package metadata, and protected files remain unchanged
- [INV-02] (Gate 2) non-Expo base profile commands remain unchanged
- [INV-03] (Gate 3) React Doctor is not presented as a security scanner

### Pre-conditions

- [PRE-01] (Gate 1) React Doctor official README states React Native support
- [PRE-02] (Gate 1) `expo-rn` profile already has AI quality loop scripts

### Post-conditions

- [POST-01] (Gate 2) `expo-rn` generated scripts include React Doctor diagnostics
- [POST-02] (Gate 1) docs no longer tell Expo users React Doctor is unsupported

### Assumptions

- [ASM-01] (Gate 横断) React Doctor support claim is based on the official GitHub README checked on 2026-05-18

## 採点

- SPEC-0041: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）

## 関連ID

- PLAN-ID: PLAN-0041
- TASK-ID: TASK-0152, TASK-0153, TASK-0154, TASK-0155
