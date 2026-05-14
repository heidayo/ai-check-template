# SPEC-0016: npm package readiness

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0016 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0015 |
| 権限レベル | platform |

## 背景・目的

SPEC-0015 で repository-local の `ai-check-template init` foundation が入った。次に npm publish 前の package readiness を固め、`npm pack` された tarball から CLI が起動し、target project に templates を導入できることを機械検証する。

本 SPEC は npm registry への publish は行わない。認証や release operation を伴わず、local tarball smoke によって `npx ai-check-template init` へ進む前の配布品質を担保する。

## 対象ユーザー

- v0.2.0 CLI を npm 経由で使う予定の early adopter
- npm package metadata / tarball contents をレビューする maintainer
- publish operation を次 SPEC で実行する release owner

## スコープ（含む）

- `package.json` を npm publish-ready metadata に補強する
- `npm pack --dry-run --json` の tarball contents を tests で検証する
- packed tarball を local install し、installed `ai-check-template` binary から `--help` と `init` smoke を実行する
- `make validate` に npm pack readiness check を追加する
- README / README-ja / `docs/cli.md` / roadmap に package readiness と publish-not-yet の導線を追加する
- SPEC / PLAN / TASK artifacts を作成し、採点と検証を記録する

## スコープ外（明示的に除外）

- `npm publish`
- npm auth token / provenance setup
- GitHub Release / git tag 作成
- `update` / `doctor` command
- package template 内容変更
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `package.json`（更新）
- `tests/cli/package.test.mjs`（新規）
- `Makefile`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0016-npm-package-readiness.md`（新規）
- `plans/PLAN-0016-npm-package-readiness.md`（新規）
- `tasks/TASK-0061-npm-package-metadata.md`（新規）
- `tasks/TASK-0062-npm-pack-smoke-tests.md`（新規）
- `tasks/TASK-0063-npm-readiness-validation.md`（新規）
- `tasks/TASK-0064-verify-npm-package-readiness.md`（新規）

**変更禁止:**
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/**` を変更しない。npm readiness は package metadata, tests, docs に限定し、Codex-only boundary と SAGE protected file rule を維持する。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- npm registry へ publish する
- npm auth token や private registry URL を書く
- `package-templates/**` を変更する
- tarball smoke を dry-run のみで済ませる

## 要件

### 機能要件

- [FR-01] `package.json` が npm package metadata（repository / bugs / homepage / keywords / publishConfig）を持つ
- [FR-02] `npm pack --dry-run --json` が pass し、runtime files が tarball に含まれる
- [FR-03] tarball から local install した binary が `--help` を表示する
- [FR-04] tarball から local install した binary が fixture project に `init` できる
- [FR-05] tests は `node --test tests/cli/*.test.mjs` で実行できる

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] npm registry / network publish に依存しない
- [NFR-03] tarball smoke は temp directory 内で完結し、repo に generated tarball を残さない

### セキュリティ要件

- [SEC-01] `package.json` に private registry / auth token / personal email を書かない
- [SEC-02] tarball contents に SAGE artifacts / tests を含めない
- [SEC-03] publish operation は実行しない

### 運用要件

- [OPS-01] PR #11 は npm package readiness のみを扱う
- [OPS-02] publish operation は follow-up SPEC に分離する
- [OPS-03] CI failure は同一ブランチで修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-06 | `python3 -m json.tool`, `npm pack --dry-run --json`, `grep` |
| Gate 2: Functional | AC-03, AC-04, AC-05 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-07, AC-08 | secret grep, tarball exclusion assertions |
| Gate 4: Architecture | AC-09 | File Scope / protected file check |
| Gate 5: Release | N/A | publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `package.json` が repository / bugs / homepage / keywords / publishConfig.access を持つ
- [x] AC-02: `npm pack --dry-run --json` が pass する
- [x] AC-03: tests が packed tarball に `bin/`, `src/`, `package-templates/`, `docs/cli.md`, README, LICENSE が含まれることを検証する
- [x] AC-04: tests が packed tarball から installed binary `--help` を検証する
- [x] AC-05: tests が packed tarball から installed binary `init --target <fixture> --yes` を検証する
- [x] AC-06: `make validate` が npm package readiness を検証する

