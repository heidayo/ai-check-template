# TASK-0232: custom profile 定義解決モジュール（読込・パース・schema validation・解決）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0232 |
| SPEC-ID   | SPEC-0065 |
| PLAN-ID   | PLAN-0065 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0233 / TASK-0234 が本モジュールに依存する下位モジュール先行） |
| 依存TASK  | なし |
| 見積     | 4h |

## 責務

`src/cli/custom-profile.mjs` を新規作成し、custom profile 定義ファイルの読込・YAML サブセットパース・schema v1 validation・SEC-02 / SEC-03 検証・gate/support/deps の解決 / 正規化を集約する（SPEC T1、案A / FR-03 / FR-04）。built-in テーブル参照の手前で custom を解決する経路の実体で、`profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` の built-in テーブルを一切参照しない（INV-03）。検証・解決を `tests/cli/custom-profile.test.mjs`（新規）で固定する。

## 入力

- SPEC-0065 FR-03（定義ファイル読込・schema fail-fast）/ FR-04（built-in テーブル参照の手前の分岐）/ FR-05（gate/support/deps 解決）、SEC-02（パストラバーサル防止）/ SEC-03（name / step 名パターン）、NFR-02（新規依存ゼロ）/ NFR-04（分岐 (1)(2)(3 unit)(4 unit)）、AC-01 / AC-02 / AC-04 の unit 部分 / AC-03 の unit 部分 / AC-07 の SEC-02 / SEC-03 unit 部分、想定エラー2 / 4、契約 (3)、実装メモ「`src/cli/custom-profile.mjs` の責務」「YAML サブセットパーサ」節、INV-03 / INV-04 / INV-06、リスク1 / リスク2 / リスク5
- **`loadCustomProfile(targetDir, profileFilePath)` の順序**: (1) SEC-02 パス検証（`profileFilePath` は絶対パス・`..` セグメント拒否、`path.resolve(targetDir, profileFilePath)` の正規化後パスが `targetDir` 配下であること）→ (2) 拡張子判定（`.ai-check-profile.yaml` → YAML サブセットパーサ / `.ai-check-profile.json` → `JSON.parse`。拡張子が両者以外なら CliError）→ (3) schema v1 validation（下記）→ (4) 正規化 `{ name, filePath, definition: { gateScripts, supportScripts, devDependencies } }` を返す。全失敗は対象ファイル名と原因を含む CliError（部分読込のまま返さない = PRE-01）
- **schema v1（FR-03、`validateCheckConfig` 同方針の fail-fast）**: 最上位 `version: 1`（必須。欠落 / 1 以外は CliError）＋ `profile`（必須、mapping）。`profile.name`（必須、`[a-z][a-z0-9-]*` — SEC-03。built-in 名 `react-nextjs` 等との一致は上位の init/update/doctor で別途 CliError にするが、パターン検証自体はここ）、`profile.gateScripts`（必須、`ai:check` / `ai:check:fast` / `ai:check:secure` の 3 キーを網羅。各値はコマンド文字列 or step 名リスト）、`profile.supportScripts`（必須、step 名 `[a-z][a-z0-9:_-]*` → 非空コマンド文字列の mapping。gateScripts が参照する step 名の実体を含む）、`profile.devDependencies`（省略可、非空文字列の配列）。未知の最上位キー / `profile` 直下キー・型不正・gate 3 種の欠落・step 名規則違反・gateScripts が参照する step 実体が supportScripts に無い、のいずれかで CliError
- **`resolveCustomProfileScripts(definition, { packageManager })`**: gate scripts の PM 別描画（既存 `renderScriptCommand` の `pnpm <step>` → PM 別変換方針に合わせる。`profile-scripts.mjs` を import して流用するか同方針で書くかは実装判断。built-in テーブルは参照しない）+ support scripts を返す。返り値は `{ gateScripts, supportScripts }` 相当で、init/update の merge にそのまま渡せる形
- **YAML サブセットパーサ**: `check-config.mjs` の `parseConfigYaml` と同構造（version 行 + mapping + scalar / inline array）だが対象が `profile:` mapping + `gateScripts:` / `supportScripts:` の mapping + `devDependencies:` の list のため、**`parseConfigYaml` をそのまま流用せず同方針で独立実装**する（`expect.mjs` が別実装なのと同じ判断 — 実装メモ）。サブセット外の構造は `.ai-check-profile.json` 案内付きで CliError
- exit code 規約: `CliError` で表現し `process.exit` 直呼びをしない

## 出力

