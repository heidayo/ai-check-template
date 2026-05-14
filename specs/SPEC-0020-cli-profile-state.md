# SPEC-0020: CLI profile state foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0020 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0015, SPEC-0018, SPEC-0019 |
| 権限レベル | platform |

## 背景・目的

SPEC-0015 で `init`、SPEC-0018 で `doctor`、SPEC-0019 で `update` の foundation が入ったが、導入時に選んだ profile / CI mode / Claude hooks の選択は target project に保存されていない。そのため、`doctor` / `update` は利用者が毎回同じ flags を指定する必要があり、future profile-aware migration の入力も残らない。

本 SPEC は `.ai-check-template.json` install state を導入し、`init` が導入時 metadata を保存し、`doctor` / `update` がその state を default として使えるようにする。これにより v0.2.0 の profile-aware diagnostics / update migration の土台を作る。

## 対象ユーザー

- `init` 後に同じ profile / CI mode で `doctor` / `update` を実行したい early adopter
- future profile-aware migration を実装する CLI developer
- 導入済み project の template state を review したい maintainer

## スコープ（含む）

- target project root に `.ai-check-template.json` install state を作成・更新する
- install state schema v1 を Node stdlib のみで読み書きする
- `init` が `--profile`, `--ci`, `--claude-hooks` の選択を install state に保存する
- `doctor` が install state を読み、明示 flag がない場合は state の `profile`, `ci`, `claudeHooks` を default として使う
- `update` が install state を読み、明示 flag がない場合は state の値を default として使い、write 成功時に state を refresh する
- `doctor --json` / `update --json` が install state source と effective options を machine-readable に出力する
- malformed / unsupported install state を `doctor` で issue として報告し、`update` では write 前に拒否する
- README / README-ja / `docs/cli.md` / roadmap / package tests / CLI tests を更新する

## スコープ外（明示的に除外）

- npm publish / `npx` 実行
- per-profile template content の変更
- profile-specific migration rules
- package manager detection
- remote registry / GitHub network checks
- target project の dependency install
- `package-templates/**` の変更
- `.github/workflows/**`, `sage/**`, `.sage/**`, `templates/**`, `CLAUDE.md`, `.claude/**` の変更

## File Scope

**書き込み許可:**
- `src/cli/install-state.mjs`（新規）
- `src/cli/init.mjs`（更新）
- `src/cli/doctor.mjs`（更新）
- `src/cli/update.mjs`（更新）
- `tests/cli/init.test.mjs`（更新）
- `tests/cli/doctor.test.mjs`（更新）
- `tests/cli/update.test.mjs`（更新）
- `tests/cli/package.test.mjs`（更新）
- `docs/cli.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0020-cli-profile-state.md`（新規）
- `plans/PLAN-0020-cli-profile-state.md`（新規）
- `tasks/TASK-0076-install-state-init.md`（新規）
- `tasks/TASK-0077-state-aware-doctor-update.md`（新規）
- `tasks/TASK-0078-profile-state-tests-docs.md`（新規）
- `tasks/TASK-0079-verify-cli-profile-state.md`（新規）

**変更禁止:**
- `package.json`
- `package-templates/**`
- `.github/**`
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では repository の `CLAUDE.md` / `.claude/**` を変更しない。target project 内の `.claude/**` は既存 CLI behavior の optional managed output であり、この SPEC の repository write scope には含めない。

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- malformed install state を無視して write する
- `--dry-run` で target に書き込む
- state file に absolute target path / timestamp / secret-like value を保存する
- `package-templates/**` を変更する
- npm publish を実行する

## 要件

### 機能要件

