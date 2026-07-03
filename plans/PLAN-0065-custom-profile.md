# PLAN-0065: profile 定義の外部化（custom profile 定義ファイル）の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0065 |
| SPEC-ID   | [SPEC-0065](../specs/SPEC-0065-custom-profile.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: 新規 `src/cli/custom-profile.mjs` + `init.mjs` / `update.mjs` / `doctor.mjs` / `install-state.mjs` — opt-in `--profile-file` 経路の additive 追加。`--profile-file` 未指定（かつ state に `customProfile` なし）経路の観測可能な挙動は不変 = NFR-01 / INV-01）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/custom-profile.test.mjs` 新規 + `tests/cli/{init,update,doctor}.test.mjs` への custom 経路追加ケースのみ。既存ケースの期待値は変更しない。`tests/cli/profile-composition.test.mjs` と `fixtures/profile-composition.json` は無変更 = AC-06）
- [x] docs（`docs/cli.md` — `--profile-file` / `custom:<name>` / 定義ファイル schema / built-in 棲み分け節の追加のみ）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `src/cli/custom-profile.mjs`（新規） | (1) `loadCustomProfile(targetDir, profileFilePath)` — SEC-02 パス検証（絶対パス・`..` 拒否、正規化後 target 配下確認）→ 拡張子判定で `.ai-check-profile.yaml`（`parseConfigYaml` 同方針の自前サブセットパーサ）or `.ai-check-profile.json`（`JSON.parse`）読込 → schema v1 validation（FR-03: `version:1` 必須、`profile.name` `[a-z][a-z0-9-]*`、`gateScripts` 3 gate 網羅、`supportScripts` step 名 `[a-z][a-z0-9:_-]*` → 非空コマンド、`gateScripts` 参照 step の実体整合、`devDependencies?` 非空文字列配列、未知キー / 型不正拒否）→ 正規化 `{ name, filePath, definition: { gateScripts, supportScripts, devDependencies } }` を返す。(2) `resolveCustomProfileScripts(definition, { packageManager })` — gate scripts の PM 別描画（`renderScriptCommand` 同方針の `pnpm <step>` → PM 別変換）+ support scripts を返す。(3) SEC-03 の `name` / step 名パターン検証を集約。全失敗は CliError（部分書き込みなし = PRE-01） |
| `src/cli/install-state.mjs` | schema v2 のまま optional `customProfile` フィールドの additive 対応: `buildInstallState`（L26）に `customProfile` があれば含める（欠落 = built-in、`null` / 空は書かない = INV-05）、`validateInstallState`（L178）に存在時のみ検証（`name` 規則・`filePath` 非空 / 絶対パス禁止 / `..` 禁止・`definition` の gate 3 種網羅 — FR-06 / SEC-02）、`resolveEffectiveOptions`（L83）に custom 解決（explicit `--profile-file` > state `customProfile` > null — FR-07 / PRE-02）を追加。schemaVersion / 既存フィールドの意味・validation は不変（NFR-03 / SPEC-0056・SPEC-0061 と非干渉） |
| `src/cli/init.mjs` | `--profile-file` / `--profile-file=` 解析（`--target` 相対・単一指定・2 回目 CliError）、custom モード判定（`--profile-file` あり時は `--profile custom:<name>` を要求・built-in 名併用 CliError・既定値 `react-nextjs` のままは CliError = 境界ケース2）、profile 解決点で built-in テーブル参照の**手前**で分岐（custom → `loadCustomProfile` → `resolveCustomProfileScripts` / 定義 `devDependencies`、built-in → 既存 `getProfileScripts` / `getProfileDevDependencies` 経路のまま）、custom docs は `getProfileDocFiles` に **pre-parsed オブジェクト** `{ base: "custom-<name>", addons: [], all: ["custom-<name>"] }` を渡す（文字列 `custom:<name>` を渡さない = `parseProfiles` を経由させない）、state に `customProfile` 記録 |
| `src/cli/update.mjs` | state（または explicit `--profile-file`）から custom profile を解決（FR-07）し init と同じ配置規則で gate/support scripts 更新、state の `customProfile` 維持・更新（POST-02）。定義ファイル不在なら CliError（部分書き込みなし = 想定エラー1）。custom モードでは `parseProfiles` / built-in テーブルを呼ばない |
| `src/cli/doctor.mjs` | custom 解決時（state `customProfile` or explicit `--profile-file`）に (a) 定義ファイルの存在、(b) 定義ファイル内容と state スナップショットの drift、(c) 対象 `package.json` の gate/support scripts drift を issue（非 0）として検出。base 別 diagnostics（`diagnoseProfileScripts`）は custom モードでは**呼ばない**（明示的に別診断経路にする — silent スキップに頼らない）。built-in 経路の診断は不変 |
| `tests/cli/custom-profile.test.mjs`（新規） | 定義ファイル YAML / JSON 読込（AC-01）、schema 各異常系（AC-02）、custom モード判定 unit 部分（AC-04）、SEC-02 / SEC-03（AC-07 の unit 部分）、`resolveCustomProfileScripts` の生成 scripts（AC-03 の unit 部分）。NFR-04 分岐 (1)(2)(3 の unit 部分)(4) |
| `tests/cli/{init,update,doctor}.test.mjs` | custom 経路の追加ケースのみ（AC-03 init 統合 / AC-04 統合 / AC-05 state round-trip / AC-06 全件 pass / AC-07 doctor 診断・異常系）。既存ケースの期待値は変更しない（AC-06 / Forbidden Shortcuts）。NFR-04 分岐 (3 の integration 部分)(5)(6) |
| `docs/cli.md` | `--profile-file` を init / update / doctor の option 表に追加 + custom profile 節（`custom:<name>` 指定方法・定義ファイル schema・built-in（4 base + supabase-rls）との棲み分け・command 直書き実行の信頼境界 + secret 非直書き案内 + 「custom profile は vX.Y 以降」— FR-08 / SEC-01 / SEC-04 / AC-08 / リスク3）。既存 `--profile` の built-in 説明は不変 |

`src/cli/profile.mjs`（`BASE_PROFILES` / `ADDON_PROFILES` / `supportedProfiles` / `parseProfiles`）/ `profile-scripts.mjs`（built-in テーブル）/ `dependency-installer.mjs`（built-in 依存テーブル）/ `profile-diagnostics.mjs`（base 別 if）/ `profile-docs.mjs`（`getProfileDocFiles` は既に汎用パス構築で custom 対応済み）/ `managed-files.mjs`（`getProfileDocFiles` 経由で custom docs を既に扱える）/ `check-config.mjs` / `run.mjs`（`.ai-check.yaml` run config は別責務）/ `package-templates/` 配下 / `tests/cli/profile-composition.test.mjs` と `fixtures/profile-composition.json`（SPEC-0060 の 8 組合せは built-in のみを列挙し不変）は変更しない（SPEC File Scope。custom を `supportedProfiles` に足したくなったら、または 8 組合せ fixture の変更が必要になったら、設計ミスとして立ち止まる）。

## 実装方針

1. **下位モジュール先行の直列実装（SPEC T1→T2→T3→T4）**: 定義解決モジュール（TASK-0232）→ state additive（TASK-0233）→ 3 コマンド統合（TASK-0234）→ docs（TASK-0235）。各段で `node --test tests/cli/*.test.mjs` 全件無修正 pass（特に 8 組合せ fixture 無修正 pass = AC-06）を完了条件に含め、NFR-01 / INV-01（未指定経路不変）を段階ごとに機械確認する。
2. **解決分岐を built-in テーブル参照の手前に置く（SPEC 案A / FR-04 / INV-03 / リスク2）**: init / update / doctor の profile 解決点で「`options.profileFile` あり（or state `customProfile` あり）→ custom 経路」「なし → 既存 built-in 経路」に分岐する。**custom 経路では `parseProfiles` / `getProfileScripts` / `getProfileDevDependencies` / `diagnoseProfileScripts` を一切呼ばない**。これにより custom 名が `profile-scripts.mjs` L95（`BASE_PROFILE_SCRIPTS[profile.base]` の undefined spread → 例外ではなく空 `{}` の silent 縮退）に到達せず、空 gate scripts が黙って書かれる機能不全を構造的に防ぐ。built-in 経路のコードは 1 行も変えない（既存テストの期待値を書き換えたら設計を疑う）。
3. **検証と解決の 1 箇所集約（SEC-02 / SEC-03 / FR-03）**: 定義ファイル読込・パス検証・schema validation・name / step 名パターン検証・scripts 解決を `custom-profile.mjs` に集約し、init / update / doctor は同一関数（`loadCustomProfile` / `resolveCustomProfileScripts`）を呼ぶ。state 経由の `customProfile.filePath` も `install-state.mjs` の validation で同一 SEC-02 パターン（絶対パス / `..` 禁止）を通す（state 改竄でルート外読込を誘発できない — SEC-02）。
4. **YAML サブセットパーサは同方針の別実装（NFR-02 / ASM-04 / 実装メモ）**: `check-config.mjs` の `parseConfigYaml`（version + steps の nesting、inline array、quoted string、bool / number スカラ、JSON escape hatch）と**同構造だが対象が異なる**（`profile:` mapping + `gateScripts:` / `supportScripts:` の mapping + `devDependencies:` の list）ため、`parseConfigYaml` をそのまま流用せず `custom-profile.mjs` に独立実装する（`expect.mjs` の `parseTemplateYaml` が `parseConfigYaml` と別実装なのと同じ判断）。YAML パーサ / schema validator の npm 依存は追加しない（既存 `tests/cli/package.test.mjs` の dependencies 検査で機械検証）。
5. **state additive の同型パターン（FR-06 / NFR-03 / リスク3）**: `customProfile` は SPEC-0061 の `workspace`・SPEC-0056 の `managedFiles` と同じく「存在して valid」か「キー欠落」の 2 状態のみ（`null` / 空を書かない = INV-05）。schemaVersion は 2 のまま、validation は存在時のみ。旧 CLI が `customProfile` 付き state を読んでも未知フィールド無視で valid（ASM-03。リスク3 は受容）。
6. **custom docs は pre-parsed オブジェクトで呼ぶ（SPEC 重要な呼び出し形状 / ASM-02 / AC-03）**: `getProfileDocFiles` は文字列入力を `parseProfiles` に通す（`profile-docs.mjs` L20）ため、custom 名の文字列（`custom:mystack`）をそのまま渡すと未知名 CliError になる。custom 経路は必ず `getProfileDocFiles({ base: "custom-<name>", addons: [], all: ["custom-<name>"] })` の形で呼び、生成される `relativePath = docs/ai-check-template/profiles/custom-<name>/README.md` を AC-03 で明示検証する。templates に該当 README が無ければ `collectManagedFileHashes` の欠落スキップで自然に落ちる（CLI は custom README を生成しない）。`profile-docs.mjs` / `managed-files.mjs` は変更不要。
7. **T3 の一括維持（Big Bang Prompt 回避の確認）**: T3 の File Scope は `init.mjs` / `update.mjs` / `doctor.mjs` + `tests/cli/{init,update,doctor}.test.mjs` の **6 ファイルで 10 未満**のため、SPEC の再検討条項（10 超で分割）に該当せず一括を維持する。3 コマンドは同一の custom 解決経路（`loadCustomProfile` / `resolveCustomProfileScripts`）の呼び出しのみで、分割すると呼び出し側の重複実装（配置規則・解決分岐）を誘発する（AP-02 の 20 ファイル閾値にも非抵触）。
8. **docs は挙動確定後（SPEC T4 依存順序）**: TASK-0234 完了後に docs 化する（確定前の仕様を先に文書化しない）。

## 代替案比較（案A vs 案B / 案C）

SPEC 背景・目的で案A に確定済み。本 PLAN は実装分割にあたり不採用案の帰結を再掲する（実装中に「素直に見える」誘惑で逸脱しないための固定）:

- **採用: 案A（`--profile-file` 明示 opt-in + custom は built-in テーブル参照の手前で別経路解決）** — built-in（`profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs`）を一切変えないため 8 組合せスナップショット・既存全テストが無修正で pass（後方互換のリグレッション面ゼロ = AC-06）。解決を built-in テーブル参照の手前で分岐させれば silent 空 scripts 経路（L95）に custom 名が到達しない（INV-03）。明示 opt-in で暗黙のファイル探索による既存利用破壊がない（NFR-01）。
- **不採用: 案B（custom を `supportedProfiles` に足すレジストリ拡張）** — `profile-composition.test.mjs` が `supportedProfiles` から機械列挙するため 8 → 増加して fixture が壊れ、built-in テーブルにも custom 用の穴（`BASE_PROFILE_SCRIPTS` の custom 名対応など）を開ける必要が生じ、後方互換と最小スコープの両方に反する（リスク4）。
- **不採用: 案C（`.ai-check-profile.*` の暗黙探索・`--profile-file` なしで自動検出）** — built-in profile で運用したい既存利用者のディレクトリに同名ファイルがあると挙動が変わるリグレッション面を作る（SPEC スコープ外「`--profile-file` の暗黙探索」）。

実装中に `profile.mjs` / `profile-composition.test.mjs` / fixture / built-in テーブルへ触れる必要が生じたら、それは案B / 案C への逸脱の兆候であり、設計ミスとして立ち止まる（Forbidden Shortcuts）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0232 | `src/cli/custom-profile.mjs` 新規（定義ファイル読込・YAML サブセットパース・schema validation・SEC-02 / SEC-03 検証・gate/support/deps 解決）+ `tests/cli/custom-profile.test.mjs`（SPEC T1） | Implementation + Test | 4h | - | No（後続が本モジュールに依存） |
| TASK-0233 | `install-state.mjs` の `customProfile` additive 対応（`buildInstallState` / `validateInstallState` / `resolveEffectiveOptions`）+ state round-trip テスト（SPEC T2） | Implementation + Test | 3h | TASK-0232 | No |
| TASK-0234 | `init` / `update` / `doctor` の `--profile-file` 経路（解析・custom モード分岐・scripts 配置・doctor drift 診断）+ `tests/cli/{init,update,doctor}.test.mjs` への追加ケース（SPEC T3、File Scope 6 ファイル — 実装方針 7 のとおり一括維持） | Implementation + Test | 5h | TASK-0233 | No |
| TASK-0235 | `docs/cli.md` の `--profile-file` / custom profile 節追加（SPEC T4） | Implementation | 1h | TASK-0234 | No |

### AC 対応

- **TASK-0232** → AC-01（`.ai-check-profile.yaml` / `.json` 両経路の読込 + gate/support/deps 解決）/ AC-02（`version` 欠落・1 以外、`profile` 欠落、`name` 規則違反、gate 3 種欠落、`supportScripts` 欠落 / 参照 step 実体欠落、未知キー、型不正 — 各 CliError + 書き込み不在）/ AC-04 の unit 部分（`custom:<name>` 形式違反・`custom:` なし・定義 `profile.name` 不一致）/ AC-07 の SEC-02 / SEC-03 unit 部分（絶対パス・`..`・シェルメタ文字入り path / name / step 名）/ AC-03 の unit 部分（`resolveCustomProfileScripts` の非空 scripts 生成・built-in テーブル未参照）。
- **TASK-0233** → AC-05 の state 部分（`init --profile-file` 後 state に `customProfile` 記録 / built-in モードで欠落 / `customProfile` 付き state valid / 絶対パス・`..` `filePath`・gate 3 種欠く `definition`・非文字列 `name` が invalid-install-state / 想定エラー5）+ `resolveEffectiveOptions` の custom 解決（explicit > state > null = PRE-02）。
- **TASK-0234** → AC-03 の integration 部分（`init --profile custom:mystack --profile-file <path>` で gate + support scripts merge、`--install-deps` 対象 deps 一致、docs relativePath = `custom-<name>/README.md`、silent 空 scripts 経路未到達）/ AC-04 の integration 部分（`--profile-file` 併用の built-in 名 CliError・境界ケース2・`--profile-file` 未指定で built-in 解決）/ AC-05 の update 部分（`customProfile` state ありの update が custom 配置規則で更新 + `customProfile` 維持 = POST-02）/ AC-07 の doctor 部分（定義ファイル不在 (a)・state drift (b)・package.json scripts drift (c) の issue 検出、base 別 diagnostics 未発火、`--profile-file ../outside`・絶対パス・メタ文字 CliError）。
- **TASK-0235** → AC-08（`grep -q '\-\-profile-file' docs/cli.md` ヒット + 4 点: `custom:<name>` 指定方法 / 定義ファイル schema / built-in 棲み分け / command 直書き信頼境界 + secret 非直書き）。
- **全 TASK 共通** → AC-06（`node --test tests/cli/*.test.mjs` 全件 pass、8 組合せ fixture 無修正 pass、`supportedProfiles` に custom 名なし・列挙 8 件のまま = NFR-01 後方互換）は各 TASK の完了条件に個別記載し、Round 全体の最終確認は `tasks/done-def-SPEC-0065-round-1.md` の Functional / Architecture Gate で行う。

### NFR-04 分岐対応

SPEC NFR-04 の 7 分岐:
- (1) 定義ファイル YAML / JSON の読み込み成功 = TASK-0232
- (2) schema 妥当性 各必須キー欠落 / 型不正 / gate 欠落 = TASK-0232
- (3) custom モード判定（`--profile-file` あり / built-in 名併用エラー / `custom:<name>` 形式違反）= unit 部分 TASK-0232、integration 部分 TASK-0234
- (4) 生成 scripts（gate + support）の内容 = unit（`resolveCustomProfileScripts`）TASK-0232、integration（init 経由）TASK-0234
- (5) state customProfile の記録 / 欠落 / 不正 = TASK-0233
- (6) doctor の定義ファイル不在 / drift 検出 = TASK-0234
- (7) built-in 8 組合せスナップショット不変 = 全 TASK 共通（AC-06、既存 `profile-composition.test.mjs` 無修正 pass）

### 依存グラフ

TASK-0232 → TASK-0233 → TASK-0234 → TASK-0235（全直列。並列可能な TASK 対なし）。

直列理由: TASK-0232 の正規化 `definition`（`{ gateScripts, supportScripts, devDependencies }`）の形を TASK-0233 の state スナップショットが写し、TASK-0233 の `resolveEffectiveOptions` の custom 解決を TASK-0234 の 3 コマンドが呼ぶ、下位モジュール → 統合の依存順。TASK-0235 は確定挙動の docs 化のため最後。

知識管理: 各 TASK 実装中の想定外エラーは担当 Agent が `sage/failures.md` に FAIL-XXXX 形式で記録する（新規/既存の判定は `sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。custom 定義ファイルの schema 検証誤 reject を記録する際は症状欄冒頭に検索用補助タグ『custom-profile: schema 検証誤 reject』を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01 の機械集計用）。

## リスク

- リスク1（SPEC リスク1）: custom 定義ファイルの schema が「gate scripts の書き方」の自由度と検証の厳しさのバランスを崩し、妥当な定義を誤 reject する / 不正定義を silent に通す → 軽減策: schema は `parseConfigYaml` / `validateCheckConfig`（version + steps + fail-fast）の実績方針に倣い、必須キー・型・gate 3 種網羅・step 名規則・gateScripts↔supportScripts 参照整合を fail-fast で検証（TASK-0232、FR-03 / AC-02）。誤 reject 事例は OPS-01 で観測し、閾値超過で schema 緩和を別 SPEC 化。
- リスク2（SPEC リスク2）: 解決分岐が不完全で custom 名が `profile-scripts.mjs` L95 の undefined spread に到達し、例外ではなく silent に空 gate scripts が生成され custom 導入が黙って失敗する → 軽減策: 解決分岐は `custom-profile.mjs` に集約し custom モードでは `parseProfiles` / built-in テーブルを一切呼ばない（TASK-0232 / TASK-0234、実装方針 2 / INV-03）。custom 経路のテスト（AC-03）で「built-in テーブル未参照 + 定義ファイル由来の**非空** scripts 生成」を固定し、空 scripts 経路に到達しないことを機械確認する。
- リスク3（SPEC リスク3）: 旧 CLI が `customProfile` 付き state を読むと（未知フィールド無視で）built-in profile として診断し、対象 `package.json` の scripts drift を誤報告する → 軽減策: 受容（additive 拡張の既知の限界。schemaVersion を上げると SPEC-0056 の互換マトリクス全体に波及し、フィールド 1 つの追加に過剰。SPEC-0061 `workspace` と同判断）。`docs/cli.md` に「custom profile は vX.Y 以降」を明記（TASK-0235）。
- リスク4（SPEC リスク4）: custom を `supportedProfiles` に足したくなる誘惑（レジストリ拡張の方が「素直」に見える）で 8 組合せスナップショットが壊れる → 軽減策: custom を別経路で解決する設計を SPEC / 契約 / 本 PLAN 代替案節で固定し、`supportedProfiles` 不変・8 組合せ fixture 無修正 pass を AC-06 で機械確認。`profile.mjs` / `profile-composition.test.mjs` / fixture に触れたら設計ミスとして立ち止まる（Forbidden Shortcuts）。
- リスク5（SPEC リスク5）: `gateScripts` / `supportScripts` の command 直書きに secret 混入、または信頼できない定義ファイルを実行する → 軽減策: 信頼境界を SPEC-0058 SEC-01（`.ai-check.yaml` の command 実行）と同一と定義し、`docs/cli.md` に「定義ファイルの command がそのまま実行される。secret を直書きせず env var 経由に」を明記（TASK-0235、SEC-01 / SEC-04）。パス・名前のメタ文字は SEC-02 / SEC-03 で fail-fast（TASK-0232）。
- リスク6（SPEC リスク6）: 機構撤去 → 軽減策: `--profile-file` は opt-in フラグ + optional state フィールド + 新規モジュール（`custom-profile.mjs`）のみで、フラグ受理を落とし state フィールドを無視すれば現行動作へ復旧（built-in 利用者への影響ゼロ）。手順: TASK-0232〜0234 の commit を `git revert` 後 `node --test tests/cli/*.test.mjs` で復旧確認。built-in テーブル・8 組合せスナップショットを一切触っていないため撤去時の回帰面が最小。
- 実装リスク7: `effectiveOptionsSummary` / `installationSummary`（`install-state.mjs`）への `customProfile` 関連キー追加が既存 JSON 期待値テストを壊す → 軽減策: summary へのキー追加は「存在時のみ additive」とし（`workspace` = SPEC-0061 と同パターン）、built-in モードでは summary に custom キーを出さない。壊れる場合も既存期待値は変更せず追加ケース側で検証（TASK-0233 完了条件に転記）。
- 実装リスク8: init と update の custom scripts 配置が独立実装のため配置規則がズレる（POST-02 違反）→ 軽減策: gate/support scripts の merge は既存 `mergeScriptsInto`（init）/ `updateScriptsIn`（update）を「解決済み scripts サブセット」で再利用し、custom 専用の新規 merge 実装を書かない。POST-02（update 後の配置規則が init と同一）を TASK-0234 のテストで固定。

## 必要な検証

- [x] unit test（定義ファイル YAML / JSON 読込 — AC-01 / FR-03 / NFR-02、schema 各異常系 — AC-02 / FR-03、custom モード判定・name / step パターン — AC-04 / AC-07 の SEC-02 / SEC-03 / INV-04、`resolveCustomProfileScripts` 非空 scripts — AC-03 の unit 部分 / INV-03、state validation — AC-05 の state 部分 / FR-06 / INV-05、NFR-04 分岐 (1)(2)(3 unit)(4 unit)(5)）
- [x] integration test（`init --profile custom:<name> --profile-file` の gate/support merge + deps + docs relativePath — AC-03 / FR-04 / FR-05、doctor の custom drift 診断（不在 / state drift / scripts drift）+ base 別 diagnostics 未発火 — AC-07 / FR-07、update の custom 配置維持 + `customProfile` 保持 — AC-05 / POST-01 / POST-02、既存 `node --test tests/cli/*.test.mjs` 全件無修正 pass + 8 組合せ fixture 無修正 pass — AC-06 / NFR-01 / INV-01 / INV-02、NFR-04 分岐 (3 integration)(4 integration)(6)(7)）
- [x] build（`make validate` / `npm pack --dry-run` が壊れない — 配布物は `src/cli/custom-profile.mjs` の追加のみで `package.json` `files` の既存 `src/` パターン内。`tests/` は pack 非同梱）
- [x] security scan（Gate 3: AC-07 のパストラバーサル（絶対パス / `..`）・シェルメタ文字入り path / name / step 名拒否テスト — SEC-02 / SEC-03 / INV-04、state 経由 `filePath` も同一 validation — SEC-02、command 直書き信頼境界の docs 明記 — SEC-01 / SEC-04、新規 npm 依存なし — NFR-02（既存 `tests/cli/package.test.mjs` の dependencies 検査）、既存 `bash scripts/sage-validate.sh` の範囲。定義ファイル / docs に実 secret / 本番 URL / 本番 email を書かない）
- [x] e2e test（N/A: 実 PM バイナリは実行せず、`detectPackageManager` の検出結果を固定した scripts 描画・merge 検証で代替と判断済み。`--install-deps` は既存 `dependency-installer.mjs` の spawn 経路を流用し、custom deps の解決結果（定義ファイル `devDependencies` との一致）を plan レベルで検証する — SPEC-0061 PLAN と同方針）
- [x] architecture boundary check（Gate 4: INV-02 built-in 境界不変 = `profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs` / `profile-docs.mjs` / `managed-files.mjs` / `check-config.mjs` / `run.mjs` / `package-templates/` / `tests/cli/profile-composition.test.mjs` と fixture の無変更 diff 検査、`supportedProfiles` に custom 名なし・8 組合せ列挙 8 件のまま、schemaVersion 2 不変 — SPEC File Scope / AC-06）

## 段階採用 / ロールバック

- 影響ゼロ: `--profile-file` は明示 opt-in で、未指定（かつ state に `customProfile` なし）の init / update / doctor の観測可能な挙動は完全に現行どおり（INV-01 / NFR-01。AC-06 の既存テスト + 8 組合せ fixture 無修正 pass が継続検証）。`customProfile` を持たない既存 install state の読み込み結果も不変（NFR-03）。
- ロールバック: フラグ受理（3 コマンドの解析部）を落とし state の `customProfile` フィールドを無視すれば現行動作へ復旧（SPEC リスク6。手順: TASK-0232〜0234 の commit を `git revert` 後 `node --test tests/cli/*.test.mjs` で復旧確認）。`docs/cli.md` の `--profile-file` / custom profile 節は削除、旧 CLI が `customProfile` 付き state を読んでも未知フィールド無視で valid（ASM-03）。built-in テーブル・8 組合せスナップショットを一切触っていないため回帰面が最小。
- 観測: v1 リリース後 1 リリースサイクル、custom 定義ファイルの schema 検証誤 reject / 利用者の gate/step 書き方の躓き事例を観測（OPS-01）。補助タグ『custom-profile: schema 検証誤 reject』の `sage/failures.md` 3 回累積で schema 緩和を別 SPEC 起票（判定: 次マイナーバージョン PLAN 起票時に `grep -c 'custom-profile: schema 検証誤 reject' sage/failures.md` で機械確認）。custom addon / 合成（`custom:<name>+supabase-rls` / 複数 custom）の需要は roadmap 見直し時に issue / feedback で確認し、必要なら `--profile-file` 複数受理 + custom 合成規則の additive 追加で別 SPEC 起票（OPS-02。契約 (1)(4) の拡張余地を塞がない）。
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（built-in テーブル変更禁止・`supportedProfiles` 追加禁止・未指定経路変更禁止・warning 続行禁止・未検証埋め込み禁止・schemaVersion 変更禁止・YAML パーサ禁止）は AC-02 / AC-05 / AC-06 / AC-07 + 既存 dependencies 検査の機械テストで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを採用）、CLAUDE.md / `.claude/rules/ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり。利用者向け規則は docs/cli.md 更新（TASK-0235）に反映される）。

ロールバック後の利用者影響: 既に `--profile-file` で init/update された利用者環境の package.json / install state は変更されないが、旧 CLI は `customProfile` フィールドを未知フィールドとして無視するため（リスク3 の既知の限界の範囲内で）built-in profile 動作にフォールバックする。`loadCustomProfile` / `resolveCustomProfileScripts` は将来 custom addon / 合成拡張時に再利用可能であり、実装の作り直しは不要（契約節の additive 拡張余地と整合）。