- `src/cli/custom-profile.mjs`（新規）: `loadCustomProfile` / `resolveCustomProfileScripts` + SEC-02 パス検証・SEC-03 name / step パターン検証・YAML サブセットパーサ
- `tests/cli/custom-profile.test.mjs`（新規）: AC-01（`.yaml` / `.json` 両経路の読込 + gate/support/deps 解決、YAML サブセット外は `.json` で等価）、AC-02（`version` 欠落 / 1 以外・`profile` 欠落・`name` 規則違反・gate 3 種いずれか欠落・`supportScripts` 欠落 / 参照 step 実体欠落・未知キー・型不正 の各 CliError）、AC-04 unit（`custom:` なし・`custom:<name>` 規則違反・定義 `profile.name` 不一致の検証点。ただし `custom:<name>` パースと built-in 名併用の判定は TASK-0234 の CLI 統合で最終確認）、AC-03 unit（`resolveCustomProfileScripts` が定義由来の**非空** gate + support scripts を返し、built-in テーブルを参照していない）、AC-07 unit（絶対パス・`..` 入り `profileFilePath`・シェルメタ文字入り `name` / step 名の各 CliError = SEC-02 / SEC-03）。テストケース名は日本語 + AC-N / FR-N / SEC-N 参照コメント（NFR-04 分岐 (1)(2)(3 unit)(4 unit)）

## File Scope（変更許可範囲）

- 作成: `src/cli/custom-profile.mjs`, `tests/cli/custom-profile.test.mjs`
- 変更: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- built-in profile レジストリ・テーブル（`profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs`）の変更・参照拡張の禁止 — custom は別経路（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + AC-06 の built-in 不変 + レビュー）
- 定義ファイルの schema validation を warning で続行する実装の禁止 — FR-03 は CliError で fail-fast のみ（検出: AC-02 のテスト）
- パストラバーサル（絶対パス / `..`）・シェルメタ文字の未検証埋め込み（SEC-02 / SEC-03 のバイパス）の禁止（検出: AC-07 のテスト）
- 新規 npm 依存（YAML パーサ・schema validator）の追加の禁止 — `parseConfigYaml` 同方針の自前サブセット + `.json` escape hatch で読む（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- 定義ファイル / テストフィクスチャへの実 secret / 本番 URL / 本番 email の混入の禁止 — 例示は非機密プレースホルダ（検出: レビュー + grep — SEC-04）
- File Scope 外への変更の禁止 — 特に `profile.mjs` / `profile-composition.test.mjs` と fixture / `check-config.mjs` / `run.mjs` / `package-templates/`（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止、型抑制（`any` 相当）禁止

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。custom 定義の schema 検証誤 reject は症状欄冒頭に補助タグ『custom-profile: schema 検証誤 reject』を付し `cause` enum の該当値と併記 — OPS-01）
- [ ] AC-01: `.ai-check-profile.yaml` / `.ai-check-profile.json` 両経路の読込 + `version:1` / `profile:{ name, gateScripts, supportScripts, devDependencies? }` の妥当定義から gate/support/deps 解決、YAML サブセット外が `.json` で等価に扱えるテストがパスする（FR-03 / FR-04 / NFR-02）
- [ ] AC-02: `version` 欠落 / 1 以外・`profile` 欠落・`name` 規則違反・gate 3 種欠落・`supportScripts` 欠落 / 参照 step 実体欠落・未知キー・型不正 の各入力が対象ファイル名と原因を含む CliError になるテストがパスする（FR-03 / INV-06）
- [ ] AC-03 unit: `resolveCustomProfileScripts` が定義由来の**非空** gate + support scripts を返し built-in テーブルを参照していないテストがパスする（FR-04 / FR-05 / INV-03。silent 空 scripts 経路に到達しないことの機械確認 — リスク2）
- [ ] AC-04 unit: `custom:` なし・`custom:<name>` 規則違反・定義 `profile.name` 不一致の検証点が CliError になるテストがパスする（FR-02。CLI 統合は TASK-0234）
- [ ] AC-07 unit: 絶対パス・`..` 入り `profileFilePath`・シェルメタ文字入り `name` / step 名の各入力が CliError になるテストがパスする（SEC-02 / SEC-03 / INV-04）
- [ ] `node --test tests/cli/custom-profile.test.mjs` がパスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テスト（特に `tests/cli/profile-composition.test.mjs` の 8 組合せ fixture）が**無修正**で pass する（AC-06 / NFR-01 / INV-01）
- [ ] 追加テストケースに AC-N / FR-N / SEC-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0232 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0065-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
