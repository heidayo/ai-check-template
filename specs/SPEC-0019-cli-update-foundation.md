# SPEC-0019: CLI update foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0019 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0018 |
| 権限レベル | platform |

## 背景・目的

SPEC-0018 で `doctor` が導入済み project の drift を read-only で検出できるようになった。次に `update` command foundation を追加し、`doctor` が対象にする template-managed files / package scripts を current package templates へ戻せるようにする。

本 SPEC は profile-aware migration や custom merge strategy までは行わず、`init` / `doctor` が扱う範囲の template-managed surface に限定する。

## 対象ユーザー

- `doctor` で drift を確認した後に current templates へ戻したい maintainer
- v0.2.0 alpha CLI の update path を検証したい early adopter
- future profile-aware migration を実装する CLI developer

## スコープ（含む）

- `ai-check-template update` command を追加する
- `--target`, `--ci`, `--claude-hooks`, `--dry-run`, `--yes`, `--json` flags を提供する
- package scripts / shell scripts / selected CI workflows / optional Claude hooks を current templates に更新する
- `--dry-run` は planned operations を出力し、target を変更しない
- `--yes` なしの write attempt は拒否する
- update 後に `doctor` が pass することを tests で検証する
- README / README-ja / `docs/cli.md` / roadmap / Makefile / package tests を更新する

## スコープ外（明示的に除外）

- npm publish
- profile-aware migration
- custom user script の semantic merge
- external network checks
- `package-templates/**` の変更
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/update.mjs`（新規）
- `src/cli/index.mjs`（更新）
- `tests/cli/update.test.mjs`（新規）
- `tests/cli/package.test.mjs`（更新）
- `Makefile`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0019-cli-update-foundation.md`（新規）
- `plans/PLAN-0019-cli-update-foundation.md`（新規）
- `tasks/TASK-0072-cli-update-command.md`（新規）
- `tasks/TASK-0073-cli-update-tests.md`（新規）
- `tasks/TASK-0074-cli-update-docs-validation.md`（新規）
- `tasks/TASK-0075-verify-cli-update-foundation.md`（新規）

