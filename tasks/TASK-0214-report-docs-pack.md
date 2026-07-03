# TASK-0214: pack / dependencies 検査 + PR template 案内 + report ドキュメント

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0214 |
| SPEC-ID   | SPEC-0059 |
| PLAN-ID   | PLAN-0059 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0213（`report` コマンドの実在 — 存在しない機能を docs で先に説明しない） |
| 見積     | 1.5h |

## 責務

(1) `tests/cli/package.test.mjs` に pack 内容（`run-result.schema.json` + 更新済み `ac-test-matrix.schema.json` 同梱）と runtime dependencies ゼロの検査を追記、(2) `package-templates/.github/PULL_REQUEST_TEMPLATE.md` Verification 節に `report --format markdown` 案内コメント 1 行を additive 追加、(3) `docs/cli.md` / `README.md` / `README-en.md` に `report` ガイド（照合規則・`step` フィールド・`--strict` の CI 例）を追記する（SPEC T4）。

## 入力

- SPEC-0059 AC-09 / AC-10、NFR-02、SEC-02、OPS-01〜OPS-03、想定エラー4（`step` typo → UNVERIFIED、`--strict` で検出される旨を docs に明記）、リスク1（docs では `step` 明示を推奨形として先に示す）、リスク3（PR template は 1 行 additive）
- 言語規約: `docs/cli.md` は英語（既存に合わせる）、`README.md` は日本語、`README-en.md` は英語。`README-ja.md` は stub のため対象外
- docs に載せる CI 例は `run --output` → `report --strict` の 2 コマンドパイプライン（ワンショット統合はスコープ外）。secret 直書き例を載せない

## 出力

- `tests/cli/package.test.mjs`: pack に `package-templates/docs/run-result.schema.json` が含まれ、`package.json` に runtime dependencies が存在しない検査（AC-09）
- `package-templates/.github/PULL_REQUEST_TEMPLATE.md`: Verification 節に `report --format markdown` の出力を貼る案内コメント 1 行
- `docs/cli.md` / `README.md` / `README-en.md`: `report` の使い方・照合規則（明示キーのみ・`ambiguous-command` の意味）・`step` フィールド・`--strict` CI 例・typo → UNVERIFIED 注記

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `tests/cli/package.test.mjs`, `package-templates/.github/PULL_REQUEST_TEMPLATE.md`, `docs/cli.md`, `README.md`, `README-en.md`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- PULL_REQUEST_TEMPLATE.md の既存内容の削除・改変禁止 — Verification 節への案内コメント 1 行の additive 追加のみ（リスク3、`src/cli/managed-files.mjs` の変更も禁止 — 既に managed 一覧に含まれる）
- CI テンプレート（`package-templates/ci/` / GitHub Actions workflows）への `report` 組み込み禁止 — docs に CI 例を示すのみ（スコープ外）
- docs に secret 直書き例・step の stdout/stderr を貼る例を載せることの禁止（SEC-02）
- 存在しないオプション・挙動の記載禁止 — 記載内容は TASK-0213 実装の実挙動と一致させる（AP-07）
- `src/cli/` 配下への変更禁止（実装 TASK の責務 — AP-03）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装中に想定外エラー（pack 内容の想定外差分等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-09: `npm pack --dry-run` の内容に `package-templates/docs/run-result.schema.json` と更新済み `ac-test-matrix.schema.json` が含まれ、`package.json` に runtime dependencies が存在しない検査テストがパスする（NFR-02）
- [ ] AC-10: `grep -q 'report' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットし、`grep -q 'report --format markdown' package-templates/.github/PULL_REQUEST_TEMPLATE.md` がヒットする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] `npm pack --dry-run` / `make validate` が壊れない
- [ ] 追加テストケースに AC-N / NFR-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0214 を含める（commit-msg hook で強制）

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