- [FR-01] `init` は target root に `.ai-check-template.json` を作成する
- [FR-02] install state は `schemaVersion`, `packageName`, `packageVersion`, `profile`, `ci`, `claudeHooks`, `managedBy` を含む
- [FR-03] `doctor` は explicit `--ci`, `--profile`, `--claude-hooks` がない場合に install state を default として使う
- [FR-04] `update` は explicit `--ci`, `--profile`, `--claude-hooks` がない場合に install state を default として使う
- [FR-05] `update` は successful write 時に install state を current package metadata と effective options で refresh する
- [FR-06] `doctor --json` は `installation` と `effectiveOptions` を出力する
- [FR-07] `update --json` は `installation` と `effectiveOptions` を出力する
- [FR-08] explicit flags は install state より優先され、`update` は refreshed state に反映する
- [FR-09] malformed / unsupported install state は clear error または issue として扱う

### 非機能要件

- [NFR-01] runtime dependencies は追加しない
- [NFR-02] install state は deterministic JSON とし、timestamp / absolute path を保存しない
- [NFR-03] existing projects without install state remain usable with explicit CLI flags
- [NFR-04] CLI output は secret / private file content を含めない

### セキュリティ要件

- [SEC-01] install state に secret-like values, absolute target path, environment values を保存しない
- [SEC-02] malformed install state は `update` write 前に reject する
- [SEC-03] `doctor` は read-only を維持し、state issue 検出時も target を変更しない
- [SEC-04] CLI code / docs / tests に secret 直書きパターンを含めない

### 運用要件

- [OPS-01] PR は profile state foundation のみを扱う
- [OPS-02] profile-specific migration は follow-up SPEC に分離する
- [OPS-03] CI failure は同一 branch で修正し、`make validate` と GitHub Actions 再実行で閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03 | `test -f`, package pack test, docs grep |
| Gate 2: Functional | AC-04, AC-05, AC-06, AC-07, AC-08 | `node --test tests/cli/*.test.mjs` |
| Gate 3: Security | AC-09, AC-10, AC-11 | malformed state tests, dry-run snapshot, secret grep |
| Gate 4: Architecture | AC-12 | File Scope / protected file check |
| Gate 5: Release | N/A | npm publish は scope 外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `src/cli/install-state.mjs` が存在し、`npm pack --dry-run --json` の required files に含まれる
- [x] AC-02: `init --profile react-nextjs+supabase-rls --ci reusable --claude-hooks --yes` が `.ai-check-template.json` を作成し、schema v1 / package metadata / profile / ci / claudeHooks を保存する
- [x] AC-03: README, README-ja, `docs/cli.md`, roadmap が install state と profile-aware foundation に言及する
- [x] AC-04: `doctor` は install state の `ci: reusable` を default として使い、`--ci` なしで reusable CI target を pass する
- [x] AC-05: `doctor --json` output が parse 可能で、`installation.source` と `effectiveOptions` を含む
- [x] AC-06: `update` は install state の defaults を使い、drifted reusable CI target を `--ci` なしで repair し、doctor pass に戻す
- [x] AC-07: `update --dry-run --json` は state refresh operation を報告し、target snapshot を変更しない
- [x] AC-08: explicit `--profile`, `--ci`, `--claude-hooks` は state より優先され、successful update 後の state に反映される

### 異常系

- [x] AC-09: malformed `.ai-check-template.json` は `doctor` では issue として報告され、`update` では write 前に non-zero で拒否される
- [x] AC-10: `doctor` は malformed state 検出時も target snapshot を変更しない
- [x] AC-11: CLI code / docs / tests に secret 直書きパターンがなく、state schema に absolute path / timestamp がない
- [x] AC-12: 変更ファイルが File Scope 内のみで、protected files と `package-templates/**` に変更がない

## 異常系

