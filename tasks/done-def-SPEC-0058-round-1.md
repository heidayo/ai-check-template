# Done Definition: SPEC-0058 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0057 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0058
- PLAN-ID: PLAN-0058
- TASK-ID: TASK-0206, TASK-0207, TASK-0208, TASK-0209
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0058 AC-01〜AC-09）

### Structural Gate

- [ ] `git diff --check` が pass する
- [ ] 各 TASK の File Scope 外の変更がない
- [ ] commit message に TASK-ID を含める
- [ ] AC-09: `npm pack --dry-run` / `make validate` が壊れず、pack 内容に `src/cli/check-config.mjs` が含まれ `.ai-check.yaml` / `.ai-check.json` という実ファイルが含まれない

### Functional Gate

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 run/expect/managed-files テスト含む）
- [ ] AC-02: config 不在で `run --script ai:check --json` の実行コマンド列・exit code・既存 JSON フィールド値が適用前と同一、`configPath: null`・全 step `source: "default"`（NFR-01 / INV-02）
- [ ] AC-03: `full` gate 3 step（`enabled: false` 1 件、`command` 省略 1 件）の `.ai-check.yaml` で宣言順に有効 step のみ実行、無効 step `SKIPPED`、全 step `source: "config"`、`configPath` が `.ai-check.yaml`（FR-04 / POST-01 / POST-02 / INV-05）
- [ ] AC-04: 同一スキーマの `.ai-check.json` で AC-03 と同じ解決結果（YAML/JSON 等価）、両ファイル併存時は CliError で非 0 終了（想定エラー4）
- [ ] AC-05: validation 違反 6 ケース（不正 YAML / `version` 欠落 / 未知キー / 未知 gate 値 / 空 `command` / 重複 step 名）でステップ 0 件実行 + 対象ファイル名入りエラーで非 0 終了（FR-07 / INV-03）
- [ ] AC-06: config に無い gate は package script フォールバックで全 step `source: "default"`、非 3 ゲート `--script` では config 非参照（FR-03 / FR-05）
- [ ] 異常系: `command` 省略かつ package script 不在で step 名入り CliError（想定エラー2）/ サブセット外 YAML は `.ai-check.json` 案内付きエラー（想定エラー1 / OPS-02）/ 全 step 無効の gate は実行 0 件・`status: "PASS"`（境界ケース1）
- [ ] NFR-03: config 前処理時間が不在時 10ms 未満 / 存在時 50ms 未満（閾値超過は WARN 非ブロッキング）
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）

### Security Gate

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli tests/cli docs/cli.md` が新規 unfinished marker を検出しない
- [ ] NFR-02: 新規 npm 依存を追加していない（`package.json` に `dependencies` が不在または空 — `tests/cli/package.test.mjs` で機械検証）
- [ ] AC-07: config 由来 step の stdout の secret パターンが `--json` 結果で `[REDACTED]` 化されている（SEC-02 / INV-04 / FR-06）
- [ ] SEC-01 / SEC-02: docs/cli.md の config ガイドに「コミットされた command がそのまま実行される」旨と secret 直書き禁止（env var / secret manager 経由）の案内があり、docs に secret 直書き例がない

### Architecture Gate

- [ ] AC-08: `getManagedFiles()` の全 profile / オプション組合せで `.ai-check.yaml` / `.ai-check.json` が非包含（FR-08 / INV-01、回帰テスト常設）
- [ ] `src/cli/managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` / `package-templates/` を変更していない（SPEC File Scope / INV-06）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] docs/cli.md に config スキーマ version 1・フォールバック規則・YAML サブセット許容構文・境界ケース1 の CI 非推奨が記載され、run JSON フィールド説明に `name` / `source` / `configPath` が追記されている（OPS-01 / 契約）

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
