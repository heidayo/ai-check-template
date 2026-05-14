# SPEC-0017: npm publish preflight

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0017 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0016 |
| 権限レベル | platform |

## 背景・目的

SPEC-0016 で npm package readiness を追加した。追加 preflight として `npm publish --dry-run` を実行したところ、pre-release version `0.2.0-alpha.0` は explicit dist-tag が必要であり、`npm publish --dry-run --tag next --json` なら pass することが分かった。

本 SPEC では actual `npm publish` は行わず、publish dry-run preflight を validation と docs に固定する。

## 対象ユーザー

- v0.2.0 alpha publish を実行する maintainer
- `next` dist-tag の意味を確認したい contributor
- publish 前に CI で preflight を確認したい release owner

## スコープ（含む）

- `make validate` に `npm publish --dry-run --tag next --json` preflight を追加する
- npm publish dry-run が auto-correct しないように `package.json` の `bin.ai-check-template` path を npm-normalized form にする
- `docs/cli.md` に prerelease publish は `--tag next` が必要であることを追記する
- README / README-ja / roadmap に publish dry-run preflight の状態を反映する
- SPEC / PLAN / TASK artifacts を作成し、採点と検証を記録する

## スコープ外（明示的に除外）

- actual `npm publish`
- npm auth setup / token creation
- GitHub Release / git tag 作成
- package name / version の変更
- `package-templates/**` の変更
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `Makefile`（更新）
- `package.json`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0017-npm-publish-preflight.md`（新規）
- `plans/PLAN-0017-npm-publish-preflight.md`（新規）
- `tasks/TASK-0065-npm-publish-dry-run.md`（新規）
- `tasks/TASK-0066-npm-publish-preflight-docs.md`（新規）
- `tasks/TASK-0067-verify-npm-publish-preflight.md`（新規）

**変更禁止:**
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/**` を変更しない。publish preflight の知識は docs と validation に限定する。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- actual `npm publish` を実行する
- npm auth token / private registry URL を書く
- pre-release publish tag を省略する

## 要件

### 機能要件

- [FR-01] `make validate` が `npm publish --dry-run --tag next --json` を実行する
- [FR-02] docs が prerelease publish preflight には `--tag next` が必要であることを説明する
- [FR-03] roadmap が publish dry-run preflight 完了と actual publish 未完了を区別する
- [FR-04] `package.json` の `bin.ai-check-template` が npm publish dry-run で auto-correct されない path になる

### 非機能要件

- [NFR-01] registry publish / auth を要求しない
- [NFR-02] generated tarball を repo に残さない
- [NFR-03] validation は dependency install なしで pass する

### セキュリティ要件

- [SEC-01] npm auth token / private registry URL を repo に書かない
- [SEC-02] actual publish は行わない

### 運用要件

- [OPS-01] PR #12 は npm publish preflight のみを扱う
- [OPS-02] actual publish は explicit human approval 後の follow-up operation に分離する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | Makefile target, docs grep |
| Gate 2: Functional | AC-04, AC-05 | `npm publish --dry-run --tag next --json` |
| Gate 3: Security | AC-06, AC-07 | secret grep, no actual publish |
| Gate 4: Architecture | AC-08 | File Scope / protected file check |
| Gate 5: Release | N/A | actual publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `Makefile` に publish dry-run preflight target がある
- [x] AC-02: `docs/cli.md`, README, README-ja, roadmap が `npm publish --dry-run --tag next` に言及する
- [x] AC-03: roadmap が dry-run preflight と actual npm publish を区別する
- [x] AC-04: `package.json` の `bin.ai-check-template` が `bin/ai-check-template.mjs` である
- [x] AC-05: `make validate` が pass し、publish dry-run preflight を実行する

### 異常系

- [x] AC-06: secret / npm auth token pattern がない
- [x] AC-07: actual `npm publish` は実行していない
- [x] AC-08: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: `npm publish --dry-run` が tag missing で落ちる → `--tag next` を付ける
- 想定エラー2: npm auth がない → dry-run warning は許容し、exit status 0 を pass とする
- 想定エラー3: docs が publish 済みと誤読される → actual publish 未実行を明記する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | Makefile target を追加 |
| AC-02 | docs / README / roadmap に preflight command を追記 |
| AC-03 | roadmap の checkbox を dry-run と actual publish に分離 |
| AC-04 | `bin.ai-check-template` を `bin/ai-check-template.mjs` に正規化 |
| AC-05 | command に `--tag next` と `--json` を付ける |
| AC-06 | secret-like literal を削除 |
| AC-07 | actual publish を行わず dry-run output だけを使う |
| AC-08 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| prerelease tag omission が再発 | `sage/failures.md` | maintainer |
| publish dry-run と actual publish の差分 | `sage/failures.md` | maintainer |
| npm auth/token 誤記載 | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: local validation、PR CI、publish operation のいずれかで publish preflight failure を確認する。
2. 記録: maintainer が npm version、command、expected、actual output を `sage/failures.md` に記録する。
3. 昇格: 同種 failure が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- npm: dry-run only, actual publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: dry-run pass を publish 完了と誤解する → docs / roadmap に actual publish 未実行を明記
- リスク2: pre-release tag を忘れて publish に失敗する → `make validate` に `--tag next` preflight を追加
- リスク3: npm auth 情報を docs に書いてしまう → secret grep と Forbidden Shortcuts で軽減

## 実装メモ

- Use `npm publish --dry-run --tag next --json`.
- `npm whoami` is not part of validation because auth is intentionally out of scope.
- Actual publish requires explicit user approval.

## Properties

### Invariants

- [INV-01] (Gate 3) Actual npm publish is not executed
- [INV-02] (Gate 3) No npm auth token is written
- [INV-03] (Gate 1) Pre-release publish preflight always includes `--tag next`
- [INV-04] (Gate 1) npm publish dry-run does not auto-correct package metadata

### Pre-conditions

- [PRE-01] (Gate 2) SPEC-0016 package readiness is merged
- [PRE-02] (Gate 2) npm CLI is available

### Post-conditions

- [POST-01] (Gate 2) `make validate` verifies publish dry-run preflight
- [POST-02] (Gate 1) docs explain dry-run vs actual publish clearly

### Assumptions

- [ASM-01] (Gate 横断) actual publish will be approved separately
- [ASM-02] (Gate 横断) `next` is the correct dist-tag for `0.2.0-alpha.0`

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0017 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0017 と TASK-0065..0067 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-08 全 pass | `make validate` + `npm publish --dry-run --tag next --json` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| publish preflight | `npm publish --dry-run --tag next --json` pass |
| docs clarity | dry-run と actual publish が明確に分離される |
| safety | no actual publish, no auth token, no protected file changes |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる Makefile / docs / SAGE artifacts を revert する。Package metadata と templates は変更しない。

## 関連ID

- PLAN-ID: PLAN-0017
- TASK-ID: TASK-0065, TASK-0066, TASK-0067
