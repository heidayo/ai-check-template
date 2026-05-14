# SPEC-0026: CLI package manager detection

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0026 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0020, SPEC-0022, SPEC-0025 |
| 権限レベル | platform |

## 背景・目的

CLI alpha の profile-aware package scripts は現在 `pnpm` 固定で生成される。これは manual templates の初期前提としては十分だったが、既存プロジェクトへ `init` / `update` する CLI では、target の package manager に合わせた npm scripts を生成できる方が安全である。

本 SPEC は dependency install を行わず、target の `packageManager` field / lockfile から package manager を検出し、profile-aware scripts の script invocation 部分だけを `pnpm` / `npm` / `yarn` / `bun` に合わせる。明示 flag `--package-manager <name>` は検出結果と install state より優先する。

## 対象ユーザー

- npm / yarn / bun project に CLI alpha を導入したい early adopter
- install state に package manager を残して `doctor` / `update` の drift 判定を安定させたい maintainer
- v0.2.0 の `npx ai-check-template init` に向けて pnpm 固定を減らしたい CLI developer

## スコープ（含む）

- package manager detector を追加する
- supported package managers は `pnpm`, `npm`, `yarn`, `bun`
- `init` / `doctor` / `update` に `--package-manager <name>` を追加する
- effective option priority は explicit flag → install state → target detection → `pnpm` default
- profile-aware package scripts が effective package manager に合わせて script invocation を生成する
- install state に `packageManager` を保存し、既存 state では `pnpm` default として後方互換にする
- JSON output の `installation` / `effectiveOptions` に package manager を含める
- README / README-ja / `docs/cli.md` / roadmap / CLI tests を更新する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- dependency install
- package manager の変更コマンド実行
- package templates の manual copy fragment 変更
- shell script content の package-manager-specific rewrite
- lockfile 作成・削除
- npm publish / `npx` 実行
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/package-manager.mjs`（新規）
- `src/cli/profile-scripts.mjs`（更新）
- `src/cli/install-state.mjs`（更新）
- `src/cli/init.mjs`（更新）
- `src/cli/doctor.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `src/cli/index.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0026-cli-package-manager-detection.md`（新規）
- `plans/PLAN-0026-cli-package-manager-detection.md`（新規）
- `tasks/TASK-0097-package-manager-core.md`（新規）
- `tasks/TASK-0098-package-manager-cli-integration.md`（新規）
- `tasks/TASK-0099-package-manager-docs.md`（新規）
- `tasks/TASK-0100-verify-package-manager-detection.md`（新規）

**変更禁止:**
- `src/cli/profile-diagnostics.mjs`
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
- package templates を変更する
- unknown package manager を silently accept する
- install state schema を後方互換なしに壊す
- npm publish を実行する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] `init --package-manager npm` は npm-style scripts を生成し、install state に `packageManager: "npm"` を保存する
- [FR-02] explicit flag がない場合、target の `packageManager` field / lockfile から package manager を検出する
- [FR-03] `doctor` は install state または detection に基づいて package scripts drift を判定する
- [FR-04] `update` は install state または detection に基づいて package scripts を migrate する
- [FR-05] `doctor --json` / `update --json` は effective package manager を出力する
- [FR-06] invalid `--package-manager` は target write 前に error にする

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] default は `pnpm` とし、既存 behavior を維持する
- [NFR-03] install state の missing packageManager は `pnpm` として扱う
- [NFR-04] output changes は additive にする

### セキュリティ要件

- [SEC-01] detector は lockfile contents を出力しない
- [SEC-02] CLI code / docs / tests に secret 直書きパターンを含めない
- [SEC-03] `doctor` は read-only を維持する

### 運用要件

