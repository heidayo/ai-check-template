# TASK-0215: profile 合成 fixture 生成（変更前 HEAD 出力）+ 規則固定・スナップショットテスト

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0215 |
| SPEC-ID   | SPEC-0060 |
| PLAN-ID   | PLAN-0060 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0216 と同一テストファイル `tests/cli/profile-composition.test.mjs` を編集するため直列。逐次編集注記: 本 TASK 完了・commit 後に TASK-0216 が同ファイルへ AC-03 ケースを追記する） |
| 依存TASK  | なし |
| 見積     | 3h |

## 責務

実装変更**前**の HEAD の出力から全 base（4）× addon 部分集合（2）= 8 組合せ × 4 関数（`getProfileScripts` / `getProfileSupportScripts` / `getProfileDocFiles` / `getManagedFiles`）の期待値 fixture `tests/cli/fixtures/profile-composition.json` を生成して commit し、`tests/cli/profile-composition.test.mjs` に parseProfiles 規則固定（AC-02）・support/doc/managed 合成規則（AC-04）・スナップショット完全一致照合 + 組合せ機械列挙のネガティブ検証（AC-05）のテストを常設する（SPEC T1 / FR-01 / FR-03 / FR-04 / FR-05）。`src/cli/` は一切変更しない。

## 入力

- SPEC-0060 FR-01 / FR-03 / FR-04 / FR-05、AC-02 / AC-04 / AC-05 / AC-06、契約 (1)(3)(4)(5)、実装メモ「fixture 生成」「getManagedFiles のオプション」「組合せの機械列挙」節、境界ケース1、INV-01 / INV-03 / INV-04 / INV-05
- 現行実装の一次情報源（**読むだけで変更しない**）: `src/cli/profile.mjs`（`parseProfiles` / `supportedProfiles`）、`src/cli/profile-scripts.mjs`、`src/cli/profile-docs.mjs`、`src/cli/managed-files.mjs`
- fixture の固定列: `getProfileScripts()` / `getProfileSupportScripts()`（packageManager は `pnpm` 固定 — package manager 変換は既存テストの責務）/ `getProfileDocFiles()` の `relativePath` 列のみ（`sourcePath` は絶対パスのため除外 — AC-06 と整合）/ `getManagedFiles()` の `managedFileStateKey(file.relativePath)` 列（render 内容は既存 `managed-files.test.mjs` の責務）
- `getManagedFiles` オプションは `{ packageManager: "pnpm", ci: "direct", claudeHooks: true, reviewTemplates: true }` に固定して profile 軸のみを動かす（ci / hooks 軸の網羅は既存 96 組合せテストの責務。責務重複させない）
- 組合せ列挙: `supportedProfiles` を import し、`parseProfiles` の成否で base / addon を判別して機械生成（`profile.mjs` の Set を export しない — File Scope 外）。fixture 側にも base / addon 分類を持たせて突き合わせる
- AC-02 (e) の複数 addon 宣言順は、現行 addon 1 件での順序保証テストまたはテスト専用 addon 名 2 件を注入した合成検証のいずれかで固定する
- 照合は `node:assert` の `deepStrictEqual` のみ（NFR-02: スナップショットライブラリ・`node:test` snapshot API 禁止）

## 出力

- `tests/cli/fixtures/profile-composition.json`: 8 組合せ × 4 関数の期待値（キーは英語、base / addon 分類を含む）。変更前 HEAD の実出力から生成
- `tests/cli/profile-composition.test.mjs`: AC-02（(a) `+`/`,` 等価、(b) base 0 件・2 件 CliError、(c) 重複 CliError、(d) 未知名 supported 一覧付き CliError、(e) addons 宣言順保持）、AC-04（(a) support scripts キー集合 = base + security のみで addon 前後不変、(b) doc files = 共通 + base README + addon README 宣言順、(c) managed files 差分 = addon README の profile-doc エントリのみ）、AC-05（8 組合せ完全一致 + fixture に存在しない組合せを与えると fail するネガティブケース）、境界ケース1（addon 0 個は base そのまま）。テストケース名は日本語 + AC-N / FR-N / INV-N 参照コメント

## File Scope（変更許可範囲）

- 作成: `tests/cli/fixtures/profile-composition.json`, `tests/cli/profile-composition.test.mjs`
- 変更: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `src/cli/` 配下（`profile.mjs` / `profile-scripts.mjs` / `profile-docs.mjs` / `managed-files.mjs` 等）の変更禁止 — 本 TASK は現行実装の出力固定のみ（競合検出は TASK-0216 の責務。検出: diff 検査 + `templates/hooks/check-file-scope.sh`）
- fixture を実装変更後の出力から生成することの禁止 — 変更前 HEAD の出力が一次情報源（NFR-01 / リスク4。検出: 本 TASK の fixture commit が TASK-0216 の実装変更 commit より先行することのレビュー確認）
- fixture に絶対パス・環境依存値・secret 形字句を含めることの禁止（検出: AC-06 の grep 検査）
- スナップショットライブラリ・`node:test` snapshot API 等の npm 依存追加の禁止（NFR-02、検出: 既存 `tests/cli/package.test.mjs` の dependencies 検査）
- `parseProfiles` の文法・エラー条件の変更禁止 — 現行規則の固定のみ（検出: AC-02 テスト + `profile.mjs` 無変更の diff 検査）
- 既存テストファイル（`tests/cli/managed-files.test.mjs` の 96 組合せテスト等）の変更禁止（File Scope 外）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止

## 完了条件

- [ ] 実装中に想定外エラー（現行合成出力と SPEC 事前調査の乖離発見等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol。fixture 更新漏れ起因は原因タグ『profile-composition: fixture更新漏れ』を付す — OPS-03）
- [ ] AC-02: parseProfiles の (a)〜(e) 全サブケースのテストがパスする（FR-01 / INV-04）
- [ ] AC-04: support scripts / doc files / managed files の (a)〜(c) 全サブケースのテストがパスする（FR-03 / FR-04 / ASM-02 / ASM-03）
- [ ] AC-05: 8 組合せ × 4 関数が fixture と `deepStrictEqual` で完全一致し、組合せが `supportedProfiles` から機械列挙され、fixture に存在しない組合せのネガティブケースが fail を検証する（FR-05 / INV-01 / INV-05）
- [ ] AC-06: `grep -E '/Users/|/home/|API_KEY|TOKEN|SECRET' tests/cli/fixtures/profile-composition.json` がヒット 0 件（SEC-01）
- [ ] `node --test tests/cli/profile-composition.test.mjs` が全件パスし、`time` の real が 2 秒未満（NFR-03。閾値超過は WARN 非ブロッキング、run log（`.sage/runs/`）へ記録）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、既存テスト非破壊 — NFR-01）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0215 を含める（commit-msg hook で強制）

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
