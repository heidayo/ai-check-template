# TASK-0206: check-config モジュール新規作成（検出・パース・validation・gate 解決）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0206 |
| SPEC-ID   | SPEC-0058 |
| PLAN-ID   | PLAN-0058 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | Yes（TASK-0208 と並列可） |
| 依存TASK  | なし |
| 見積     | 3h |

## 責務

`src/cli/check-config.mjs` を新規作成し、`.ai-check.yaml` / `.ai-check.json` の検出（YAML 優先、併存はエラー — 想定エラー4）、FR-02 スキーマ version 1 の YAML サブセット / JSON パース、FR-07 の fail-fast validation（OPS-02 の是正ヒント付き CliError）、gate 名 ↔ script 名の解決（FR-03）を提供する。unit テスト `tests/cli/check-config.test.mjs` を併設する（SPEC T1）。

## 入力

- SPEC-0058 FR-01〜FR-03 / FR-07、AC-04 / AC-05、想定エラー1〜4、OPS-02、NFR-02 / NFR-03、PRE-01
- YAML サブセットパーサ前例: `src/cli/expect.mjs` `parseTemplateYaml()` / `splitYamlKeyValue()`（ASM-03。共通化はせず同型の独立実装 — SPEC 実装メモ）
- 許容 YAML 構文: version 行 + `steps:` + step 名キー + ネストしたスカラー `key: value` + `gates` インライン配列 `[fast, full]` のみ。サブセット外は `.ai-check.json` 案内付きエラー（リスク2）
- gate マップ: `full: "ai:check"` / `fast: "ai:check:fast"` / `secure: "ai:check:secure"` の定数（FR-03、`--script` 値からの逆引き）
- 既存 utils: `pathExists` / `readJson` 等を再利用（NFR-03: 不在チェックは存在チェック 2 回のみ）、エラーは既存 CliError 規約

## 出力

- `src/cli/check-config.mjs`: config 検出 + パース + validation + gate 解決の export（run.mjs（TASK-0207）から呼べる形）
- `tests/cli/check-config.test.mjs`: AC-05 の validation 全ケース（不正 YAML、`version` 欠落/1 以外、未知最上位キー、step 型不正・未知キー・未知 gate 値、空 `command`、識別子規則違反・重複 step 名）と AC-04 の YAML/JSON 等価解決・併存 CliError の unit テスト（テストケース名は日本語 + AC-N 参照コメント）

## File Scope（変更許可範囲）

- 作成: `src/cli/check-config.mjs`, `tests/cli/check-config.test.mjs`
- 変更: なし
- 削除: なし

## 禁止事項

- YAML パーサのための npm 依存（`yaml` / `js-yaml` 等）追加禁止（NFR-02 / SPEC Forbidden Shortcuts、検出: TASK-0208 の dependencies 検査）
- validation 失敗時の default 動作への silent フォールバック禁止 — 必ず CliError で非 0 終了（SPEC Forbidden Shortcuts、検出: AC-05）
- `.ai-check.yaml` / `.ai-check.json` という実ファイルのリポジトリ追加禁止（テストは一時ディレクトリに生成 — SPEC 実装ルール）
- `process.exit` 直呼び・console 直書き禁止（CliError で表現 — SPEC 実装ルール）
- `run.mjs` / `index.mjs` への変更禁止（TASK-0207 の責務 — AP-03）、`expect.mjs` のパーサ共通化リファクタ禁止（SPEC 実装メモ: 重複 3 例目で検討）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装中に想定外エラー（サブセットパースの想定外ケース等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol、想定エラー1〜3 参照）

- [ ] AC-05: 6 種の validation 違反ケースそれぞれで、対象ファイル名入り CliError となる unit テストがパスする（FR-07 / INV-03 / OPS-02）
- [ ] AC-04（unit 部分）: 同一スキーマの `.ai-check.yaml` と `.ai-check.json` が等価に解決され、併存時は両ファイル名 + 「片方を削除する」案内付き CliError となるテストがパスする（想定エラー4）
- [ ] サブセット外 YAML 構造の検出エラーに `.ai-check.json` 案内が含まれるテストがパスする（想定エラー1 / OPS-02 / リスク2）
- [ ] `node --test tests/cli/check-config.test.mjs` が全件パスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、既存テスト非破壊）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0206 を含める（commit-msg hook で強制）

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
