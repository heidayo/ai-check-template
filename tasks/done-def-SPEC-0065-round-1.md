# Done Definition: SPEC-0065 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0064 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0065
- PLAN-ID: PLAN-0065
- TASK-ID: TASK-0232, TASK-0233, TASK-0234, TASK-0235
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/custom-profile.test.mjs`（Round 全体は `node --test tests/cli/*.test.mjs`）

## Pass/Fail 判定（SPEC-0065 AC-01〜AC-08 の Gate 配分）

SPEC の AC↔Gate 対応表に従う: AC-01 / AC-02 / AC-03 / AC-04 / AC-05 = Gate 2: Functional、AC-06 = Gate 2: Functional（+ Gate 4: Architecture の built-in 境界不変観点）、AC-07 = Gate 2: Functional（+ Gate 3: Security の SEC-02 / SEC-03 観点）、AC-08 = Gate 1: Structural（+ Gate 3: Security の SEC-01 / SEC-04 観点）。

### Structural Gate（Gate 1）

- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] 各 TASK の File Scope 外の変更がない（特に `src/cli/profile.mjs`（`BASE_PROFILES` / `ADDON_PROFILES` / `supportedProfiles` / `parseProfiles` 不変）/ `src/cli/profile-scripts.mjs`（built-in テーブル不変）/ `src/cli/dependency-installer.mjs`（built-in 依存テーブル不変）/ `src/cli/profile-diagnostics.mjs`（base 別 if 不変）/ `src/cli/profile-docs.mjs`（`getProfileDocFiles` 既に汎用 — 変更不要）/ `src/cli/managed-files.mjs`（`getProfileDocFiles` 経由 — 変更不要）/ `src/cli/check-config.mjs` / `src/cli/run.mjs`（run config は別責務）/ `tests/cli/profile-composition.test.mjs` と `tests/cli/fixtures/profile-composition.json`（8 組合せ不変）/ `package-templates/` 配下 の無変更）
- [ ] commit message に TASK-ID を含める（commit-msg hook で強制。TASK-0232 → TASK-0233 → TASK-0234 → TASK-0235 の順）
- [ ] **AC-08**: `grep -q '\-\-profile-file' docs/cli.md` がヒットし、(1) `custom:<name>` 指定方法、(2) 定義ファイル schema（`version` / `profile.gateScripts`（`ai:check` / `ai:check:fast` / `ai:check:secure` 網羅）/ `supportScripts` / `devDependencies`）、(3) built-in（4 base + supabase-rls）との棲み分け（custom は `supportedProfiles` に足さない別経路）、(4) command 直書き実行の信頼境界 + secret 非直書き案内、の 4 点が同節に含まれることをレビューで確認する（FR-08 / SEC-01 / SEC-04）【docs】
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない（`src/cli/custom-profile.mjs`（新規）は `package.json` `files` の既存 `src/` パターン内、`docs/cli.md` は既存同梱ファイル、`tests/cli/` は pack 非同梱）

### Functional Gate（Gate 2）

- [ ] **AC-01**: `.ai-check-profile.yaml`（YAML サブセット）/ `.ai-check-profile.json`（`JSON.parse`）両経路の読込 + `version:1` / `profile:{ name, gateScripts, supportScripts, devDependencies? }` の妥当定義から gate scripts（3 gate）/ support scripts / deps が解決され、YAML サブセット外が `.json` で等価に扱えるテストがパスする（FR-03 / FR-04 / NFR-02）【unit】
- [ ] **AC-02**: `version` 欠落 / 1 以外・`profile` 欠落・`profile.name` 規則違反・`gateScripts` の gate 3 種いずれか欠落・`supportScripts` 欠落 / gateScripts 参照 step 実体欠落・未知キー・型不正 の各入力が対象ファイル名と原因を含む CliError（非 0 終了相当）になり、ファイルへの書き込みが発生しないテストがパスする（FR-03 / INV-06）【unit】
- [ ] **AC-03**: `init --profile custom:mystack --profile-file <path>` で対象 `package.json` に gate scripts（PM 別描画）+ support scripts（gateScripts 参照 step 実体）が merge され、`--install-deps` 対象 dev dependencies が定義ファイル `devDependencies` と一致し、custom 経路が built-in テーブル（`BASE_PROFILE_SCRIPTS` 等）を参照せず定義ファイルから解決し（生成 scripts が**非空** = silent 空 scripts 経路未到達 — リスク2）、docs relativePath = `docs/ai-check-template/profiles/custom-<name>/README.md` になるテストがパスする（FR-04 / FR-05 / INV-03）【integration】
- [ ] **AC-04**: `--profile-file` 併用で `--profile custom:mystack` が custom モードで解決され、`--profile-file` 併用の built-in 名（`react-nextjs` 等）・`custom:` 接頭辞なし・`custom:<name>` 規則違反・定義 `profile.name` 不一致・境界ケース2（`--profile-file` あり + `--profile` 既定値 `react-nextjs`）が各 CliError、`--profile-file` 未指定時は従来どおり built-in が解決されるテストがパスする（FR-02 / 想定エラー3 / 境界ケース2）【unit + integration】
- [ ] **AC-05**: `init --profile-file` 後の state に `customProfile: { name, filePath, definition }` が記録され、built-in モード init の state には `customProfile` キーが存在せず、`customProfile` 付き state が `loadInstallState` で valid、絶対パス / `..` 入り `filePath`・gate 3 種を欠く `definition`・非文字列 `name` が invalid-install-state になり、`update`（フラグなし・`customProfile` state あり）が custom 配置規則で scripts 更新し `customProfile` を維持するテストがパスする（FR-06 / FR-07 / SEC-02 / 想定エラー5 / POST-01 / POST-02）【unit + integration】
- [ ] **AC-07**: state に `customProfile` がある target への `doctor`（フラグなし）が custom モードで診断し (a) 定義ファイル不在・(b) 定義ファイル内容と state スナップショットの drift・(c) 対象 `package.json` の gate/support scripts drift を issue（非 0）検出し、base 別 diagnostics（`profile-diagnostics.mjs`）が custom では発火せず、`--profile-file ../outside`・絶対パス・シェルメタ文字入り定義パスが CliError になるテストがパスする（FR-07 / SEC-02 / SEC-03）【integration + unit】
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、custom 追加後も既存テストが無修正で pass する（NFR-01 後方互換 / INV-01 / PRE-01 / PRE-02 / POST-01 / POST-02）【unit + integration】
- [ ] NFR-04: 7 分岐（(1) 定義 YAML / JSON 読込成功 / (2) schema 各異常系 / (3) custom モード判定 / (4) 生成 scripts 内容 / (5) state customProfile 記録・欠落・不正 / (6) doctor の定義不在・drift 検出 / (7) built-in 8 組合せ不変）の各分岐に最低 1 テストケースが対応している
- [ ] 全テストケースに AC-N / FR-N / SEC-N / INV-N 参照コメントがある（AP-07 対策）。テストケース名は日本語（言語規約）

### Security Gate（Gate 3）

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli/custom-profile.mjs src/cli/install-state.mjs src/cli/init.mjs src/cli/update.mjs src/cli/doctor.mjs tests/cli/custom-profile.test.mjs docs/cli.md` が新規 unfinished marker を検出しない
- [ ] **SEC-02 / INV-04**: `--profile-file` の値・state `customProfile.filePath` が絶対パス・`..` セグメントで CliError になり、正規化後パスが `--target` 配下であることが保証される（`--target` 外読込経路を作らない）。state 経由 `filePath` も同一 validation を通り、state 改竄でルート外読込を誘発できない（AC-05 の invalid ケース + AC-07 のパストラバーサルケースで検証）
- [ ] **SEC-03 / INV-04**: `profile.name`（`[a-z][a-z0-9-]*`）・step 名（`[a-z][a-z0-9:_-]*`）のパターン外（シェルメタ文字・パスセパレータ入り）が CliError になる（docs パス構築 `profiles/custom-<name>/README.md` / scripts 文字列への埋め込みは検証通過済みの値のみ — AC-07 のテスト）
- [ ] **SEC-01 / ASM-01**: custom 定義ファイルの command 直書き実行の信頼境界が `package.json` scripts・`.ai-check.yaml`（SPEC-0058 SEC-01）と同一である旨と、信頼できない定義ファイルを使わない旨が `docs/cli.md` に明記されている（AC-08 の (4)）
- [ ] **SEC-04**: 定義ファイル例示・`docs/cli.md` 追記・テストフィクスチャに実在の secret / token / API key の実値 / 本番 URL / 本番 email が無く、command に secret を直書きせず env var / secret manager 経由にする案内が含まれる（レビュー + grep — AC-08 の (4)）
- [ ] **NFR-02**: 新規 npm 依存（YAML パーサ・schema validator）を追加していない（`tests/cli/package.test.mjs` の runtime / dev dependencies 検査で機械検証）。custom 定義ファイルの読込が `node:fs` / `node:path` + 自前 YAML サブセットパーサ + `JSON.parse` のみで行われている（diff レビューで確認）

### Architecture Gate（Gate 4）

- [ ] TASK-0232 → TASK-0233 → TASK-0234 → TASK-0235 の commit 順序（git log で確認、下位モジュール先行の直列性担保）
- [ ] **INV-02 / AC-06（必須項目）**: `tests/cli/fixtures/profile-composition.json` の 8 組合せ fixture が**無修正**であり、`tests/cli/profile-composition.test.mjs` の diff がゼロで、built-in profile テーブル（`profile.mjs` の `BASE_PROFILES` / `ADDON_PROFILES` / `supportedProfiles` / `parseProfiles`、`profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs` の built-in テーブル・if 分岐）が**一切変更されていない**。`supportedProfiles` に custom 名が追加されておらず 8 組合せ列挙が 8 件のままである（built-in 境界の保存。File Scope 外 diff ゼロ + `profile-composition.test.mjs` 無修正 pass が証左 — SPEC-0060 の回帰ガードを壊さない）
- [ ] **INV-03**: custom モードで書き込まれる gate/support scripts が常に定義ファイル由来であり、custom 名が built-in テーブル（`BASE_PROFILE_SCRIPTS` 等）を参照しない（`profile-scripts.mjs` L95 の silent 空 scripts 経路に custom 名が到達しない）。custom 経路が `parseProfiles` / `getProfileScripts` / `getProfileDevDependencies` / `diagnoseProfileScripts` を呼ばない（AC-03 の非空 scripts + built-in テーブル未参照テスト + diff レビュー）
- [ ] **INV-01 / NFR-01**: `--profile-file` 未指定（かつ state に `customProfile` なし）の init / update / doctor の観測可能な挙動が本 SPEC 適用前と同一である（既存 `tests/cli/{init,update,doctor}.test.mjs` の diff が custom 追加ケースのみで、既存期待値の変更がない — レビューで確認）
- [ ] **INV-05 / NFR-03**: install state の schemaVersion が 2 のままで、`customProfile` が「存在して valid」か「キー欠落」の 2 状態のみを取り、`null` / 空が valid にならず、既存フィールドの意味・validation が不変である（SPEC-0056 の `managedFiles` / SPEC-0061 の `workspace` の validation との非干渉。既存 install-state テストの継続 pass + AC-05 で検証）
- [ ] **ASM-02**: custom docs が `getProfileDocFiles` に pre-parsed オブジェクト `{ base: "custom-<name>", addons: [], all: ["custom-<name>"] }` で渡され（文字列 `custom:<name>` を渡していない）、`profile-docs.mjs` / `managed-files.mjs` が無変更である（AC-03 の docs relativePath + File Scope 外 diff ゼロ + レビュー）
- [ ] `.ai-check.yaml`（SPEC-0058 run config）との非干渉: `check-config.mjs` / `run.mjs` が無変更である（契約 (6)。File Scope 外 diff ゼロ + レビュー）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] File Scope 外変更が `templates/hooks/check-file-scope.sh` で検出されていない

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。custom 定義ファイルの schema 検証が実在の妥当な定義を誤って reject した失敗は症状欄冒頭に補助タグ『custom-profile: schema 検証誤 reject』（固定文字列・表記ゆれ禁止）を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01。補助タグは cause enum を置き換えず補助的に追加する）。
4. 同種失敗 3 回で `sage/anti-patterns.md` 昇格候補にする（判定: 次マイナーバージョン PLAN 起票時に `grep -c 'custom-profile: schema 検証誤 reject' sage/failures.md` で機械確認。3 回累積で schema の緩和（任意キーの許容・エラーメッセージ改善）を別 SPEC 起票 — OPS-01）。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
