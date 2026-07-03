# TASK-0211: AC schema への step 追加 + expect の step 許容・validation export 化

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0211 |
| SPEC-ID   | SPEC-0059 |
| PLAN-ID   | PLAN-0059 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | Yes（TASK-0210 と並列可） |
| 依存TASK  | なし |
| 見積     | 2h |

## 責務

`package-templates/docs/ac-test-matrix.schema.json` に `acceptanceCriteria[].step`（任意、`minLength: 1` の string）を additive 追加し、example 2 ファイルに `step` 記載例を追加する。`src/cli/expect.mjs` は (a) `step` があれば非空文字列とする validation を追加、(b) `report`（TASK-0212）から再利用できるよう `validateExpectationFile()` 相当を export 化する。既存挙動は不変（SPEC T2 / FR-08 / NFR-01）。

## 入力

- SPEC-0059 FR-02 / FR-08、AC-08、NFR-01、実装メモ「expect.mjs の再利用」節、既存実装との衝突点
- `src/cli/expect.mjs` 現状: `validateExpectationFile()` / `parseExpectationContent()` / `validateExpectation()` は非 export、`requireString()` は必須フィールド用のため任意フィールド `step` には別分岐が必要
- `step` 空文字列は新 issue コード（例: `invalid-step`）として issue 化。既存 issue コード・既存ケースの期待値は不変

## 出力

- `package-templates/docs/ac-test-matrix.schema.json`: `acceptanceCriteria[].step` 追加（他は不変）
- `package-templates/docs/ac-test-matrix.example.json` / `ac-test-matrix.example.yaml`: `step` の記載例（一部 AC のみに付与し、任意であることが例から読めること）
- `src/cli/expect.mjs`: `step` 許容 validation + 再利用 export（既存 `runExpect` の挙動不変）
- `tests/cli/expect.test.mjs`: `step` 有り/無し両ファイルが pass・`step` 空文字列が issue になる追加ケース（AC-08。既存ケースは無修正）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `package-templates/docs/ac-test-matrix.schema.json`, `package-templates/docs/ac-test-matrix.example.json`, `package-templates/docs/ac-test-matrix.example.yaml`, `src/cli/expect.mjs`, `tests/cli/expect.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `expect` の既存挙動を変える変更の禁止 — 変更は export 化と `step` 許容のみ（NFR-01、検出: AC-01 既存テストの無修正期待値部分の pass 継続）
- `ac-test-matrix.schema.json` の既存フィールドの削除・改名・型変更・必須化の禁止（additive only、検出: AC-08 の `step` 無しファイル pass テスト）
- `parseTemplateYaml()` 等のパーサ共通化・再構成リファクタ禁止（本 TASK の責務外 — AP-03 Silent Scope Expansion）
- `report.mjs` / `index.mjs` の作成・変更禁止（TASK-0212 / TASK-0213 の責務）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装中に想定外エラーが発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-08: `step` 有り/無し両方の AC/Test Matrix ファイル（JSON / template-subset YAML）が `expect` で pass し、`step` が空文字列の場合は issue になるテストがパスする（FR-08）
- [ ] 既存 `tests/cli/expect.test.mjs` の既存ケースが無修正期待値部分でパスし続ける（NFR-01 / AC-01）
- [ ] `report.mjs` から import 可能な validation export が存在する（FR-02 の前提。`node -e "import(...)"` で解決確認）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] 各テストケースに AC-N / FR-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0211 を含める（commit-msg hook で強制）

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