### 異常系

- [x] AC-07: tests が tarball に `specs/`, `plans/`, `tasks/`, `tests/`, `.github/` が含まれないことを検証する
- [x] AC-08: package metadata / docs / tests に secret 直書きパターンがない
- [x] AC-09: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: npm がない → validation は clear error で失敗し、Node/npm toolchain の不足として扱う
- 想定エラー2: tarball に runtime file が欠ける → package `files` または tests を修正する
- 想定エラー3: tarball に SAGE artifacts が混入する → package `files` を修正し、exclusion test を通す

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | package metadata を補完 |
| AC-02 | `npm pack --dry-run --json` の error を確認し package metadata を修正 |
| AC-03 | `files` whitelist を修正 |
| AC-04 | `bin` path / shebang / package install smoke を修正 |
| AC-05 | tarball 内 template path / init runtime path を修正 |
| AC-06 | Makefile target dependency を修正 |
| AC-07 | package `files` whitelist を絞る |
| AC-08 | secret-like literal を削除 |
| AC-09 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| npm pack contents regression | `sage/failures.md` | maintainer |
| package metadata の不足が再発 | `sage/anti-patterns.md` 昇格候補 | maintainer |
| tarball smoke が CI only で失敗 | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: local validation、PR CI、publish dry-run のいずれかで package readiness failure を確認する。
2. 記録: maintainer が command、npm version、expected files、actual files、error output を `sage/failures.md` に記録する。
3. 昇格: 同種の pack / metadata failure が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: packed package の `ai-check-template` binary
- npm: package readiness only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: package tarball が大きくなる → `files` whitelist と tarball contents test で軽減
- リスク2: publish 済みと誤読される → docs に publish-not-yet を明記
- リスク3: npm local install smoke が環境依存で不安定 → no dependency package と temp directory fixture で軽減

## 実装メモ

- Use Node built-in `node:test` and `child_process.spawnSync`.
- Use `npm pack --dry-run --json` for contents assertion.
- For executable smoke, pack into temp directory, `npm install --prefix <temp> <tgz> --ignore-scripts --no-audit --no-fund`, then run `<temp>/node_modules/.bin/ai-check-template`.
- Generated tarball must stay outside the repo.

## Properties

### Invariants

- [INV-01] (Gate 3) npm publish is not executed
- [INV-02] (Gate 3) tarball excludes SAGE artifacts and tests
- [INV-03] (Gate 4) `package-templates/**` content is not modified
- [INV-04] (Gate 2) tarball-installed binary can run `init`

### Pre-conditions

- [PRE-01] (Gate 2) Node.js and npm are available
- [PRE-02] (Gate 2) SPEC-0015 CLI foundation exists

### Post-conditions

- [POST-01] (Gate 2) `node --test tests/cli/*.test.mjs` verifies package readiness
- [POST-02] (Gate 1) `make validate` runs npm package readiness checks
- [POST-03] (Gate 1) docs explain package readiness without claiming npm publish

### Assumptions

- [ASM-01] (Gate 横断) npm credentials are not available in CI/local by default
- [ASM-02] (Gate 横断) actual publish is a separate release operation

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0016 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0016 と TASK-0061..0064 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-09 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| pack readiness | `npm pack --dry-run --json` pass |
| tarball contents | runtime files included, SAGE artifacts excluded |
| installed CLI | tarball-installed `--help` and `init` pass |
| CI readiness | `make validate` pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる package metadata / tests / docs / Makefile / SAGE artifacts を revert する。`package-templates/**` は変更しないため、manual templates と repository-local CLI foundation には影響しない。

## 関連ID

- PLAN-ID: PLAN-0016
- TASK-ID: TASK-0061, TASK-0062, TASK-0063, TASK-0064
