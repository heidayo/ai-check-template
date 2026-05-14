# SPEC-0015: CLI init foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0015 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0014 |
| 権限レベル | platform |

## 背景・目的

v0.1.0 は manual copy の template set として release 済みである。v0.2.0 では copy friction を下げるため、まず dependency-free な Node CLI foundation を追加し、`ai-check-template init` で既存プロジェクトへ scripts / package scripts / CI examples / optional Claude hooks を安全に導入できるようにする。

本 SPEC は npm publish までは行わず、repository 内で CLI 実装・テスト・validation を整える first slice とする。

## 対象ユーザー

- `npx ai-check-template init` の完成を待つ early adopter
- 既存プロジェクトに v0.1.0 templates を安全に入れたい maintainer
- v0.2.0 CLI の後続 `update` / `doctor` を実装する contributor

## スコープ（含む）

- root `package.json` を追加し、CLI package metadata と `bin` を定義する
- `bin/ai-check-template.mjs` と `src/cli/*.mjs` を追加する
- `ai-check-template init` を実装する
- `--target`, `--profile`, `--ci`, `--claude-hooks`, `--dry-run`, `--yes`, `--overwrite` flags を提供する
- `package.json` scripts merge を safe default（既存 script 不上書き）で実装する
- `package-templates/scripts/**` と CI examples を target project へ copy する
- optional Claude hook / rule copy と settings merge を実装する
- Node built-in test runner による CLI tests を追加する
- `docs/cli.md` を追加し、README / roadmap / Makefile に導線と validation を追加する

## スコープ外（明示的に除外）

- npm publish
- `update` / `doctor` command の実装
- interactive prompt UI
- package manager auto-detection の完全対応
- profile-specific scripts の実体生成
- hosted reusable workflow / composite action
- `package-templates/**` の既存内容変更
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `package.json`（新規）
- `bin/ai-check-template.mjs`（新規）
- `src/cli/index.mjs`（新規）
- `src/cli/init.mjs`（新規）
- `src/cli/profile.mjs`（新規）
- `src/cli/utils.mjs`（新規）
- `tests/cli/init.test.mjs`（新規）
- `docs/cli.md`（新規）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `Makefile`（更新）
- `specs/SPEC-0015-cli-init-foundation.md`（新規）
- `plans/PLAN-0015-cli-init-foundation.md`（新規）
- `tasks/TASK-0056-cli-package-skeleton.md`（新規）
- `tasks/TASK-0057-cli-init-operations.md`（新規）
- `tasks/TASK-0058-cli-tests-docs.md`（新規）
- `tasks/TASK-0059-cli-validation.md`（新規）
- `tasks/TASK-0060-verify-cli-init-foundation.md`（新規）

