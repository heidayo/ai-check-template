# SPEC-0018: CLI doctor foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0018 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0015, SPEC-0016, SPEC-0017 |
| 権限レベル | platform |

## 背景・目的

v0.2.0 alpha では `init` による導入と npm package readiness が整った。次に `doctor` command foundation を追加し、導入済み project の `ai-check-template` files / scripts / CI / Claude hooks が expected template と一致しているかを read-only で診断できるようにする。

本 SPEC は repair / update は行わない。まず drift を検出して machine-readable に返す。

## 対象ユーザー

- `init` 後の導入状態を確認したい maintainer
- package update 前に drift を見たい contributor
- future `update` command の前提診断を作る CLI developer

## スコープ（含む）

- `ai-check-template doctor` command を追加する
- `--target`, `--ci`, `--claude-hooks`, `--json` flags を提供する
- package scripts / shell scripts / selected CI workflows / optional Claude hooks を read-only で検査する
- missing / drift / invalid target を non-zero exit で返す
- Node tests と package tarball tests を更新する
- README / README-ja / `docs/cli.md` / roadmap / Makefile に doctor docs と validation を追加する

## スコープ外（明示的に除外）

- `update` command
- doctor による auto repair
- npm publish
- profile-specific template mutation
- external network checks
- `package-templates/**` の変更
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/doctor.mjs`（新規）
- `src/cli/index.mjs`（更新）
- `tests/cli/doctor.test.mjs`（新規）
- `tests/cli/package.test.mjs`（更新）
- `Makefile`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0018-cli-doctor-foundation.md`（新規）
- `plans/PLAN-0018-cli-doctor-foundation.md`（新規）
- `tasks/TASK-0068-cli-doctor-command.md`（新規）
- `tasks/TASK-0069-cli-doctor-tests.md`（新規）
- `tasks/TASK-0070-cli-doctor-docs-validation.md`（新規）
- `tasks/TASK-0071-verify-cli-doctor-foundation.md`（新規）

**変更禁止:**
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/**` を変更しない。doctor は repository CLI code / tests / docs の範囲に閉じる。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- doctor で target files を書き換える
- `package-templates/**` を変更する
- npm publish を実行する
- target の secret / private data を出力する

## 要件

### 機能要件

- [FR-01] `node bin/ai-check-template.mjs doctor --help` が usage を表示する
- [FR-02] `doctor --target <dir> --ci none` が package scripts と shell scripts を検査する
- [FR-03] `doctor --ci direct` は direct CI workflows を検査する
- [FR-04] `doctor --ci reusable` は reusable CI workflows を検査する
- [FR-05] `doctor --claude-hooks` は Claude rule file と settings hooks を検査する
- [FR-06] `doctor --json` は machine-readable result を出力する
- [FR-07] missing / drift がある場合は non-zero exit で返す

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] doctor は read-only で target project を変更しない
- [NFR-03] diagnostics は relative path と issue code を含む

### セキュリティ要件

- [SEC-01] target file contents を丸ごと出力しない
- [SEC-02] invalid target path は clear error で reject する
- [SEC-03] CLI code / docs / tests に secret 直書きパターンを含めない

### 運用要件

- [OPS-01] PR #13 は doctor foundation のみを扱う
- [OPS-02] update / repair は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | `test -f`, docs grep, Makefile checks |
| Gate 2: Functional | AC-04, AC-05, AC-06, AC-07, AC-08 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-09, AC-10 | read-only tests, secret grep |
| Gate 4: Architecture | AC-11 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/doctor.mjs` が存在し、top-level help に `doctor` が表示される
- [x] AC-02: `docs/cli.md`, README, README-ja, roadmap が `doctor` に言及する
- [x] AC-03: `make validate` が doctor tests を実行する
- [x] AC-04: tests が healthy target の `doctor --ci none` pass を検証する
- [x] AC-05: tests が `--ci direct`, `--ci reusable`, `--claude-hooks` pass を検証する
- [x] AC-06: tests が missing file / drift script を non-zero として検証する
- [x] AC-07: tests が `--json` output を parse できることを検証する
- [x] AC-08: package tests が tarball に `src/cli/doctor.mjs` が含まれることを検証する

### 異常系

- [x] AC-09: tests が doctor 実行前後で target file を変更しないことを検証する
- [x] AC-10: CLI code / docs / tests に secret 直書きパターンがない
- [x] AC-11: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: target に `package.json` がない → doctor は clear error で失敗する
- 想定エラー2: expected file が missing → issue code `missing-file` を返す
- 想定エラー3: expected content と違う → issue code `drift` を返す
- 境界ケース1: `--ci none` → CI workflow checks を skip する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | command dispatch / help を修正 |
| AC-02 | docs / README / roadmap に doctor 導線を追加 |
| AC-03 | Makefile validation を修正 |
| AC-04 | baseline script / file checks を修正 |
| AC-05 | CI / Claude optional checks を修正 |
| AC-06 | issue detection と exit code を修正 |
| AC-07 | JSON output schema を修正 |
| AC-08 | package test expected files を更新 |
| AC-09 | write path を削除し read-only test を追加 |
| AC-10 | secret-like literal を削除 |
| AC-11 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| doctor false positive | `sage/failures.md` | maintainer |
| drift detection gap | `sage/failures.md` | maintainer |
| read-only violation | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで doctor failure を確認する。
2. 記録: maintainer が command、target fixture、expected issue、actual output を `sage/failures.md` に記録する。
3. 昇格: 同種の doctor false positive / read-only failure が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template doctor`
- npm: package contents only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: doctor が user content を出力しすぎる → relative path / issue code のみに制限
- リスク2: read-only command が誤って変更する → before / after snapshot test で軽減
- リスク3: drift 判定が厳しすぎる → foundation では template-managed files の exact match に限定

## 実装メモ

- No dependencies. Use Node stdlib only.
- Reuse `package-templates/**` as read-only expected source.
- `doctor` exit code: no issue = 0, issue or invalid target = 1.
- JSON schema: `{ "status": "pass" | "fail", "target": "...", "issues": [...] }`.

## Properties

### Invariants

- [INV-01] (Gate 3) doctor never writes target files
- [INV-02] (Gate 2) missing / drift returns non-zero
- [INV-03] (Gate 4) `package-templates/**` content is not modified
- [INV-04] (Gate 2) JSON output is parseable

### Pre-conditions

- [PRE-01] (Gate 2) Target project has `package.json`
- [PRE-02] (Gate 2) SPEC-0015 init foundation exists

### Post-conditions

- [POST-01] (Gate 2) target health can be diagnosed after init
- [POST-02] (Gate 1) doctor docs are discoverable from CLI docs and README

### Assumptions

- [ASM-01] (Gate 横断) exact match is acceptable for template-managed files
- [ASM-02] (Gate 横断) update / repair will be implemented later

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0018 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0018 と TASK-0068..0071 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-11 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| healthy detection | initialized fixture doctor pass |
| drift detection | missing / changed template file returns issue |
| read-only safety | before / after target snapshot unchanged |
| validation | `make validate` pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる doctor code / tests / docs / Makefile / SAGE artifacts を revert する。`init` と package templates には影響しない。

## 関連ID

- PLAN-ID: PLAN-0018
- TASK-ID: TASK-0068, TASK-0069, TASK-0070, TASK-0071
