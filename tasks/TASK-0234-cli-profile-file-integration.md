# TASK-0234: init / update / doctor の --profile-file custom 経路統合

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0234 |
| SPEC-ID   | SPEC-0065 |
| PLAN-ID   | PLAN-0065 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0233 の state 拡張・custom 解決に依存） |
| 依存TASK  | TASK-0233 |
| 見積     | 5h |

## 責務

`src/cli/init.mjs` / `update.mjs` / `doctor.mjs` に `--profile-file` 経路を統合する（SPEC T3、FR-01 / FR-02 / FR-04 / FR-05 / FR-07）。オプション解析・custom モード判定・built-in テーブル参照の手前での解決分岐・custom scripts / support / deps / docs の配置・doctor の custom drift 診断を実装する。3 コマンドは TASK-0232 の `loadCustomProfile` / `resolveCustomProfileScripts` と TASK-0233 の `resolveEffectiveOptions` custom 解決を呼ぶのみで、custom 経路では `parseProfiles` / `getProfileScripts` / `getProfileDevDependencies` / `diagnoseProfileScripts` を呼ばない（INV-03）。既存 `tests/cli/{init,update,doctor}.test.mjs` に custom 経路の追加ケースを足す（既存ケースの期待値は変更しない）。File Scope 6 ファイルで 10 未満のため一括維持（PLAN 実装方針 7）。

## 入力

- SPEC-0065 FR-01（`--profile-file` オプション・単一指定・未指定時挙動同一）/ FR-02（custom モード判定・`custom:<name>` 解釈・built-in 名併用 CliError・定義 `profile.name` 一致）/ FR-04（解決分岐）/ FR-05（scripts / support / deps / docs 生成）/ FR-07（doctor / update の custom 解決 + drift 検出）、SEC-02 / SEC-03、NFR-01 / NFR-04（分岐 (3 integration)(4 integration)(6)）、AC-03 / AC-04 / AC-05 / AC-06 / AC-07、想定エラー1 / 3、境界ケース1 / 2、契約 (1)(2)(5)、実装メモ「解決分岐の位置」「doctor の drift 検出」「docs 生成」節、INV-01 / INV-02 / INV-03、PRE-01 / PRE-02 / POST-01 / POST-02、リスク2 / 実装リスク8
- **オプション解析（FR-01）**: init / update / doctor に `--profile-file <path>` / `--profile-file=<path>` を追加（`--target` 相対・単一指定・2 回目 CliError）。既存の `readFlagValue` / `setWorkspaceOption` パターンに合わせる
- **custom モード判定（FR-02 / 境界ケース2）**: `--profile-file` 指定時は custom モードに入り、`--profile` の値が `custom:<name>`（`<name>` は `[a-z][a-z0-9-]*`）でなければ CliError。built-in 名（`react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli` / `supabase-rls`）に `--profile-file` を併用したら CliError（想定エラー3）。`--profile-file` があるが `--profile` 既定値 `react-nextjs` のまま（= built-in 名）も同経路の CliError（境界ケース2）。定義ファイル `profile.name` が `<name>` と不一致なら CliError
- **解決分岐（FR-04 / INV-03、実装方針 2）**: profile 解決点で「`options.profileFile`（or state `customProfile`）あり → `loadCustomProfile` → `resolveCustomProfileScripts` / 定義 `devDependencies` → merge」「なし → 既存 `getProfileScripts` / `getProfileDevDependencies` 経路」に分岐。**custom 経路では built-in テーブルを参照しない**。built-in 経路のコードは 1 行も変えない（既存テストの期待値を書き換えたら設計を疑う）
- **scripts 配置（FR-05 / 実装リスク8 / POST-02）**: gate scripts（`ai:check*`、PM 別描画）+ support scripts を既存 `mergeScriptsInto`（init）/ `updateScriptsIn`（update）に「解決済み scripts サブセット」で渡して merge（keep / skip / overwrite の既存規則を適用。custom 専用の新規 merge を書かない）。`devDependencies` は `--install-deps` 対象（既存 `dependency-installer.mjs` の spawn 経路を流用し、plan の dependencies を custom 定義 `devDependencies` で置き換える）
- **docs 生成（FR-05 / ASM-02 / 境界ケース1）**: custom docs は `getProfileDocFiles` に **pre-parsed オブジェクト** `{ base: "custom-<name>", addons: [], all: ["custom-<name>"] }` を渡す（文字列 `custom:<name>` を渡すと `parseProfiles` 経由で CliError になるため禁止）。生成 relativePath = `docs/ai-check-template/profiles/custom-<name>/README.md`。templates に該当 README が無ければ `collectManagedFileHashes` の欠落スキップで自然に落ちる（CLI は custom README を生成しない）
- **doctor の drift 検出（FR-07 / AC-07）**: custom 解決時（state `customProfile` or explicit `--profile-file`）に (a) `loadCustomProfile` で定義ファイル再読込 → 存在 / schema チェック、(b) 再読込 definition と state `customProfile.definition` の比較で drift issue、(c) 対象 `package.json` の gate/support scripts を definition 期待値と照合（`checkPackageScripts` 相当）。base 別 diagnostics（`diagnoseProfileScripts`）は custom モードでは**呼ばない**（明示的に別診断経路。silent スキップに頼らない）
- **update の custom 解決（FR-07 / POST-02）**: state（or explicit `--profile-file`）から custom profile を解決し init と同じ配置規則で scripts 更新、state の `customProfile` 維持・更新。定義ファイル不在なら CliError（部分書き込みなし = 想定エラー1）
- **書き込み順序（PRE-01）**: custom モードの書き込みは FR-02 / FR-03 / SEC-02 / SEC-03 の全検証を通過した後にのみ開始（検証失敗時の部分書き込みの不在）
- exit code 規約: `CliError` で表現し `process.exit` 直呼びをしない

