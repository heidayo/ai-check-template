# TASK-0196: update の 3-way 判定 + 解決フラグ + .bak 生成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0196 |
| SPEC-ID   | SPEC-0056 |
| PLAN-ID   | PLAN-0056 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes（TASK-0197 と並列可） |
| 依存TASK  | TASK-0195 |
| 見積     | 3h |

## 責務

update の上書き判定を baseline / local / upstream の 3-way 化し、解決フラグ（`--keep-local` / `--force-managed` / `--diff`）と `.bak-<packageVersion>` 生成を実装する（FR-02 / FR-03 / FR-04 / INV-01 / INV-05）。

注記（SPEC T4）: 判定ロジック・フラグ処理・`.bak` 生成は同一判定フロー内で密結合のため意図的に単一タスク。これ以上の分割はしないが、これ以外の責務（doctor / docs）は含めない。

## 入力

- SPEC-0056 FR-02〜FR-04、境界ケース1（local==upstream≠baseline → keep + hash 更新）、異常系1（`managedFiles` 記録ありでファイル欠落 → `missing` として再生成）、OPS-01（per-file action 出力）、SEC-02（`.bak` の .gitignore 案内）
- `src/cli/update.mjs` `updateTemplateFile()`（L327）/ `updateRenderedTemplateFile()`（L399）/ `parseUpdateArgs()`（L141）
- 既存テストパターン: `tests/cli/update.test.mjs` drift 修復テスト（L133-144）

## 出力

- 4 分岐判定（keep / update / skip-modified / overwrite-forced）+ FR-04 フォールバック（baseline なし → バイト比較、差分ありは上書きせず警告）
- CLI フラグ 3 種、`.bak-<basename>.bak-<packageVersion>` 生成（上書き前に書き込み — INV-05）、skip 時の keep/overwrite/diff 案内表示、`--json` operations への action 出力（OPS-01 / POST-02）
- 全分岐 + 異常系のテスト

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/update.mjs`, `tests/cli/update.test.mjs`, `src/cli/managed-files.mjs`（判定ヘルパー追加が必要な場合のみ）
- 削除: なし

## 禁止事項

- baseline hash なしでの無条件上書きの禁止（FR-04 フォールバックを迂回しない — SPEC Forbidden Shortcuts）
- `--force-managed` 時、`.bak` 書き込み完了前のファイル上書き禁止（INV-05）
- doctor / init / docs への変更禁止（TASK-0197/0198 の責務 — AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止
- `.bak-*` ファイルのコミット禁止

## 完了条件

- [ ] 3-way 判定の 4 分岐（keep / update / skip-modified / overwrite-forced）それぞれに最低 1 テストケースがあり全パスする（AC-03 / AC-04 / T4 完了条件、分岐網羅はテストケース列挙で担保）
- [ ] ローカル改変ファイルが update で上書きされず `skip-modified` として報告されるテストがパスする（AC-03 / INV-01 / FR-02）
- [ ] `update --force-managed` で上書き + `.bak-<version>` 生成のテストがパスする（AC-04 / FR-03）。`.bak` 書込失敗時に元ファイルが無傷であることのテストを含む（INV-05）
- [ ] 異常系テストがパスする: `managedFiles` 記録ありでファイル欠落 → `missing` 報告 + 再生成（異常系1）、baseline なし + 差分あり → 上書きせず警告（FR-04）、境界ケース1 → keep + hash 更新
- [ ] v1 state で update がエラーなく完走し v2 に migration されるテストがパスする（AC-05）
- [ ] 未改変プロジェクトで update → doctor PASS の冪等性テストがパスする（AC-06、`init.test.mjs` L220-251 パターン踏襲）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] NFR-03: `time node bin/ai-check-template.mjs update --target <fixture>` が real 3 秒未満
- [ ] commit message に TASK-0196 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0056-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
