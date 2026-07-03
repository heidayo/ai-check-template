# TASK-0233: install state の customProfile additive 対応 + custom 解決

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0233 |
| SPEC-ID   | SPEC-0065 |
| PLAN-ID   | PLAN-0065 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0234 が本 state 拡張・custom 解決に依存） |
| 依存TASK  | TASK-0232（正規化 `definition` スナップショットの形を state に写すため） |
| 見積     | 3h |

## 責務

`src/cli/install-state.mjs` に schema v2 のまま optional `customProfile` フィールドの additive 対応を行う（SPEC T2、FR-06 / FR-07）。`buildInstallState`（記録）/ `validateInstallState`（存在時のみ検証）/ `resolveEffectiveOptions`（explicit `--profile-file` > state > null の解決）を SPEC-0061 `workspace` と同型パターンで拡張する。schemaVersion / 既存フィールドの意味・validation は不変（NFR-03）。state round-trip を `tests/cli/custom-profile.test.mjs`（TASK-0232 が新規作成、install-state 専用テストファイルは repo に存在しないため customProfile の state テストはここに集約）の追加ケースで固定する。

## 入力

- SPEC-0065 FR-06（state additive 拡張）/ FR-07（doctor / update の custom 解決の優先順）、SEC-02（`filePath` の絶対パス / `..` 禁止）、NFR-03（additive のみ）/ NFR-04（分岐 (5)）、AC-05 の state 部分、想定エラー5、契約 (4)、実装メモ「install state の customProfile 追加」節、INV-05、PRE-02、リスク3 / 実装リスク7
- `buildInstallState`: 入力に `customProfile`（あれば正規化済み `{ name, filePath, definition: { gateScripts, supportScripts, devDependencies } }`）を受け、存在時のみ `customProfile` キーを additive に含める。built-in モード（`customProfile` なし）ではキー自体を書かない。`null` / 空は書かない（INV-05）。schemaVersion は 2 のまま
- `validateInstallState`: `customProfile` が存在する場合のみ検証（`name` は `[a-z][a-z0-9-]*`・`filePath` は非空文字列 / 絶対パス禁止 / `..` セグメント禁止 — SEC-02・`definition` は gate 3 種（`ai:check` / `ai:check:fast` / `ai:check:secure`）を網羅）。不正なら `invalidState("invalid-install-state", ...)`。`customProfile` 無しの v1 / v2 state は従来どおり valid（SPEC-0056 の validation を破らない）。built-in profile の state に `customProfile` が現れない前提
- `resolveEffectiveOptions`: `customProfile` の解決を追加（explicit `--profile-file`（+ `--profile custom:<name>`）> state `customProfile` > null）。環境変数・カレントディレクトリに依存しない決定的解決（PRE-02）。`workspace` の解決（L104）と同じ形
- summary（`effectiveOptionsSummary` / `installationSummary`）に custom 情報を出す場合は「存在時のみ additive」とし、built-in モードでは出さない（実装リスク7 — 既存 JSON 期待値テストを壊さない。壊れる場合も既存期待値は変更せず追加ケース側で検証）
- exit code 規約: `CliError`（`assertWritableInstallState` 経由）で表現し `process.exit` 直呼びをしない

## 出力

- `src/cli/install-state.mjs`（変更）: `buildInstallState` / `validateInstallState` / `resolveEffectiveOptions` の `customProfile` additive 対応（+ 必要なら summary の存在時 additive 出力）。既存関数の他フィールドの挙動・schemaVersion は不変
- `tests/cli/custom-profile.test.mjs`（TASK-0232 作成分に追記）: AC-05 state 部分 — `customProfile` 記録あり state の round-trip valid、`customProfile` 無し（built-in）state に custom キー不在、絶対パス / `..` `filePath`・gate 3 種欠く `definition`・非文字列 `name` が invalid-install-state（想定エラー5）、`resolveEffectiveOptions` の explicit > state > null 解決（PRE-02）、`customProfile` 無しの既存 v1 / v2 state が従来どおり valid（NFR-03 後方互換）。テストケース名は日本語 + AC-N / FR-N / SEC-N 参照コメント（NFR-04 分岐 (5)）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/install-state.mjs`, `tests/cli/custom-profile.test.mjs`（TASK-0232 作成分に追記）
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- install state の schemaVersion 変更・既存フィールドの意味 / validation 変更の禁止 — `customProfile` の additive 追加のみ（検出: AC-05 + 既存 `install-state` 系テスト + 8 組合せ fixture の無修正 pass）
- state の `customProfile` に `null` / 空を書く実装の禁止 — 「存在して valid」か「キー欠落」の 2 状態のみ（検出: AC-05 / INV-05 のテスト）
- state 経由 `customProfile.filePath` の SEC-02 検証（絶対パス / `..` 禁止）のバイパスの禁止 — state 改竄でルート外読込を誘発できない（検出: AC-05 の invalid ケース）
- built-in profile レジストリ・テーブル（`profile.mjs` 等）の変更・参照拡張の禁止（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- `--profile-file` 未指定（かつ state に `customProfile` なし）経路の挙動・既存テスト期待値の変更の禁止（検出: AC-06 の既存テスト無修正 pass + レビューで diff が追加ケースのみであることの確認）
- SPEC-0056 の `managedFiles` / SPEC-0061 の `workspace` の validation との干渉の禁止（検出: 既存 install-state テストの無修正 pass）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止、npm 依存追加禁止

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-05 state 部分: `customProfile` 記録あり state の round-trip valid・built-in モード state に custom キー不在・絶対パス / `..` `filePath`・gate 3 種欠く `definition`・非文字列 `name` が invalid-install-state になるテストがパスする（FR-06 / SEC-02 / INV-05 / 想定エラー5）
- [ ] `resolveEffectiveOptions` の explicit `--profile-file` > state `customProfile` > null の解決がテストで固定される（FR-07 / PRE-02）
- [ ] `customProfile` 無しの既存 v1 / v2 state が従来どおり valid で、schemaVersion が 2 のまま・既存フィールドの検証が不変であるテストがパスする（NFR-03 / SPEC-0056 の validation 非干渉）
- [ ] `node --test tests/cli/custom-profile.test.mjs` がパスする（および `node --test tests/cli/*.test.mjs` 全件無修正 pass）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テスト（特に `tests/cli/profile-composition.test.mjs` の 8 組合せ fixture）が**無修正**で pass する（AC-06 / NFR-01 / INV-01）
- [ ] 追加テストケースに AC-N / FR-N / SEC-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0233 を含める（commit-msg hook で強制）

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