- [OPS-01] PR は package manager detection / scripts generation のみを扱う
- [OPS-02] dependency install は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | help grep, docs grep |
| Gate 2: Functional | AC-03, AC-04, AC-05, AC-06 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | read-only doctor snapshot, secret grep |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `init`, `doctor`, `update` help が `--package-manager` を表示する
- [x] AC-02: README, README-ja, `docs/cli.md`, roadmap が package manager detection に言及する
- [x] AC-03: `init --package-manager npm` は `npm run` based profile scripts と install state `packageManager: "npm"` を生成する
- [x] AC-04: `packageManager: "yarn@..."` または `yarn.lock` target は yarn scripts を生成する
- [x] AC-05: `doctor` は install state package manager に基づき drift 判定する
- [x] AC-06: `update` は install state package manager に基づき drifted scripts を repair する

### 異常系

- [x] AC-07: invalid package manager は target snapshot を変更せず exit 1
- [x] AC-08: `doctor` は target snapshot を変更しない
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: `--package-manager invalid` → error before write
- 想定エラー2: old install state without packageManager → valid, defaults to pnpm
- 境界ケース1: no packageManager field and no lockfile → pnpm default
- 境界ケース2: explicit flag and lockfile conflict → explicit flag wins

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | usage text を更新 |
| AC-02 | docs / README / roadmap に package manager detection 説明を追加 |
| AC-03 | init parse / script resolver / state writer を修正 |
| AC-04 | detector priority を修正 |
| AC-05 | doctor effective options と script resolver integration を修正 |
| AC-06 | update effective options と script resolver integration を修正 |
| AC-07 | parse validation を target write 前に移動 |
| AC-08 | doctor path から write helper 呼び出しを排除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| package manager false detection | `sage/failures.md` | maintainer |
| old install state compatibility regression | `sage/failures.md` | maintainer |
| package-manager-specific command bug | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで package manager detection regression を確認する。
2. 記録: maintainer が command, target files, expected package manager, actual scripts を `sage/failures.md` に記録する。
3. 昇格: 同種の command generation bug が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `--package-manager <pnpm|npm|yarn|bun>`
- Output contract: install state and JSON summaries may include `packageManager`
- npm: publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: old install state を壊す → missing packageManager は `pnpm` default として受け入れる
- リスク2: npm command が invalid になる → npm は `npm run <script>` を使う
- リスク3: package templates と CLI behavior がずれる → docs に CLI alpha resolver と manual fragment の違いを明記する

## 実装メモ

- No dependencies. Use Node stdlib only.
- Detection priority: package.json `packageManager` field → lockfiles → `pnpm`
- Lockfiles: `pnpm-lock.yaml`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `bun.lock`, `bun.lockb`
- Script invocation:
  - pnpm: `pnpm <script>`
  - npm: `npm run <script>`
  - yarn: `yarn <script>`
  - bun: `bun run <script>`

## Properties

### Invariants

- [INV-01] (Gate 2) default package manager is pnpm
- [INV-02] (Gate 2) explicit package manager overrides state and detection
- [INV-03] (Gate 3) doctor is read-only
- [INV-04] (Gate 4) `package-templates/**` content is not modified

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0022 profile-aware scripts exist
- [PRE-02] (Gate 2) SPEC-0020 install state exists
- [PRE-03] (Gate 2) Target project has `package.json` for normal diagnosis/update/init

### Post-conditions

- [POST-01] (Gate 2) generated package scripts use effective package manager
- [POST-02] (Gate 2) install state persists package manager

### Assumptions

- [ASM-01] (Gate 横断) dependency install is not required for v0.2.0 alpha script generation
- [ASM-02] (Gate 横断) manual package template fragment remains generic pnpm until a separate template SPEC

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0026 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0026 と TASK-0097..0100 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| npm script generation | `init --package-manager npm` uses `npm run` |
| detection | `yarn.lock` target uses yarn when no flag/state exists |
| state compatibility | old state without packageManager remains valid |
| validation | `make validate` pass |

## 採点

- SPEC-0026: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0026: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- TASK-0097: 100/S++
- TASK-0098: 100/S++
- TASK-0099: 100/S++
- TASK-0100: 100/S++

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる package manager detection / script generation code / tests / docs / SAGE artifacts を revert する。`package-templates/**`, npm publish state, and dependency install には影響しない。

## 関連ID

- PLAN-ID: PLAN-0026
- TASK-ID: TASK-0097, TASK-0098, TASK-0099, TASK-0100