**変更禁止:**
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/**` を変更しない。update は repository CLI code / tests / docs の範囲に閉じる。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- `--yes` なしで target に書き込む
- `--dry-run` で target に書き込む
- `package-templates/**` を変更する
- npm publish を実行する
- target の secret / private data を出力する

## 要件

### 機能要件

- [FR-01] `node bin/ai-check-template.mjs update --help` が usage を表示する
- [FR-02] `update --target <dir> --ci none --yes` が package scripts と shell scripts を current templates に更新する
- [FR-03] `update --ci direct` は direct CI workflows を更新する
- [FR-04] `update --ci reusable` は reusable CI workflows を更新する
- [FR-05] `update --claude-hooks` は Claude rule file と settings hooks を更新する
- [FR-06] `update --dry-run` は planned operations を出力し、target を変更しない
- [FR-07] `update --json` は machine-readable operations を出力する
- [FR-08] `--yes` なしの write attempt は non-zero exit で拒否する

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] update は known template-managed files / scripts のみに書き込む
- [NFR-03] operation output は relative path と action を含む

### セキュリティ要件

- [SEC-01] target file contents を丸ごと出力しない
- [SEC-02] invalid target path は clear error で reject する
- [SEC-03] CLI code / docs / tests に secret 直書きパターンを含めない

### 運用要件

- [OPS-01] PR #14 は update foundation のみを扱う
- [OPS-02] profile-aware migration は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | `test -f`, docs grep, Makefile checks |
| Gate 2: Functional | AC-04, AC-05, AC-06, AC-07, AC-08 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-09, AC-10, AC-11 | dry-run / yes guard / secret grep |
| Gate 4: Architecture | AC-12 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/update.mjs` が存在し、top-level help に `update` が表示される
- [x] AC-02: `docs/cli.md`, README, README-ja, roadmap が `update` に言及する
- [x] AC-03: `make validate` が update tests を実行する
- [x] AC-04: tests が drifted target の package scripts / shell scripts を更新し、doctor pass になることを検証する
- [x] AC-05: tests が `--ci direct`, `--ci reusable`, `--claude-hooks` update を検証する
- [x] AC-06: tests が `--dry-run` で target を変更しないことを検証する
- [x] AC-07: tests が `--json` output を parse できることを検証する
- [x] AC-08: package tests が tarball に `src/cli/update.mjs` が含まれることを検証する

### 異常系

- [x] AC-09: tests が `--yes` なしの write attempt を reject することを検証する
- [x] AC-10: tests が update が known managed paths 以外を変更しないことを検証する
- [x] AC-11: CLI code / docs / tests に secret 直書きパターンがない
- [x] AC-12: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: target に `package.json` がない → update は clear error で失敗する
- 想定エラー2: `--yes` なしで実行 → update は write を拒否する
- 想定エラー3: `--dry-run --json` → JSON operations を返し、write しない
- 境界ケース1: `--ci none` → CI workflow update を skip する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | command dispatch / help を修正 |
| AC-02 | docs / README / roadmap に update 導線を追加 |
| AC-03 | Makefile validation を修正 |
| AC-04 | scripts / shell file update logic を修正 |
| AC-05 | CI / Claude optional update mapping を修正 |
| AC-06 | dry-run write path を削除 |
| AC-07 | JSON output schema を修正 |
| AC-08 | package test expected files を更新 |
| AC-09 | `--yes` guard を修正 |
| AC-10 | write set を known managed paths に限定 |
| AC-11 | secret-like literal を削除 |
| AC-12 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| update false positive / destructive write | `sage/failures.md` | maintainer |
| dry-run write bug | `sage/anti-patterns.md` 昇格候補 | maintainer |
| doctor-after-update failure | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで update failure を確認する。
2. 記録: maintainer が command、target fixture、expected operation、actual output を `sage/failures.md` に記録する。
3. 昇格: 同種の destructive write / dry-run bug が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template update`
- npm: package contents only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: update が user customization を上書きする → known template-managed files / scripts のみ、`--yes` 必須、dry-run test で軽減
- リスク2: update scope が migration に膨らむ → profile-aware migration は follow-up に分離
- リスク3: doctor と update の判定がずれる → update 後 doctor pass test で軽減

## 実装メモ

- No dependencies. Use Node stdlib only.
- `update` writes current package templates to known managed paths only.
- `update` exit code: success = 0, invalid target or refused write = 1.
- JSON schema: `{ "status": "updated" | "dry-run", "target": "...", "operations": [...] }`.

## Properties

### Invariants

- [INV-01] (Gate 3) update never writes without `--yes` unless `--dry-run`
- [INV-02] (Gate 3) `--dry-run` writes nothing
- [INV-03] (Gate 4) `package-templates/**` content is not modified
- [INV-04] (Gate 2) update after drift can make doctor pass

### Pre-conditions

- [PRE-01] (Gate 2) Target project has `package.json`
- [PRE-02] (Gate 2) SPEC-0018 doctor foundation exists

### Post-conditions

- [POST-01] (Gate 2) target template-managed files/scripts match current templates
- [POST-02] (Gate 1) update docs are discoverable from CLI docs and README

### Assumptions

- [ASM-01] (Gate 横断) exact replacement is acceptable for template-managed files
- [ASM-02] (Gate 横断) profile-aware migration will be implemented later

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0019 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0019 と TASK-0072..0075 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-12 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| drift repair | drifted fixture update then doctor pass |
| dry-run safety | before / after target snapshot unchanged |
| guarded writes | update without `--yes` rejects |
| validation | `make validate` pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる update code / tests / docs / Makefile / SAGE artifacts を revert する。`init`, `doctor`, and package templates には影響しない。

## 関連ID

- PLAN-ID: PLAN-0019
- TASK-ID: TASK-0072, TASK-0073, TASK-0074, TASK-0075