## 出力

- `src/cli/init.mjs`（変更）: `--profile-file` 解析・custom モード判定・解決分岐・custom scripts / docs / deps 配置・state `customProfile` 記録
- `src/cli/update.mjs`（変更）: custom 解決（state or explicit）・custom 配置規則で更新・`customProfile` 維持・定義ファイル不在 CliError
- `src/cli/doctor.mjs`（変更）: custom 解決・(a)(b)(c) drift 診断・base 別 diagnostics 未発火・異常系（`../outside`・絶対パス・メタ文字パス CliError）
- `tests/cli/init.test.mjs`（変更、追加ケースのみ）: AC-03 integration（gate + support merge、`--install-deps` deps 一致、docs relativePath = `custom-<name>/README.md`、silent 空 scripts 未到達）/ AC-04 integration（built-in 名併用 CliError・境界ケース2・`--profile-file` 未指定で built-in 解決）/ AC-05 の init→state（POST-01）
- `tests/cli/update.test.mjs`（変更、追加ケースのみ）: AC-05 update（custom 配置規則更新 + `customProfile` 維持 = POST-02、定義不在 CliError = 想定エラー1）
- `tests/cli/doctor.test.mjs`（変更、追加ケースのみ）: AC-07（定義不在 (a)・state drift (b)・scripts drift (c) の issue、base 別 diagnostics 未発火、`../outside`・絶対パス・メタ文字 CliError）
- テストケース名は日本語 + AC-N / FR-N / SEC-N / INV-N 参照コメント（NFR-04 分岐 (3 integration)(4 integration)(6)）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/init.mjs`, `src/cli/update.mjs`, `src/cli/doctor.mjs`, `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`
- 変更（Review F1 修正、TASK-0233 と共有）: `src/cli/install-state.mjs`（`resolveEffectiveOptions` を custom モードで placeholder 化 — doctor/update の明示 `--profile custom:<name> --profile-file` が `parseProfiles` で crash する非対称バグ F1 の修正。commit 468d2b5）, `tests/cli/custom-profile.test.mjs`（F1 回帰テスト。commit 9a7057d）— SCOPE-01 として RUN-0010 に記録。install-state.mjs は本来 TASK-0233 の File Scope だが F1 修正が resolveEffectiveOptions（install-state.mjs 内）に及んだため両 TASK で共有
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- built-in profile レジストリ・テーブル（`profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs`）の変更・custom 経路からの参照の禁止 — custom は `loadCustomProfile` / `resolveCustomProfileScripts` で解決（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + AC-06 の built-in 不変 + INV-03 のテスト + レビュー）
- custom を `supportedProfiles` に足すこと・8 組合せ fixture の変更の禁止 — custom は列挙の外の別経路（検出: AC-06 の 8 組合せ fixture 無修正 pass + `profile-composition.test.mjs` 無変更 + レビュー）
- `--profile-file` 未指定（かつ state に `customProfile` なし）経路の挙動・既存テスト期待値の変更の禁止（検出: AC-06 の既存テスト無修正 pass + レビューで既存テスト diff が追加ケースのみであることの確認）
- custom 名を `getProfileDocFiles` に文字列で渡すことの禁止 — 必ず pre-parsed オブジェクト `{ base: "custom-<name>", addons: [], all: [...] }` で渡す（検出: AC-03 の docs relativePath 検証 + レビュー）
- custom モードで base 別 diagnostics（`diagnoseProfileScripts`）を呼ぶことの禁止 — custom は別診断経路（検出: AC-07 の base 別 diagnostics 未発火テスト）
- 定義ファイル不在時の部分書き込みの禁止 — CliError で fail-fast（検出: AC-07 (a) / 想定エラー1 のテスト）
- パストラバーサル・メタ文字の未検証埋め込み（SEC-02 / SEC-03 のバイパス）の禁止（検出: AC-07 のテスト）
- install state の schemaVersion 変更・既存フィールドの意味変更の禁止（検出: AC-05 + 既存 install-state テスト無修正 pass）
- File Scope 外への変更の禁止 — 特に `check-config.mjs` / `run.mjs` / `package-templates/`（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止、npm 依存追加禁止

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。custom 定義の schema 検証誤 reject は補助タグ『custom-profile: schema 検証誤 reject』を付す — OPS-01）
- [ ] AC-03: `init --profile custom:mystack --profile-file <path>` で gate scripts（PM 別描画）+ support scripts が merge され、`--install-deps` 対象 deps が定義 `devDependencies` と一致し、docs relativePath = `docs/ai-check-template/profiles/custom-<name>/README.md`、custom 経路が built-in テーブル未参照で生成 scripts が**非空**であるテストがパスする（FR-04 / FR-05 / INV-03 — リスク2）
- [ ] AC-04: `--profile-file` 併用の built-in 名 CliError・`custom:` なし・`custom:<name>` 規則違反・定義 `profile.name` 不一致・境界ケース2（`--profile-file` あり + `--profile` 既定値）が CliError、`--profile-file` 未指定で built-in 解決になるテストがパスする（FR-02 / 想定エラー3 / 境界ケース2）
- [ ] AC-05: `init --profile-file` 後 state に `customProfile` 記録・直後の `doctor`（フラグなし）が custom モードで pass（POST-01）、`update`（`customProfile` state あり）が custom 配置規則で更新し `customProfile` 維持（POST-02）、定義不在 update が CliError になるテストがパスする（FR-06 / FR-07 / 想定エラー1）
- [ ] AC-07: state `customProfile` ありの `doctor` が (a) 定義不在・(b) state drift・(c) package.json scripts drift を issue（非 0）検出、base 別 diagnostics 未発火、`--profile-file ../outside`・絶対パス・シェルメタ文字入り path が CliError になるテストがパスする（FR-07 / SEC-02 / SEC-03）
- [ ] AC-06: `node --test tests/cli/*.test.mjs` が全件パスし、`tests/cli/profile-composition.test.mjs` の 8 組合せ fixture が**無修正**で pass、`supportedProfiles` に custom 名が追加されておらず列挙 8 件のままであるテストがパスする（NFR-01 / INV-01 / INV-02）
- [ ] 既存 `tests/cli/{init,update,doctor}.test.mjs` の diff が custom 追加ケースのみで、既存期待値の変更がない（Forbidden Shortcuts、レビューで確認）
- [ ] 追加テストケースに AC-N / FR-N / SEC-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0234 を含める（commit-msg hook で強制）

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
