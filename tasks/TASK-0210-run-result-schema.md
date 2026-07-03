# TASK-0210: run-result.schema.json 新規作成 + run --json 実出力の回帰ガードテスト

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0210 |
| SPEC-ID   | SPEC-0059 |
| PLAN-ID   | PLAN-0059 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | Yes（TASK-0211 と並列可） |
| 依存TASK  | なし |
| 見積     | 2h |

## 責務

`run --json` の現行出力（SPEC-0049 + SPEC-0058: step の `index`/`name`/`source`/`command`/`status`/`exitCode`/`durationMs`/`stdout`/`stderr`、ルートの `status`/`script`/`command`/`startedAt`/`durationMs`/`configPath`/`steps`）を JSON Schema `package-templates/docs/run-result.schema.json`（draft 2020-12、`additionalProperties` 不許容の厳格形）として固定し、実出力との照合回帰ガードテストを常設する（SPEC T1 / FR-09 / INV-06）。

## 入力

- SPEC-0059 FR-09、AC-07、契約 (3)、実装メモ「tests/cli/run-schema.test.mjs」節、リスク2
- 現行出力の一次情報源: `src/cli/run.mjs`（**読むだけで変更しない**）と既存 `tests/cli/run.test.mjs` の期待値
- 既存 schema の書式前例: `package-templates/docs/ac-test-matrix.schema.json`（`$schema` / `$id` / 厳格形）
- スキーマ照合は validator ライブラリを使わず、`run --json` 実出力のキー集合・型を schema の `properties` / `required` と突き合わせる小さな再帰比較を自前実装する（NFR-02）

## 出力

- `package-templates/docs/run-result.schema.json`: 必須フィールド・型・`status` 許容値（`PASS`/`FAIL`/`SKIPPED` 等）を固定した初版スキーマ
- `tests/cli/run-schema.test.mjs`: 一時プロジェクトで `run --json` を config 有り / config 無しの両経路で実行し、実出力がスキーマの必須フィールド・型・許容値に適合し、かつスキーマに無いフィールドが出力に存在しないことを検証する（AC-07。テストケース名は日本語 + AC-N 参照コメント）

## File Scope（変更許可範囲）

- 作成: `package-templates/docs/run-result.schema.json`, `tests/cli/run-schema.test.mjs`
- 変更: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `src/cli/run.mjs` の変更禁止 — run の出力契約はスキーマ固定の対象であって変更対象ではない（SPEC File Scope / AP-03）
- JSON Schema validation のための npm 依存（ajv / zod 等）追加禁止（NFR-02、検出: TASK-0214 の dependencies 検査）
- `run` 結果 JSON の既存フィールドの削除・改名・型変更をスキーマに反映することの禁止 — 現行実出力を additive only の基準として固定する（検出: AC-07 テスト自身）
- 実出力とスキーマの不一致をテスト側の緩和（部分照合・キー除外）で吸収することの禁止（src-rules.md「Modify tests to make them pass」）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止

## 完了条件

- [ ] 実装中に想定外エラー（run 実出力とドキュメント上の契約の乖離発見等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-07: config 経路・default 経路の両方で `run --json` 実出力がスキーマの必須フィールド・型・許容値に適合し、スキーマに無いフィールドが出力に存在しないテストがパスする（INV-06 / FR-09）
- [ ] `node --test tests/cli/run-schema.test.mjs` が全件パスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、既存テスト非破壊）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0210 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0059-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
