# TASK-0213: report CLI 統合 — 3 形式出力 + --strict + index 登録（T3b）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0213 |
| SPEC-ID   | SPEC-0059 |
| PLAN-ID   | PLAN-0059 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No |
| 依存TASK  | TASK-0212（照合・判定コアの export を使用） |
| 見積     | 3h |

## 責務

`src/cli/report.mjs`（TASK-0212 完了後の逐次追記であり並行書き込みは想定しない） に CLI エントリ（arg 解析: `--expect` / `--run` 必須、`--format text|markdown|json`、`--json` 別名、`--strict`）と text / markdown / json の 3 形式出力を実装し、`src/cli/index.mjs` に `report` コマンドを登録・usage 追記する。integration テストを追加する（SPEC T3b — Evaluator 申し送りによる T3 分割の後半。依存 T3a → T3b）。

## 入力

- SPEC-0059 FR-01 / FR-02 / FR-06 / FR-07、AC-02 / AC-04 / AC-05 / AC-06（CLI 部）、SEC-01 / SEC-02、OPS-01 / OPS-02、POST-01 / POST-02、NFR-03 / NFR-04、契約 (1) の report JSON スキーマ（ルート `status`/`expectFile`/`runFile`/`summary`/`criteria[]`）
- TASK-0212 のコア export、TASK-0211 の expect validation export（FR-02: validation fail は既存 `expect` と同型の issue 一覧付き CliError）
- Markdown 出力: ヘッダ `| AC | 宣言内容 | 対応 step / コマンド | 判定 |`、セル内 `|` は `\|` エスケープ、criterion はトリミングしない、末尾に `検証済み N / 宣言 M` サマリ行（FR-06 / POST-02）
- exit code 規約: CliError で表現し `process.exit` 直呼びしない。`--strict` は FAIL/UNVERIFIED ≥1 で exit 1（レポート出力後 — FR-07 / POST-01）
- `index.mjs` の既存コマンド登録・USAGE 書式に合わせる

## 出力

- `src/cli/report.mjs`: CLI エントリ + 3 形式出力 + `--strict`（既存コア関数の変更は不整合修正の範囲のみ）
- `src/cli/index.mjs`: `report` 登録 + usage 追記
- `tests/cli/report.test.mjs`（追記）: AC-02（`--format json` の判定・対応 step・理由・サマリ）、AC-04（GFM 表 + サマリ行、`|` 含有セルでも表構造維持、stdout/stderr 非含有 — SEC-02）、AC-05（`--strict` の exit 1 / 0、`--strict` 無しの exit 0）、AC-06 CLI 部（(a) expect validation fail、(b) run JSON パース不能で照合結果を出力せず非 0 終了）、FR-01（フラグ欠落・未知 `--format` の usage 付きエラー、`--json` 別名）、境界ケース1（全 AC UNVERIFIED + `--strict` で exit 1）、NFR-03（AC 50 × step 50 で 200ms 未満、超過は WARN 非ブロッキング）の integration テスト

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/report.mjs`, `src/cli/index.mjs`, `tests/cli/report.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `report` の出力（text / markdown / json）に step の stdout / stderr を含めることの禁止（SEC-02、検出: AC-04 テスト）
- `report` 内からのコマンド実行・ファイル書き込みの禁止（SEC-01、検出: import grep 検査の維持）
- 入力不正時に silent に部分照合・部分レポートすることの禁止 — 照合結果を一切出力せず CliError で非 0 終了（INV-04、検出: AC-06 テスト）
- 照合コア（TASK-0212）への曖昧一致の追加禁止（検出: AC-03 テストの pass 継続）
- `report` JSON 出力の契約 (1) フィールドの削除・改名・型変更の禁止（additive only）
- `expect.mjs` / `run.mjs` / `doctor.mjs` / `managed-files.mjs` / `package-templates/` への変更禁止（AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] AC-06（CLI 部・全サブケース）: (a) expect validation fail、(b) run JSON パース不能、(c) run JSON 必須フィールド欠落、(d) step name 重複 — 各ケースを `report` CLI 実行経由の integration テストで検証し、照合結果を出力せず CliError で非 0 終了することを確認する

- [ ] 実装中に想定外エラーが発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol、想定エラー1〜4 参照）
- [ ] AC-02: PASS/FAIL/SKIPPED 混在 run 結果 + `step` 明示 AC で `report --format json` が各 AC の判定・対応 step 名・判定理由・サマリ件数を期待どおり出力するテストがパスする（OPS-01）
- [ ] AC-04: `--format markdown` が GFM 表 + サマリ行で、`|` 含有セルでも表構造が壊れず、stdout/stderr が含まれないテストがパスする（FR-06 / SEC-02 / INV-05 / POST-02）
- [ ] AC-05: FAIL/UNVERIFIED ≥1 で `--strict` が exit 1、全 PASS で exit 0、`--strict` 無しは同一入力で exit 0 のテストがパスする（FR-07 / POST-01）
- [ ] AC-06（CLI 部）: expect validation fail・run JSON パース不能それぞれで、照合結果を出力せずファイル名・原因入り CliError で非 0 終了するテストがパスする（FR-01〜FR-03 / OPS-02）
- [ ] FR-01: `--expect` / `--run` 欠落・未知 `--format` 値の usage 付きエラー、`--json` = `--format json` 別名のテストがパスする
- [ ] NFR-03: AC 50 × step 50 規模で 200ms 未満の計測テストがパスする（超過は WARN 非ブロッキング、run log に記録 — PLAN 実装リスク8）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、既存テスト非破壊）
- [ ] 各テストケースに AC-N / FR-N / INV-N / POST-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0213 を含める（commit-msg hook で強制）

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