**変更禁止:**
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/rules/**` を変更しない。CLI は root package code と docs の範囲に閉じ、SAGE protected files と配布済み templates を変更しない。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- dependency を追加して build step を必須にする
- target project の既存ファイルを default で上書きする
- invalid profile を成功扱いにする
- target project に secret / private data を書き込む
- npm publish を行う

## 要件

### 機能要件

- [FR-01] `node bin/ai-check-template.mjs --help` が usage を表示する
- [FR-02] `node bin/ai-check-template.mjs init --target <dir> --profile react-nextjs --yes` が target package scripts を merge する
- [FR-03] init は `package-templates/scripts/ai-check.sh` と `ai-check-fast.sh` を target `scripts/` に copy する
- [FR-04] `--ci direct` は `ai-check.yml` と `ai-check-fast.yml` を copy する
- [FR-05] `--ci reusable` は `ai-quality-reusable.yml` と `ai-quality-call.yml` を copy する
- [FR-06] `--claude-hooks` は `.claude/rules/test-rules.md` を copy し、settings hook fragment を safe merge する
- [FR-07] `--dry-run` は planned operations を表示し、target file を変更しない
- [FR-08] existing files / existing scripts は default で上書きしない

### 非機能要件

- [NFR-01] CLI runtime は Node.js 標準ライブラリのみを使う
- [NFR-02] package version は `0.2.0-alpha.0` とし、正式 v0.2.0 release ではないことを示す
- [NFR-03] tests は Node built-in `node --test` で実行する
- [NFR-04] root CI は dependency install なしで pass する

### セキュリティ要件

- [SEC-01] target path は realpath / resolve し、repository template root からの copy source を固定する
- [SEC-02] invalid profile / path traversal profile は reject する
- [SEC-03] existing files are not overwritten unless `--overwrite`
- [SEC-04] CLI code / docs に secret 直書きパターンを含めない

### 運用要件

- [OPS-01] PR #10 では CLI foundation のみ追加し、npm publish しない
- [OPS-02] PR CI failure は同一ブランチで修正し、`make validate` と GitHub Actions 再実行結果で feedback loop を閉じる
- [OPS-03] `update` / `doctor` は follow-up SPEC に分離する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03, AC-04, AC-05 | `test -f`, `python3 -m json.tool`, `grep` |
| Gate 2: Functional | AC-06, AC-07, AC-08, AC-09, AC-10 | `node --test`, CLI fixture runs |
| Gate 3: Security | AC-11, AC-12, AC-13 | overwrite tests, invalid profile tests, secret grep |
| Gate 4: Architecture | AC-14 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: root `package.json` が存在し、`bin.ai-check-template` と version `0.2.0-alpha.0` を持つ
- [x] AC-02: `bin/ai-check-template.mjs` と `src/cli/*.mjs` が存在する
- [x] AC-03: `docs/cli.md` が `init`, `--profile`, `--dry-run`, `--overwrite`, `--ci`, `--claude-hooks` に言及する
- [x] AC-04: README / README-ja / roadmap が CLI alpha docs にリンクする
- [x] AC-05: `make validate` が CLI tests を実行する

### 機能検証

- [x] AC-06: `node bin/ai-check-template.mjs --help` が pass する
- [x] AC-07: `node --test tests/cli/*.test.mjs` が pass する
- [x] AC-08: tests が package scripts merge と scripts copy を検証する
- [x] AC-09: tests が `--dry-run` で target を変更しないことを検証する
- [x] AC-10: tests が `--ci direct`, `--ci reusable`, `--claude-hooks` の copy / merge を検証する

### 異常系

- [x] AC-11: tests が existing files/scripts を default overwrite しないことを検証する
- [x] AC-12: tests が invalid profile を reject することを検証する
- [x] AC-13: CLI code / docs に secret 直書きパターンがない
- [x] AC-14: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: target に `package.json` がない → init は clear error で失敗する
- 想定エラー2: target に既存 script / file がある → default では skip し、`--overwrite` を案内する
- 想定エラー3: invalid profile が指定される → supported profiles を表示して非 0 exit
- 境界ケース1: `--dry-run` と `--overwrite` が同時指定される → write せず、would overwrite として report する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | package metadata を補完 |
| AC-02 | missing CLI module を作成 |
| AC-03 | docs/cli.md に不足 flag を追加 |
| AC-04 | README / README-ja / roadmap link を追加 |
| AC-05 | Makefile validate-cli を追加 |
| AC-06 | help command parser を修正 |
| AC-07 | failing node test を修正 |
| AC-08 | init merge / copy logic を修正 |
| AC-09 | dry-run の write path を止める |
| AC-10 | ci / claude copy logic を修正 |
| AC-11 | overwrite guard を修正 |
| AC-12 | profile parser を修正 |
| AC-13 | secret-like literal を削除 |
| AC-14 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| CLI init が実プロジェクトで安全に merge できない | `sage/failures.md` | maintainer |
| profile combination gap が見つかる | follow-up SPEC / `docs/phase-1-feedback-template.md` | maintainer |
| overwrite / merge bug が再発する | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで init failure を確認する。
2. 記録: maintainer が command、target fixture、期待結果、実際の output を `sage/failures.md` に記録する。
3. 昇格: 同種の init safety bug が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template init`
- npm: package metadata only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: safe merge が不十分で user file を壊す → default no overwrite と tests で軽減
- リスク2: CLI scope が膨らむ → update / doctor / interactive UI を follow-up に分離
- リスク3: alpha CLI が published release と誤読される → version `0.2.0-alpha.0` と docs で軽減

## 実装メモ

- No dependencies. Use `node:fs`, `node:path`, `node:url`, `node:test`.
- Target `package.json` がない場合は fail する。
- Profile parser supports base profiles plus optional `supabase-rls` addon.
- Use repository-relative package templates as copy source.

## Properties

### Invariants

- [INV-01] (Gate 3) Existing target files are not overwritten by default
- [INV-02] (Gate 3) Invalid profiles are rejected before any write
- [INV-03] (Gate 4) `package-templates/**` content is not modified
- [INV-04] (Gate 2) `--dry-run` produces no target file changes

### Pre-conditions

- [PRE-01] (Gate 2) Target project has `package.json`
- [PRE-02] (Gate 2) CLI is run with Node.js 20+

### Post-conditions

- [POST-01] (Gate 2) Target project has `ai:check` / `ai:check:fast` scripts when init succeeds
- [POST-02] (Gate 2) Target project has selected scripts / CI / hook files copied or skipped with report
- [POST-03] (Gate 1) CLI docs are discoverable from README and roadmap

### Assumptions

- [ASM-01] (Gate 横断) v0.2.0 alpha is not npm-published in this SPEC
- [ASM-02] (Gate 横断) downstream users can adapt generated scripts to their package manager

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0015 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0015 と TASK-0056..0060 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-14 全 pass | `make validate` + `node --test` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| CLI smoke | AC-06 pass |
| Init behavior | AC-08..AC-10 pass |
| Safety | AC-11..AC-12 pass |
| CI readiness | AC-05 / AC-07 pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる CLI files / docs / Makefile / SAGE artifacts を revert する。`package-templates/**` は変更しないため、v0.1.0 manual template release には影響しない。

## 関連ID

- PLAN-ID: PLAN-0015
- TASK-ID: TASK-0056, TASK-0057, TASK-0058, TASK-0059, TASK-0060