- 想定エラー1: `.ai-check-template.json` が invalid JSON → `doctor` は `invalid-install-state` issue、`update` は write 前に reject
- 想定エラー2: `schemaVersion` が unsupported → `doctor` は `unsupported-install-state` issue、`update` は write 前に reject
- 想定エラー3: state の profile が invalid → `doctor` は issue、`update` は reject
- 境界ケース1: state がない existing target → explicit flags または legacy defaults で従来どおり実行できる

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | package test required files と `src/cli/install-state.mjs` を修正 |
| AC-02 | `init` の state write path / schema builder を修正 |
| AC-03 | docs / README / roadmap に state 説明を追加 |
| AC-04 | `doctor` option resolution と state default handling を修正 |
| AC-05 | `doctor --json` schema を修正 |
| AC-06 | `update` option resolution と reusable CI mapping を修正 |
| AC-07 | dry-run branch と operation list を修正 |
| AC-08 | explicit override precedence と state refresh を修正 |
| AC-09 | state parser validation と update guard を修正 |
| AC-10 | doctor read-only snapshot test を修正 |
| AC-11 | secret grep / schema fields を修正 |
| AC-12 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| install state false positive / false negative | `sage/failures.md` | maintainer |
| update writes with malformed state | `sage/anti-patterns.md` 昇格候補 | maintainer |
| profile default mismatch | `sage/failures.md` | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: CLI test、PR CI、external dogfooding のいずれかで state handling failure を確認する。
2. 記録: maintainer が command、state JSON、expected effective options、actual output を `sage/failures.md` に記録する。
3. 昇格: malformed state write bug または state/default mismatch が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `ai-check-template init`, `ai-check-template doctor`, `ai-check-template update`
- File contract: target root `.ai-check-template.json` schema v1
- npm: package contents only, publish なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: stale state が user intent とずれる → explicit flags override を優先し、docs に上書き手順を明記
- リスク2: malformed state のまま update が write する → update は state parse failure を write 前に reject
- リスク3: state schema が将来 migration の制約になる → `schemaVersion` を必須化し、profile-specific migration は follow-up に分離

## 実装メモ

- No dependencies. Use Node stdlib only.
- `.ai-check-template.json` は target project の managed metadata として扱う。
- Proposed schema:

```json
{
  "schemaVersion": 1,
  "packageName": "ai-check-template",
  "packageVersion": "0.2.0-alpha.0",
  "profile": {
    "base": "react-nextjs",
    "addons": ["supabase-rls"],
    "all": ["react-nextjs", "supabase-rls"]
  },
  "ci": "reusable",
  "claudeHooks": true,
  "managedBy": "ai-check-template"
}
```

## Properties

### Invariants

- [INV-01] (Gate 3) `doctor` never writes target files, including install state
- [INV-02] (Gate 3) `update` never writes with malformed / unsupported install state
- [INV-03] (Gate 3) `--dry-run` writes nothing, including `.ai-check-template.json`
- [INV-04] (Gate 4) `package-templates/**` content is not modified
- [INV-05] (Gate 2) explicit CLI flags override install state defaults

### Pre-conditions

- [PRE-01] (Gate 2) Target project has `package.json`
- [PRE-02] (Gate 2) SPEC-0015 init, SPEC-0018 doctor, and SPEC-0019 update foundations exist
- [PRE-03] (Gate 2) Existing targets without install state may still run with legacy defaults or explicit flags

### Post-conditions

- [POST-01] (Gate 2) `init` creates deterministic install state
- [POST-02] (Gate 2) `doctor` / `update` can derive defaults from install state
- [POST-03] (Gate 1) state docs are discoverable from CLI docs and README

### Assumptions

- [ASM-01] (Gate 横断) one install state file at target root is sufficient for v0.2.0 alpha
- [ASM-02] (Gate 横断) profile-specific migration rules will be implemented later

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0020 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0020 と TASK-0076..0079 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-12 全 pass | `make validate` + `node --test tests/cli/*.test.mjs` + AC commands |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| state creation | init fixture has deterministic `.ai-check-template.json` |
| state-aware diagnostics | doctor passes reusable target without explicit `--ci` |
| state-aware update | update repairs reusable target without explicit `--ci` |
| dry-run safety | before / after target snapshot unchanged |
| validation | `make validate` pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる install state code / tests / docs / SAGE artifacts を revert する。既存 `init`, `doctor`, `update` の pre-state behavior は legacy defaults と explicit flags で維持する。

## 関連ID

- PLAN-ID: PLAN-0020
- TASK-ID: TASK-0076, TASK-0077, TASK-0078, TASK-0079
