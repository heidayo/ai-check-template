# TASK-0207: run への config 統合と `--json` 拡張

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0207 |
| SPEC-ID   | SPEC-0058 |
| PLAN-ID   | PLAN-0058 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No |
| 依存TASK  | TASK-0206 |
| 見積     | 3h |

## 責務

`src/cli/run.mjs` に `check-config.mjs`（TASK-0206）を統合し、gate 該当時の実行ステップ列を config の宣言順リストで全置換（`command` 省略時は package script 名参照、`enabled: false` は `SKIPPED` — FR-04）、非該当時は package script フォールバック（FR-05）とする。結果 JSON に step `name` / `source`、ルート `configPath` を追加し（FR-06 / OPS-01）、`src/cli/index.mjs` の run usage ヘルプへ config 記述を追記する。`tests/cli/run.test.mjs` を更新する（SPEC T2）。

## 入力

- SPEC-0058 FR-01 / FR-03〜FR-06、AC-02 / AC-03 / AC-06 / AC-07、NFR-01 / NFR-03、INV-02 / INV-04 / INV-05、POST-01 / POST-02、想定エラー2、境界ケース1、契約（additive only）
- `src/cli/run.mjs` の現行構造: `executeScript()` / `splitCommandChain()` / `redact()`。config 統合は steps 構築部の手前に差し込む（`executeScript()` へ steps 配列を渡す小リファクタ許容 — SPEC 実装メモ、PLAN 実装リスク7）
- default 由来 step の `name` は `step-<index>`（SPEC 実装メモ）
- 既存テストの steps フィールド集合依存 → `name`/`source`/`configPath` 追加に伴う期待値更新が必要（SPEC「既存実装との衝突点」）

## 出力

- config 該当 gate で宣言順・SKIPPED・`source: "config"`・`configPath` 相対パスとなる run 実行（AC-03）
- config 不在 / 非該当 gate / 非 3 ゲート script で現行同一 + `source: "default"`・`configPath: null` となる run 実行（AC-02 / AC-06）
- `command` 省略かつ package script 不在時の CliError（想定エラー2 — 未知 step 名を黙って skip しない）
- config 由来 step の stdout/stderr が既存 `redact()` を通るテスト（AC-07 / SEC-02）
- `index.mjs` run usage の config 記述

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/run.mjs`, `src/cli/index.mjs`, `tests/cli/run.test.mjs`
- 削除: なし

## 禁止事項

- 結果 JSON の既存フィールドの削除・改名・型変更禁止（additive only — SPEC Forbidden Shortcuts、検出: AC-02）
- config 由来 step の出力で既存 `redact()` を迂回することの禁止（SPEC Forbidden Shortcuts、検出: AC-07）
- config のパース・validation 失敗時の silent フォールバック禁止（SPEC Forbidden Shortcuts、検出: AC-05 — ステップ 0 件実行 + 非 0 終了）
- `check-config.mjs` の責務（パース・validation）の run.mjs への重複実装禁止（TASK-0206 の export を使う）
- `managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` / `package-templates/` への変更禁止（SPEC File Scope 外 — AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止。リファクタが File Scope を超える場合は SPEC 改訂を起票（Error Resolution Protocol）

## 完了条件

- [ ] 実装中に想定外エラー（既存期待値の想定外破壊等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）

- [ ] AC-02: config 不在で `run --script ai:check --json` の実行コマンド列・exit code・既存 JSON フィールド値が適用前と同一、`configPath: null`・全 step `source: "default"` のテストがパスする（NFR-01 / INV-02）
- [ ] AC-03: `full` gate に 3 step（`enabled: false` 1 件、`command` 省略 1 件）の `.ai-check.yaml` で、宣言順に有効 step のみ実行・無効 step `SKIPPED`・全 step `source: "config"`・`configPath` が `.ai-check.yaml` のテストがパスする（FR-04 / POST-01 / POST-02 / INV-05）
- [ ] AC-06: config に無い gate は package script フォールバックで全 step `source: "default"`、非 3 ゲート `--script` では config 非参照のテストがパスする（FR-03 / FR-05）
- [ ] AC-07: config 由来 step の stdout の secret パターンが `--json` 結果で `[REDACTED]` 化されるテストがパスする（FR-06 / SEC-02 / INV-04）
- [ ] 想定エラー2: `command` 省略かつ package script 不在で step 名入り CliError となるテストがパスする
- [ ] 境界ケース1: 全 step `enabled: false` の gate で実行 0 件・全 `SKIPPED`・結果 `status: "PASS"` のテストがパスする
- [ ] NFR-03: config 前処理時間（不在時 10ms 未満 / 存在時 50ms 未満、20 step 規模）を計測し、閾値超過は WARN 非ブロッキングとして記録する（ローカル計測時は run log に環境差異を記録）
- [ ] `node --test tests/cli/run.test.mjs` が全件パスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0207 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0058-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
