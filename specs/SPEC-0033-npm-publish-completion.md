# SPEC-0033: npm publish completion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0033 |
| ステータス | Implemented |
| 作成日    | 2026-05-16 |
| 更新日    | 2026-05-16 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0016, SPEC-0017, SPEC-0032 |
| 権限レベル | platform |

## 背景・目的

`ai-check-template@0.2.0-alpha.0` が npm registry に public package として publish され、`npx -y ai-check-template@next init` の smoke test も pass した。残っていた roadmap item「npm publish and `npx ai-check-template init`」を公開 docs に反映し、v0.2.0 alpha の利用導線を repository-local から npm alpha package へ更新する。

本 SPEC は publish 後の documentation completion である。package contents / package version / registry state は変更しない。

## スコープ（含む）

- README / README-ja の CLI alpha 導線を npm published alpha に更新する
- `docs/cli.md` に `npx -y ai-check-template@next ...` の導入手順と publish status を記載する
- `docs/roadmap.md` の npm publish item を Done に更新する
- `docs/releases/v0.2.0-alpha.0.md` を追加し、publish evidence と smoke test を記録する
- SAGE SPEC / PLAN / TASK を 6 軸 100/S++ で採点する

## スコープ外（明示的に除外）

- package version bump
- package code / template content の変更
- npm registry への追加 write operation
- npm dist-tag 変更
- GitHub Release 作成
- v0.2.0 stable release 宣言
- CI workflow / package scripts の追加変更
- `package.json`, `src/**`, `package-templates/**`, `.github/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/cli.md`（更新）
- `docs/roadmap.md`（更新）
- `docs/releases/v0.2.0-alpha.0.md`（新規）
- `specs/SPEC-0033-npm-publish-completion.md`（新規）
- `plans/PLAN-0033-npm-publish-completion.md`（新規）
- `tasks/TASK-0123-npm-publish-docs.md`（新規）
- `tasks/TASK-0124-npm-publish-release-note.md`（新規）
- `tasks/TASK-0125-verify-npm-publish-completion.md`（新規）

**変更禁止:**
- `package.json`
- `src/**`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。実装エージェントは AGENTS.md の standard lane / File Scope / TASK-ID commit hook を守る。追加で守る具体ルールは「publish 済みの alpha と stable release を混同しない」「registry に追加 write しない」「code / templates を変更しない」の 3 点である。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに docs 更新へ進む
- File Scope 外の変更
- v0.2.0 stable release と誤表記する
- npm registry へ追加 write operation を行う
- package version / package contents を変更する
- `--no-verify`, `--force`, `rm -rf`

## 要件

### 機能要件

- [FR-01] README / README-ja は `npx -y ai-check-template@next init` を alpha CLI の primary path として示す
- [FR-02] `docs/cli.md` は npm package `ai-check-template@0.2.0-alpha.0` が public alpha として published であることを示す
- [FR-03] `docs/roadmap.md` は npm publish and npx smoke item を Done にする
- [FR-04] release note は publish command / registry verification / npx smoke の evidence を記録する

### 非機能要件

- [NFR-01] docs は alpha / stable の区別を明確にする
- [NFR-02] docs は package install なしの manual template path も残す
- [NFR-03] docs は user-facing quick start を 1 command path と manual path に分ける

### セキュリティ要件

- [SEC-01] npm token / auth URL / one-time code / email address を docs に書かない
- [SEC-02] smoke test temp path 等の local absolute path を docs に書かない
- [SEC-03] registry write operation は実行しない

### 運用要件

- [OPS-01] PR は publish completion docs のみに限定する
- [OPS-02] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる
- [OPS-03] stable v0.2.0 release は follow-up SPEC に分離する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02 | file existence / markdown grep |
| Gate 2: Functional | AC-03, AC-04 | npm view / npx smoke evidence |
| Gate 3: Security | AC-05, AC-06 | secret grep / auth URL grep |
| Gate 4: Architecture | AC-07 | File Scope / protected file check |
| Gate 5: Release | AC-03, AC-04 | npm registry and npx smoke verification |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: README / README-ja / `docs/cli.md` mention `npx -y ai-check-template@next init`
- [x] AC-02: `docs/releases/v0.2.0-alpha.0.md` exists and records version `0.2.0-alpha.0`
- [x] AC-03: `npm view ai-check-template version dist-tags --json` returns `0.2.0-alpha.0` and `next`
- [x] AC-04: `npx -y ai-check-template@next init` dry-run / write / doctor smoke passed for `node-cli` + `npm` + `ci none`
- [x] AC-05: `docs/roadmap.md` marks npm publish and `npx ai-check-template init` as Done

### 異常系

- [x] AC-06: docs contain no npm token, auth URL, OTP, or secret-like literal
- [x] AC-07: changed files are File Scope only, with no `package.json`, `src/**`, `package-templates/**`, protected file, or additional npm registry write changes
- [x] AC-08: `node --test tests/cli/*.test.mjs`, `make validate`, `bash scripts/sage-validate.sh`, and `git diff --check` pass

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | quick start sections に `npx -y ai-check-template@next init` を追加 |
| AC-02 | release note path / version mention を修正 |
| AC-03 | registry propagation 待ち後に再実行し、失敗継続なら publish state を確認 |
| AC-04 | smoke command / package manager / profile args を修正 |
| AC-05 | roadmap checkbox と status text を更新 |
| AC-06 | auth URL / token / secret-like literal を削除 |
| AC-07 | out-of-scope diff を取り除く |
| AC-08 | failing validation output に従い File Scope 内で修正 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| npm registry propagation delay | `sage/failures.md` | maintainer |
| npx smoke regression | `sage/failures.md` | maintainer |
| alpha/stable docs confusion | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: publish / npm view / npx smoke / PR CI のいずれかで publish completion regression を確認する。
2. 記録: maintainer が command, expected output, actual output, retry timing を `sage/failures.md` に記録する。
3. 昇格: alpha/stable confusion が 3 回累積した場合、follow-up SPEC または `sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: public npm alpha package `ai-check-template@0.2.0-alpha.0` can be invoked with `npx -y ai-check-template@next`
- Output contract: docs describe alpha package status and smoke evidence
- npm: no additional registry write in this SPEC
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: alpha を stable と読める → alpha / `@next` 表記を明示
- リスク2: secret/auth material leakage → secret grep と auth URL grep を実行
- リスク3: docs overclaim untested flow → smoke evidence を release note に限定して記録

## Properties

### Invariants

- [INV-01] (Gate 5) docs mention published alpha, not stable v0.2.0
- [INV-02] (Gate 3) npm auth material is not committed
- [INV-03] (Gate 4) package contents and templates remain unchanged

### Pre-conditions

- [PRE-01] (Gate 5) `ai-check-template@0.2.0-alpha.0` is visible in npm registry
- [PRE-02] (Gate 5) `npx -y ai-check-template@next` resolves

### Post-conditions

- [POST-01] (Gate 1) public docs guide users to npm alpha CLI
- [POST-02] (Gate 1) roadmap has no remaining unchecked v0.2.0 alpha publish item

## 採点

- SPEC-0033: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
