# TASK-0216: addon 同名 script キー競合の CliError 化 + 競合テスト

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0216 |
| SPEC-ID   | SPEC-0060 |
| PLAN-ID   | PLAN-0060 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0215 が commit した `tests/cli/profile-composition.test.mjs` へ AC-03 ケースを追記する逐次編集。fixture 固定済みが等価性証明の前提） |
| 依存TASK  | TASK-0215（fixture が変更前 HEAD 出力で commit 済みであること — NFR-01 / リスク4） |
| 見積     | 2h |

## 責務

`src/cli/profile-scripts.mjs` の `getProfileScripts` addon マージを、`Object.assign` から「キーごとに `Object.hasOwn(scripts, key)` を確認してから代入」する小関数に置き換え、addon の script キーが base または先行 addon のキーと同名の場合に衝突キー名・base 名・addon 名を含む CliError で fail-fast させる（silent 上書きの禁止 — SPEC T2 / FR-02 (d)）。競合ケースを `tests/cli/profile-composition.test.mjs` へテーブル注入で追加し、TASK-0215 のスナップショット全件が無修正で pass し続けること（NFR-01 の等価性証明）を確認する。

## 入力

- SPEC-0060 FR-02、AC-03、NFR-01 / NFR-04、SEC-02、契約 (2)、実装メモ「競合検出の実装位置」「AC-03 (c) の再現」節、想定エラー4、INV-02 / INV-03 / POST-01 / POST-02、リスク5
- 実装位置: `getProfileScripts` の addon ループ内。実装順は「先に競合検査 → マージ → step 追記」。`ADDON_CHECK_STEPS` による `ai:check` への追記は**競合ではない**（定義済み合成規則）ため検査対象外。競合検出は addon の script テーブルのキーのみを対象とする
- AC-03 (c) の再現: 現行テーブルでは競合が発火しないため、マージ小関数を export してテストからテーブルを直接注入する（または `getProfileScripts` の内部テーブルを引数注入可能にする）。**export しても public CLI surface は不変に保つ**（テーブル自体は export しない — PLAN 実装リスク6）
- SEC-02: CliError メッセージには衝突キー名と profile 名のみを含め、script のコマンド内容全文は含めない
- exit code 規約: `CliError` で表現し `process.exit` 直呼びをしない
- 呼び出し側（`init.mjs` / `doctor.mjs` / `update.mjs`）の変更は不要（競合 CliError は現行組合せで発火しない — SPEC 既存実装との衝突点）

## 出力

- `src/cli/profile-scripts.mjs`: 競合検出小関数（合成順・出力は不変。唯一の挙動変更）
- `tests/cli/profile-composition.test.mjs`（追記）: AC-03 — (a) `react-nextjs+supabase-rls` で `test:db` / `test:integration:rls` が含まれ `ai:check` 末尾に addon step が `&&` 連結追記される、(b) 既に含まれる step は重複追記されない、(c) base 衝突・先行 addon 衝突（複数 addon）の両方をテーブル注入で再現し、衝突キー名入り CliError で silent 上書きされない（POST-01: 部分合成が返らない）。競合あり / なし / 複数 addon の各分岐に最低 1 ケース（NFR-04）。CliError メッセージに script コマンド内容全文を含まないことの検証（SEC-02）。テストケース名は日本語 + AC-N 参照コメント

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/profile-scripts.mjs`, `tests/cli/profile-composition.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- 競合時に warning でマージ続行する実装・silent 後勝ち実装の禁止 — 競合は CliError で fail-fast のみ（検出: AC-03 (c) のテスト — 注入テーブルで CliError になることの検証）
- fixture（`tests/cli/fixtures/profile-composition.json`）の変更・再生成の禁止 — TASK-0215 が commit した変更前 HEAD 出力が一次情報源であり、本 TASK で fixture 更新が必要になった場合は NFR-01 違反 = 実装バグとして修正する（検出: fixture 無修正 pass の完了条件 + diff 検査）
- 合成結果（scripts / support scripts / doc files / managed files）の内容・順序の変更禁止 — 競合検出の追加のみ（検出: AC-05 の fixture 完全一致 + AC-01 の既存テスト pass 継続）
- `src/cli/profile.mjs` / `profile-docs.mjs` / `managed-files.mjs` / `init.mjs` / `doctor.mjs` / `update.mjs` / `dependency-installer.mjs` への変更禁止（File Scope 外。検出: diff 検査 + `templates/hooks/check-file-scope.sh`）
- CliError メッセージに script のコマンド内容全文を含めることの禁止（SEC-02）
- npm 依存追加の禁止（NFR-02、検出: 既存 `tests/cli/package.test.mjs` の dependencies 検査）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止

## 完了条件

- [ ] 実装中に想定外エラー（競合検出追加でスナップショットが fail する等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-03: (a)(b)(c) 全サブケースのテストがパスする（FR-02 / INV-02 / INV-03 / POST-01 / POST-02 / NFR-04）
- [ ] TASK-0215 のスナップショット・規則テスト全件が**無修正**で pass し続ける（NFR-01 / リスク4 — 変更前後の等価性証明。fixture の diff がゼロであること）
- [ ] SEC-02: 競合 CliError メッセージが衝突キー名・profile 名のみを含み、コマンド内容全文を含まないテストがパスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、既存テスト非破壊）
- [ ] 追加テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0216 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0060-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
