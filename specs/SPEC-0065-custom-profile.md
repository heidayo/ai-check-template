# SPEC-0065: profile 定義の外部化（custom profile 定義ファイル）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0065 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0005（profiles の出自 — base 4 種の内部テーブルを確立）、SPEC-0020（install state / effective options の出自 — `resolveEffectiveOptions` / `serializeProfile` の解決規則）、SPEC-0056（install state schema v2 + managed file hash 3-way update — additive 拡張の前提。custom profile の記録を schemaVersion を上げずに足す土台）、SPEC-0058（`.ai-check.yaml` config — `parseConfigYaml` / `validateCheckConfig` = 新規依存ゼロで YAML/JSON を読む前例。custom 定義ファイルのパーサを同方針で再利用）、SPEC-0060（profile 合成規則 + 8 組合せスナップショット固定 — 「custom profile の外部定義（依頼 #6）」を明示スコープ外化。本 SPEC がその継続。built-in 合成の不変性を守る回帰ガードの出自） |
| 権限レベル | platform |

## 背景・目的

CLI は `--profile <base>[+supabase-rls]` で **4 つの built-in base profile**（`react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli`）＋ **1 つの addon**（`supabase-rls`）しか受け付けない。この 5 つは `src/cli/profile.mjs` の `BASE_PROFILES`（L3-8）/ `ADDON_PROFILES`（L10）/ `supportedProfiles`（L12-15）に**ハードコード**されており、`parseProfiles`（L17-53）は未知名を CliError で拒否する。したがって「profile にない技術スタック（例: Vue / Svelte / Go / Rust など、あるいは社内独自ツールチェーン）」で `ai:check` 系 gate scripts を生成したい利用者は、CLI 経由では導入できず、手動コピー＋手編集に頼るしかない。事前調査（2026-07-03、`src/cli/` 現行実装 + 合成スナップショット + config パーサ前例）で確認した現状は次のとおり:

- **profile レジストリは 7 モジュールにハードコードされている**。(1) `profile.mjs`（レジストリ本体: `BASE_PROFILES` L3-8 / `ADDON_PROFILES` L10 / `supportedProfiles` L12-15 / `parseProfiles` L17-53 — base ちょうど 1、未知名 CliError）、(2) `profile-scripts.mjs`（`BASE_PROFILE_SCRIPTS` L12-40 / `ADDON_PROFILE_SCRIPTS` L42-47 / `ADDON_CHECK_STEPS` L49-51 / `COMMON_SECURITY_SUPPORT_SCRIPTS` L60-63 / `BASE_PROFILE_SUPPORT_SCRIPTS` L65-73）、(3) `dependency-installer.mjs`（`BASE_PROFILE_DEV_DEPENDENCIES` L20-28 / `ADDON_PROFILE_DEV_DEPENDENCIES` L30-32）、(4) `profile-diagnostics.mjs`（base 別 if 分岐 L42-65 + addon 別 if L67-74）、(5) `profile-docs.mjs`（`getProfileDocFiles`）、(6) `install-state.mjs`（`normalizeProfile` → `parseProfiles`）、(7) `managed-files.mjs`（`getProfileDocFiles` 経由）
- **各モジュールの custom 名に対する現状挙動は不揃い**（事前調査で確定）: `profile-scripts.mjs` の `getProfileScripts`（L91-125）は `BASE_PROFILE_SCRIPTS[profile.base]`（L95）が `undefined` になるが、JS の `{ ...undefined }` は例外を投げず `{}` を返す no-op のため、**silent に空の gate scripts が生成される**（クラッシュではなく機能不全 — `node -e "console.log(JSON.stringify({...undefined}))"` = `{}` で確認）。`dependency-installer.mjs` の `getProfileDevDependencies`（L49-60）は `[profile.base] ?? []`（L51）で **silent に空配列**。`profile-diagnostics.mjs` の `diagnoseProfileScripts`（L34-85）は base 別 if（L42-65）を **全て silent スキップ**（warning ゼロ）。ただし **これらはいずれも到達不能**である — `parseProfiles`（`profile.mjs` L32-37）が未知名を**先に** CliError で弾くため、custom 名は現状これらの下流に届かない。この事実が「解決を built-in テーブル参照の**手前で**分岐させれば、built-in 経路のコードに一切手を入れずに custom を additive に足せる」根拠になる
- **`profile-docs.mjs` の `getProfileDocFiles` は既に汎用パス構築**である。`profiles/${profileName}/README.md`（`profile.base` と各 addon）を allow-list なしで組み立てるため、custom 名でも `profiles/custom-<name>/README.md` 相当の妥当なパス文字列を既に生成できる（doc は追加対応が最小）。`managed-files.mjs` は `getProfileDocFiles` 経由でこれを使う
- **合成スナップショットが built-in の不変性を固定している**。`tests/cli/profile-composition.test.mjs` は `supportedProfiles` から base/addon を機械分類し、**4 base × {なし, +supabase-rls} = ちょうど 8 組合せ**を列挙して `fixtures/profile-composition.json`（top-level `{ baseProfiles, addonProfiles, combinations }`、`combinations` は 8 エントリ、各 `{ scripts, supportScripts, docFiles, managedFileStateKeys }`）と `deepStrictEqual` で照合し、`assert` で件数 8 を固定する。**custom profile を `supportedProfiles` に混ぜると列挙件数が 8 を超えて fixture が壊れる** — したがって custom は `supportedProfiles` に足さず別経路で解決しなければならない（後方互換の設計上の要）
- **新規依存ゼロで YAML/JSON を読む前例がある**。`check-config.mjs` の `parseConfigYaml` / `validateCheckConfig`（`.ai-check.yaml` / `.ai-check.json`、YAML サブセット + JSON escape hatch + fail-fast CliError、`CONFIG_YAML_NAME` / `CONFIG_JSON_NAME` 定数）、`expect.mjs` の `parseTemplateYaml`。`package.json` は runtime / dev dependencies **ゼロ**、`files` に `src/` を含む。custom 定義ファイルのパーサはこの前例と同方針で書き、npm 依存を追加しない
- **install state は additive 拡張の実績がある**。schema v2（`INSTALL_STATE_SCHEMA_VERSION = 2`、`.ai-check-template.json`）は `profile: { base, addons, all }`（`serializeProfile`）を保持し、`validateInstallState` は `normalizeProfile`（→ `parseProfiles`）経由で profile を検証、`resolveEffectiveOptions` は explicit > state > default の優先順で解決する。SPEC-0056 の managedFiles / SPEC-0061 の `workspace` フィールドが「schemaVersion を上げず optional フィールドを additive 追加」した前例に倣う
- **SPEC-0060 が「custom profile の外部定義（利用者定義 profile、依頼 #6）」を明示的に別 SPEC へ deferred**（SPEC-0060 スコープ外節）。SPEC-0060 は built-in 合成規則の固定 + 8 組合せスナップショットのみを担い、custom 外部定義は本 SPEC の担当と定義済み。本 SPEC はその継続であり、SPEC-0060 が固定した built-in 合成の不変性を**壊さない**ことが最優先の制約になる
- **repo に custom profile 機構は 1 つも存在しない**（`grep -rn "custom" src/cli/ docs/cli.md` のヒット（2026-07-03 時点 17 件 = src/cli/ 6 件・docs/cli.md 11 件）はすべて custom hooks / custom workflows / overlay の文脈で、profile 定義とは無関係 = greenfield）

本 SPEC は「**profile 定義ファイルを外部化し、built-in にないスタック向けに custom base profile を opt-in で定義できる**」レイヤを追加する。事前調査に基づき、次の 1 案に確定する:

> **案A: custom profile 定義ファイル（`.ai-check-profile.yaml` / `.ai-check-profile.json`）を `--profile-file <path>` で明示指定し、built-in レジストリ（4 base + supabase-rls）・テーブル・8 組合せスナップショットを一切変えず、custom は「built-in テーブル参照の手前で定義ファイルから解決する」additive な別経路で扱う。**
> - **指定方法**: `init` / `update` / `doctor` に `--profile-file <path>`（`--target` からの相対パス、単一指定）を追加する。`--profile-file` 指定時は custom モードに入り、`--profile` の値は custom profile 名（`custom:<name>` 形式で名前を明示。`<name>` は `[a-z][a-z0-9-]*`）として解釈する。`--profile-file` 未指定時の挙動（built-in profile 解決）は本 SPEC 適用前と**完全に同一**（opt-in の完全性）
> - **定義ファイルの内容（schema version 1）**: 最上位 `version: 1`（必須）＋ `profile:`（必須）。`profile` は `name`（必須、`custom:` 接頭辞を除いた `[a-z][a-z0-9-]*`）、`gateScripts`（必須、`ai:check` / `ai:check:fast` / `ai:check:secure` の 3 gate → コマンド文字列 or step 名リスト）、`supportScripts`（必須、step 名 → コマンド文字列。gate が参照する step 実体）、`devDependencies`（省略可、文字列配列）を持つ。docs は `getProfileDocFiles` の汎用パス構築で custom 名の README パスを既に生成できる（利用者が該当 README を用意する前提。CLI は生成しない）
> - **解決の分岐**: profile 解決を「custom モード（`--profile-file` あり）→ 定義ファイルから scripts / support / deps を解決 / built-in モード（従来）→ 既存テーブル参照」の 2 経路にする。built-in 名指定時のコードパス・出力・8 組合せスナップショットは**完全不変**（fixture 無修正 pass = 後方互換の証左）。custom 経路は `parseProfiles`（built-in 名検証）を通さず、専用パーサ + validation を通す
> - **install state への additive 記録**: `--profile-file` 使用の init / update は state に `customProfile`（optional フィールド）を additive 記録する。記録内容は「custom 名 + 定義ファイルパス + 定義のスナップショット（解決した gate/support/deps）」とし、update / doctor が定義ファイル不在・内容 drift を検出できるようにする。schemaVersion は 2 のまま。SPEC-0056 の managed file hash / 3-way update・SPEC-0061 の `workspace` フィールドと干渉しない
> - **diagnostics**: `profile-diagnostics.mjs` の base 別 if は built-in 専用。custom profile では base 別診断を**スキップ**する（v1 は最小）。custom 固有の診断（定義ファイルの schema 妥当性・state スナップショットとの drift）は doctor で別途行う
> - **validation（fail-fast）**: 定義ファイルの schema（必須キー・型・gate 3 種の網羅・step 名規則）を `run` の config 検証と同方針で fail-fast CliError にする。既定 gate（`ai:check` 系）の step 名前提を壊さない
>
> **案A を採る理由**: (a) built-in を一切変えないため 8 組合せスナップショット・既存全テストが無修正で pass し、後方互換のリグレッション面がゼロ、(b) 解決を built-in テーブル参照の**手前**で分岐させれば `profile-scripts.mjs` の silent 空 scripts 生成経路（L95 の undefined spread）に custom 名を到達させず、空の gate scripts が書かれる機能不全を構造的に防げる、(c) `--profile-file` 明示 opt-in なら暗黙のファイル探索で既存利用を壊さない。custom を `supportedProfiles` に足す案B（レジストリ拡張）は 8 組合せ列挙が壊れ、built-in テーブルにも custom 用の穴を開ける必要が生じて後方互換と最小スコープの両方に反する。定義ファイルを暗黙探索する案C（`--profile-file` なしで `.ai-check-profile.yaml` を自動検出）は「built-in profile で運用したい既存利用者のディレクトリに同名ファイルがあると挙動が変わる」リグレッション面を作るため退ける。

v1 は **1 つの custom base profile を定義ファイルで指定し、init / update / doctor で gate scripts / support scripts / docs / deps を生成**することに限定する。custom addon・複数 custom・custom と built-in addon の合成（`custom:<name>+supabase-rls`）は v1 スコープ外とする理由: (a) built-in addon（`supabase-rls`）の合成は `profile-scripts.mjs` の内部テーブルに依存し、custom base とのマージは SPEC-0060 の合成規則（同名キー競合エラー等）を custom 経路に再実装する必要があって最小スコープを大きく超える、(b) custom base 1 つで「built-in にないスタックを CLI で導入する」という依頼 #6 の核は満たせる、(c) 需要が実証されたら別 SPEC で custom addon / 合成を additive に拡張できる（フラグ形態・state 形状とも拡張余地を塞がない — 契約節参照）。

## 対象ユーザー

- built-in にないスタック（Vue / Svelte / Go / Rust / 社内独自ツールチェーン等）で開発する CLI 利用者 — `.ai-check-profile.yaml` に gate scripts / support scripts を宣言し、`npx ai-check-template init --profile custom:mystack --profile-file ./.ai-check-profile.yaml` で built-in と同じ managed files（docs / hooks / CI）＋ custom gate scripts を導入できる
- built-in profile（4 base + supabase-rls）で運用する既存利用者 — `--profile-file` 未指定なら観測可能な挙動は**完全に現行どおり**（影響ゼロ）。8 組合せスナップショットも不変
- 本リポ maintainer — built-in profile の追加（`supabase-rls` 以外の base/addon）は従来どおりテーブル拡張で行い、custom は「利用者が自プロジェクトで定義するもの」として棲み分ける（custom 定義の共有レジストリ配布はしない）
- Review Agent / CI — custom 定義ファイルの読み込み・schema 妥当性・生成 scripts・built-in スナップショット不変・異常系がテストで固定される

## スコープ（含む）

- `init` / `update` / `doctor` への `--profile-file <path>`（および `--profile-file=<path>`）オプション追加。値は `--target` からの相対パス、単一指定のみ。`--profile-file` 指定時は custom モードに入り、`--profile` の値を `custom:<name>` として解釈する
- custom profile 定義ファイル（`.ai-check-profile.yaml` / `.ai-check-profile.json`）のパーサ + validation（新規 `src/cli/custom-profile.mjs` に集約）。SPEC-0058 の `parseConfigYaml` / `validateCheckConfig` と同方針の最小 YAML サブセット自前パーサ + `.json` escape hatch + fail-fast CliError。新規 npm 依存ゼロ
- 定義ファイル schema version 1: 最上位 `version: 1`（必須）＋ `profile:`（必須）。`profile` = `name`（必須、`[a-z][a-z0-9-]*`）/ `gateScripts`（必須、`ai:check` / `ai:check:fast` / `ai:check:secure` の 3 gate を網羅）/ `supportScripts`（必須、step 名 → コマンド）/ `devDependencies`（省略可、文字列配列）
- custom profile の解決分岐: profile 解決を built-in テーブル参照の**手前**で分岐させ、custom モードでは定義ファイルから gate scripts / support scripts / deps を解決する。built-in モード（`--profile-file` 未指定）は既存経路をそのまま通す。custom 経路は `profile-scripts.mjs` / `dependency-installer.mjs` の built-in テーブルを参照しない
- scripts / support / deps / docs の生成: custom モードで、gate scripts（`ai:check*`）＋ support scripts（step 実体）を対象 `package.json` に merge し、dev dependencies を `--install-deps` 対象にし、docs は `getProfileDocFiles` の汎用パス（`profiles/custom-<name>/README.md` 相当。ファイルが templates に無ければ既存の欠落スキップ規則に従う）を通す。gate scripts の PM 別描画（`renderScriptCommand`）は built-in と同じ変換を通す
- install state の additive 拡張: schema v2 のまま optional フィールド `customProfile`（`{ name, filePath, definition: { gateScripts, supportScripts, devDependencies } }` の正規化スナップショット）を追加。built-in モード init では**フィールド自体を書かない**。validation は存在時のみ
- `doctor` の custom 認識: state の `customProfile`（または明示 `--profile-file`）を effective options に解決し、(a) 定義ファイルの存在、(b) 定義ファイル内容と state スナップショットの drift、(c) 対象 `package.json` の gate/support scripts の drift を issue として検出する。base 別 diagnostics（`profile-diagnostics.mjs` の if 分岐）は custom では実施しない
- `update` の custom 認識: state（または `--profile-file`）から custom profile を解決し、init と同じ規則で scripts を更新し、state の `customProfile` を維持・更新する。定義ファイル不在なら CliError（部分書き込みなし）
- テスト追加（custom 定義ファイルの読み込み・schema 妥当性・生成 scripts の検証・built-in 8 組合せスナップショット不変の回帰・異常系）
- `docs/cli.md` への `--profile-file` / `custom:<name>` / 定義ファイル schema / built-in との棲み分けの記載

## スコープ外（明示的に除外）

- **built-in profile テーブルの変更** — `profile.mjs` の `BASE_PROFILES` / `ADDON_PROFILES` / `supportedProfiles` / `parseProfiles`、`profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs` の built-in テーブル・if 分岐は**一切変えない**。custom は別経路で解決し、`supportedProfiles` に custom 名を足さない（8 組合せスナップショットの不変性を守る）
- **既存 8 組合せスナップショット（`tests/cli/fixtures/profile-composition.json`）の変更** — built-in の合成結果は不変。fixture の無修正 pass が後方互換の証左（SPEC-0060 の回帰ガードを壊さない）
- **custom addon の外部定義** — v1 は custom **base** のみ。custom addon（`+custom:<name>` の addon 合成）は対象外
- **複数 custom profile の同時定義 / 合成** — v1 は `--profile-file` 単一・custom base 1 つのみ。複数指定・`custom:<name>+supabase-rls`（custom base + built-in addon の合成）・`custom:a+custom:b`（custom 同士の合成）は対象外
- **custom profile の diagnostics ルール定義** — `profile-diagnostics.mjs` の base 別 if に相当する「custom base ごとの推奨 script チェック」は定義しない。custom では base 別診断をスキップし、doctor は定義ファイルの schema 妥当性・state drift・package.json scripts drift のみ診断する（v1 最小）
- **profile 定義の共有レジストリ** — custom 定義の npm パッケージ配布・レジストリ公開・`--profile-file <url>` の遠隔取得は対象外。定義ファイルは利用者プロジェクト内のローカルファイルに限る
- **built-in profile への custom 定義ファイルの適用** — `--profile-file` は custom モード専用。built-in 名（`react-nextjs` 等）に `--profile-file` を併用した場合は CliError（混同を fail-fast で防ぐ）
- **`.ai-check.yaml`（SPEC-0058 run config）との統合** — 別ファイル・別責務。custom profile 定義ファイル（`.ai-check-profile.*`、init が読む profile 雛形）と run config（`.ai-check.*`、run が読む step 上書き）は共存し、本 SPEC は `run.mjs` / `check-config.mjs` に触れない
- **custom 定義ファイルの雛形配布・init での生成** — 定義ファイルは利用者が手書きする（docs に例を記載）。managed file にせず、init は生成しない・update は上書きしない・doctor は「存在と内容 drift」のみ見て内容そのものは managed hash 化しない（SPEC-0057 overlay / SPEC-0058 config と同じ非管理原則）
- **`--profile-file` の暗黙探索（自動検出）** — `--profile-file` 明示指定のみ。`.ai-check-profile.*` を自動探索しない（既存 built-in 利用者のディレクトリに同名ファイルがある場合のリグレッションを避ける）
- **`--profile-file` と `--install-deps` の非互換化** — 両立させる（custom の `devDependencies` を `--install-deps` 対象にするのは v1 の含むスコープ）。SPEC-0061 の `--workspace` × `--install-deps` 非互換とは別の判断（workspace はルート誤インストール事故防止のため排他したが、custom deps は対象 package.json が単一で事故要因がないため両立させる）
- **新規 npm 依存の追加** — YAML パーサ・schema validator 等ゼロ。定義ファイルは `parseConfigYaml` 同方針の自前サブセットパーサ + `.json` escape hatch で読む

## 要件

### 機能要件

- [FR-01] オプション追加: `init` / `update` / `doctor` は `--profile-file <path>`（および `--profile-file=<path>`）を受理する。値は `--target` からの相対パス。2 回以上の指定は CliError（単一指定制限）。`--profile-file` 未指定時、3 コマンドの観測可能な挙動（出力・書き込み内容・exit code）は本 SPEC 適用前と同一である
- [FR-02] custom モード判定と profile 名解釈: `--profile-file` 指定時は custom モードに入る。`--profile` の値は `custom:<name>` 形式でなければ CliError（`custom:` 接頭辞と `[a-z][a-z0-9-]*` の `<name>`）。built-in 名（`react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli` / `supabase-rls`）に `--profile-file` を併用した場合は CliError（混同の fail-fast）。定義ファイル内の `profile.name` は `<name>`（`custom:` を除いた部分）と一致しなければ CliError
- [FR-03] 定義ファイルの読み込みと schema（fail-fast）: `--profile-file` のパスから `.ai-check-profile.yaml`（YAML サブセット）または `.ai-check-profile.json`（`JSON.parse`）を読む（拡張子で判定。SPEC-0058 の `parseConfigYaml` / JSON escape hatch と同方針）。schema version 1: 最上位 `version: 1`（必須）＋ `profile`（必須）。`profile.name`（必須、`[a-z][a-z0-9-]*`）、`profile.gateScripts`（必須、`ai:check` / `ai:check:fast` / `ai:check:secure` の 3 キーを網羅。各値はコマンド文字列 or step 名リスト）、`profile.supportScripts`（必須、step 名 `[a-z][a-z0-9:_-]*` → 非空コマンド文字列の mapping。gateScripts が参照する step 名を含む）、`profile.devDependencies`（省略可、非空文字列の配列）。パース不能・`version` 不正・必須キー欠落・未知キー・型不正・gate 3 種の欠落・step 名規則違反・gateScripts が参照する step 実体が supportScripts に無い、のいずれかで対象ファイル名と原因を含む CliError（部分書き込みなし）
- [FR-04] custom 解決の分岐（built-in 経路の非干渉）: profile 解決は built-in テーブル参照の**手前**で custom / built-in を分岐する。custom モードでは定義ファイルから gate scripts / support scripts / dev dependencies を解決し、`profile-scripts.mjs`（`BASE_PROFILE_SCRIPTS` 等）・`dependency-installer.mjs`（`BASE_PROFILE_DEV_DEPENDENCIES` 等）の built-in テーブルを参照しない。custom 経路は `parseProfiles`（built-in 名検証）を通さず custom 専用の解決を通す。built-in モードは既存経路をそのまま通り、コードパス・出力が不変である
- [FR-05] scripts / support / deps / docs の生成: custom モードで、gate scripts（`ai:check` / `ai:check:fast` / `ai:check:secure`）＋ support scripts（step 実体）を対象 `package.json` に merge する（keep / skip / overwrite の既存規則を適用）。gate scripts の PM 別描画（`renderScriptCommand` 相当の `pnpm <step>` → PM 別変換）は built-in と同じ変換を通す。`devDependencies` は `--install-deps` の対象にする。docs は `getProfileDocFiles`（汎用パス）を通し、`profiles/custom-<name>/README.md` 相当が templates に無ければ既存の欠落スキップ規則に従う（CLI は custom README を生成しない）
- [FR-06] install state の additive 拡張: `--profile-file` 使用の init / update は state に `customProfile`（optional）を記録する。内容は `{ name: "<name>", filePath: "<相対パス>", definition: { gateScripts, supportScripts, devDependencies } }`（解決・正規化済みスナップショット）。built-in モードではフィールドを書かない。`validateInstallState` は `customProfile` が存在する場合のみ検証（`name` 規則・`filePath` の非空 / 絶対パス禁止 / `..` 禁止・`definition` の gate 3 種網羅）し、schemaVersion は 2 のまま。v1 state・`customProfile` 無し v2 state は従来どおり valid（SPEC-0056 の validation を破らない）。built-in profile の state に `customProfile` が現れることはない
- [FR-07] doctor / update の custom 解決: 明示 `--profile-file` > state の `customProfile` > なし（built-in 動作）の優先順で解決する（`resolveEffectiveOptions` の他オプションと同じ規則）。doctor は custom 解決時に (a) 定義ファイルの存在、(b) 定義ファイル内容と state スナップショットの drift、(c) 対象 `package.json` の gate/support scripts の drift を issue（非 0）として検出する。base 別 diagnostics（`profile-diagnostics.mjs` の if 分岐）は custom では実施しない。update は custom 解決時に init と同じ配置規則で scripts を更新し `customProfile` を維持・更新する。定義ファイル不在時は CliError（部分書き込みなし）
- [FR-08] built-in との棲み分けの明示: custom profile は `supportedProfiles`（`profile.mjs`）に**追加しない**。8 組合せスナップショット（`profile-composition.test.mjs` / `fixtures/profile-composition.json`）は built-in のみを列挙し、custom profile の追加後も無修正で pass する。`docs/cli.md` に custom profile が「利用者定義の別経路」であり built-in（4 base + supabase-rls）とは棲み分ける旨を明記する

### 非機能要件

- [NFR-01] 後方互換: `--profile-file` 未指定の全経路（init / update / doctor × 全 built-in profile × 全 PM）で観測可能な挙動が不変（検証: 既存 `tests/cli/*.test.mjs` が無修正期待値部分で pass し続け、特に `tests/cli/profile-composition.test.mjs` の 8 組合せ fixture が無修正で pass すること = AC-06）。`customProfile` フィールドを持たない既存 install state の読み込み結果も不変
- [NFR-02] 新規依存ゼロ: custom 定義ファイルの読み込みは `node:fs` / `node:path` + `parseConfigYaml` 同方針の自前 YAML サブセットパーサ + `JSON.parse` のみで行い、YAML パーサ / schema validator を導入しない。`package.json` runtime / dev dependencies ゼロを維持（検証: `tests/cli/package.test.mjs`）
- [NFR-03] state 拡張は additive のみ: schemaVersion は 2 のまま、既存フィールドの意味・validation を変えない。旧 CLI が `customProfile` 付き state を読んだ場合もエラーにならない（未知フィールドとして無視される — 現行実装の事実。リスク3 参照）。SPEC-0056 の managedFiles・SPEC-0061 の `workspace` フィールドの validation と干渉しない
- [NFR-04] 新規コードパス（custom 定義パース・schema validation・解決分岐・state validation・doctor drift 検出）は各分岐に最低 1 テストケースを対応させる。対象分岐: (1) 定義ファイル YAML / JSON の読み込み成功 (2) schema 妥当性 各必須キーの欠落 / 型不正 / gate 欠落 (3) custom モード判定（`--profile-file` あり / built-in 名併用エラー / `custom:<name>` 形式違反）(4) 生成 scripts（gate + support）の内容 (5) state customProfile の記録 / 欠落 / 不正 (6) doctor の定義ファイル不在 / drift 検出 (7) built-in 8 組合せスナップショット不変（分岐網羅はテストケース列挙で担保、カバレッジツール導入不要 — SPEC-0060 NFR-04 / SPEC-0061 NFR-04 と同方針）

### セキュリティ要件

- [SEC-01] 任意コマンド実行の信頼境界: custom 定義ファイルの `gateScripts` / `supportScripts` には**任意のコマンド文字列**が入り、生成された `package.json` scripts 経由で実行される。定義ファイルは利用者プロジェクト内のローカルファイルであり、`package.json` scripts・`.ai-check.yaml`（SPEC-0058 SEC-01）と同一の信頼境界内のため、追加のサンドボックス・署名検証は行わない。ただし `docs/cli.md` に「定義ファイルの command がそのまま package.json scripts に書き込まれ実行される。信頼できない定義ファイルを使わないこと」を明記する
- [SEC-02] パストラバーサル防止: `--profile-file` の値および state の `customProfile.filePath` は絶対パス・`..` セグメントを含む場合に CliError とし、正規化後のパスが `--target` 配下であることを保証する（`--target` 外のファイル読み込み経路を作らない）。state 経由の `filePath` も同一 validation を通る（state 改竄でルート外読み込みを誘発できない）
- [SEC-03] profile 名 / step 名の埋め込み検証: `profile.name`（`[a-z][a-z0-9-]*`）・step 名（`[a-z][a-z0-9:_-]*`）は docs パス構築（`profiles/custom-<name>/README.md`）や scripts 文字列に埋め込まれるため、パターン外の値は CliError とする（利用者定義ファイルは信頼境界の外側の入力として扱い、シェルメタ文字・パスセパレータの混入を弾く）
- [SEC-04] secret 非混入の案内: custom 定義ファイル・docs 追記に、実在の secret / token / API key の実値 / 本番 URL / 本番 email を例示として書かない。`docs/cli.md` の custom profile ガイドに「定義ファイルの command に secret を直書きせず env var / secret manager 経由にする」を明記する（SPEC-0058 SEC-02 と同方針）

### 運用要件

- [OPS-01] 定義ファイル schema 誤りの段階観測: v1 リリース後 1 リリースサイクル、custom 定義ファイルの「schema 検証が実在の妥当な定義を誤って reject する」「利用者が gate/step の書き方で躓く」事例を観測する。該当事例が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'custom-profile: schema 検証誤 reject' sage/failures.md` で機械的に件数確認する。原因タグ『custom-profile: schema 検証誤 reject』は固定文字列とし表記ゆれを禁止する。failures.md 記録時は既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）のうち該当値と併記し、症状欄冒頭に検索用補助タグ『custom-profile: schema 検証誤 reject』を付す。原因タグは cause enum を置き換えず補助的に追加する）、schema の緩和（任意キーの許容・エラーメッセージ改善）を別 SPEC で起票する
- [OPS-02] custom addon / 合成需要の観測: 利用者要望・dogfooding で「custom base + built-in addon の合成」「custom addon」「複数 custom」の需要が確認されたら、別 SPEC で `--profile-file` の複数受理・custom 合成規則（SPEC-0060 の合成規則を custom 経路へ適用）を additive に検討する。判定は roadmap 見直し時に issue / feedback を確認して行う（本 SPEC の単一 custom base 提供は、将来の custom 合成への移行余地を塞がない — 契約節参照）

## File Scope

| 区分 | ファイル |
|---|---|
| 新規（CLI） | `src/cli/custom-profile.mjs`（定義ファイルの読み込み・YAML サブセットパース・schema validation・SEC-02/03 検証・gate/support/deps の解決 / 正規化の集約） |
| 変更（CLI） | `src/cli/init.mjs`, `src/cli/update.mjs`, `src/cli/doctor.mjs`（`--profile-file` 解析・custom モード分岐・scripts 配置・診断）, `src/cli/install-state.mjs`（`customProfile` フィールドの additive 対応 + `resolveEffectiveOptions` の custom 解決） |
| 新規（テスト） | `tests/cli/custom-profile.test.mjs`（定義パース・schema 妥当性・解決・SEC ケース・生成 scripts） |
| 変更（テスト） | `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`（custom 経路の追加ケースのみ。既存ケースの期待値は変更しない） |
| ドキュメント | `docs/cli.md`（`--profile-file` / `custom:<name>` / 定義ファイル schema / built-in 棲み分け節の追加） |

上記以外への変更は本 SPEC のスコープ外。特に **`src/cli/profile.mjs`（`BASE_PROFILES` / `ADDON_PROFILES` / `supportedProfiles` / `parseProfiles` — built-in レジストリ不変）、`src/cli/profile-scripts.mjs`（`BASE_PROFILE_SCRIPTS` 等の built-in テーブル不変）、`src/cli/dependency-installer.mjs`（built-in 依存テーブル不変）、`src/cli/profile-diagnostics.mjs`（base 別 if 不変 — custom では未使用）、`src/cli/profile-docs.mjs`（`getProfileDocFiles` は既に汎用パス構築で custom 対応済み — 変更不要）、`src/cli/managed-files.mjs`（`getProfileDocFiles` 経由で custom docs を既に扱える — 変更不要）、`src/cli/check-config.mjs` / `src/cli/run.mjs`（`.ai-check.yaml` run config は別責務）、`tests/cli/profile-composition.test.mjs` と `tests/cli/fixtures/profile-composition.json`（SPEC-0060 の 8 組合せスナップショットは built-in のみを列挙し不変。変更が必要になった時点で設計ミスとして立ち止まる）、`package-templates/` 配下**は**変更しない**。custom docs の生成が必要になっても `getProfileDocFiles` は既に汎用のため `profile-docs.mjs` を触らない（利用者が README を用意する前提）。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: custom 定義ファイルの読み込み — `.ai-check-profile.yaml`（YAML サブセット）と `.ai-check-profile.json`（`JSON.parse`）の両方が読み込め、`version: 1` + `profile: { name, gateScripts, supportScripts, devDependencies? }` の妥当な定義から gate scripts（3 gate）/ support scripts / deps が解決される。YAML サブセットで表現できない構造は `.json` escape hatch で等価に扱える（SPEC-0058 の `parseConfigYaml` 同方針。テストで YAML / JSON 両経路を検証）（FR-03 / FR-04 / NFR-02）【種別: unit】
- [ ] AC-02: schema 妥当性の fail-fast — `version` 欠落 / 1 以外、`profile` 欠落、`profile.name` の規則違反、`gateScripts` の gate 3 種（`ai:check` / `ai:check:fast` / `ai:check:secure`）いずれかの欠落、`supportScripts` 欠落 / gateScripts が参照する step 実体の欠落、未知キー、型不正 — の各入力が対象ファイル名と原因を含む CliError（非 0 終了）になり、ファイルへの書き込みが発生しない（テストで各ケース検証）（FR-03）【種別: unit】
- [ ] AC-03: 生成される scripts の検証 — `init --profile custom:mystack --profile-file <path>` で、対象 `package.json` に gate scripts（`ai:check` / `ai:check:fast` / `ai:check:secure`、PM 別描画）＋ support scripts（gateScripts が参照する step 実体）が merge され、`--install-deps` 対象の dev dependencies が定義ファイルの `devDependencies` と一致する。custom 経路は built-in テーブル（`BASE_PROFILE_SCRIPTS` 等）を参照せず定義ファイルから解決している（テストで検証。built-in の silent 空 scripts 生成経路に到達せず、生成 scripts が非空である）（FR-04 / FR-05）【種別: integration】
- [ ] AC-04: custom モード判定と profile 名 — `--profile-file` 併用時に `--profile custom:mystack` が custom モードで解決され、`--profile-file` 併用の built-in 名（`--profile react-nextjs --profile-file ...`）・`custom:` 接頭辞なし・`custom:` 名の規則違反・定義ファイル `profile.name` との不一致が各 CliError になる。`--profile-file` 未指定時は従来どおり built-in が解決される（テストで検証）（FR-02）【種別: unit + integration】
- [ ] AC-05: install state の custom 記録と round-trip — `init --profile-file` 後の state に `customProfile: { name, filePath, definition }` が記録され、built-in モード init の state には `customProfile` キーが存在しない。`customProfile` 付き state は `loadInstallState` で valid、絶対パス / `..` 入り `filePath`・gate 3 種を欠く `definition`・非文字列 `name` は invalid-install-state になる。`update`（フラグなし、`customProfile` state あり）が custom 配置規則で scripts を更新し `customProfile` を維持する（テストで検証）（FR-06 / FR-07 / SEC-02）【種別: unit + integration】
- [ ] AC-06: built-in スナップショット不変の回帰 — `node --test tests/cli/*.test.mjs` が全件パスし、`tests/cli/profile-composition.test.mjs` の 8 組合せ fixture（`fixtures/profile-composition.json`）が**無修正**で pass し続ける。`supportedProfiles` に custom 名が追加されておらず、8 組合せ列挙が 8 件のままである（NFR-01 の後方互換検証。custom 追加が built-in 合成を変えていないことの証左）【種別: unit + integration】
- [ ] AC-07: doctor の custom 診断と異常系 — state に `customProfile` がある target への `doctor`（フラグなし）が custom モードで診断し、(a) 定義ファイル不在、(b) 定義ファイル内容と state スナップショットの drift、(c) 対象 `package.json` の gate/support scripts drift を issue（非 0）として検出する。base 別 diagnostics（`profile-diagnostics.mjs`）は custom では発火しない。`--profile-file ../outside`・絶対パス・シェルメタ文字入り定義パスが CliError になる（テストで検証）（FR-07 / SEC-02 / SEC-03）【種別: integration + unit】
- [ ] AC-08: `docs/cli.md` に custom profile の記載 — `grep -q '\-\-profile-file' docs/cli.md` がヒットし、(1)`custom:<name>` の指定方法、(2) 定義ファイル schema（`version` / `profile.gateScripts` / `supportScripts` / `devDependencies`）、(3) built-in（4 base + supabase-rls）との棲み分け（custom は `supportedProfiles` に足さない別経路）、(4) command 直書き実行の信頼境界 + secret 非直書き案内、の 4 点が同節に含まれることをレビューで確認する（FR-08 / SEC-01 / SEC-04）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit | Gate 2: Functional |
| AC-02 | unit | Gate 2: Functional |
| AC-03 | integration | Gate 2: Functional |
| AC-04 | unit + integration | Gate 2: Functional |
| AC-05 | unit + integration | Gate 2: Functional |
| AC-06 | unit + integration | Gate 2: Functional（+ Gate 4: Architecture の built-in 境界不変観点） |
| AC-07 | integration + unit | Gate 2: Functional（+ Gate 3: Security の SEC-02/03 観点） |
| AC-08 | docs | Gate 1: Structural（+ Gate 3: Security の SEC-01/04 観点） |

AC-01〜AC-07 のテストは `tests/cli/custom-profile.test.mjs` および既存 `tests/cli/{init,update,doctor}.test.mjs` への追加ケースとして、現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs`（AC-06）の実行対象に自動で含まれるため、CI 上は追加の workflow 設定なし・package.json 変更なしで必須チェック化される。AC-08 は docs の静的検証（grep + レビュー）で、preflight（`npm pack` 内容検査等）を壊さないことを含めて確認する。

## 異常系

- 想定エラー1（定義ファイル不在）: `--profile-file ./missing.yaml` でファイルが存在しない、または state の `customProfile.filePath` が指すファイルが削除された場合 → パスと target を含む CliError で非 0 終了し、何も書き込まない。doctor は定義ファイル不在を issue（非 0）として報告する（検証条件は AC-02 / AC-07 (a) を一次情報源とする）。実装中の想定外エラーは Error Resolution Protocol に従い run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` 追記
- 想定エラー2（schema 不正）: 定義ファイルの `version` 不正・必須キー欠落・gate 3 種の欠落・step 名規則違反・型不正・gateScripts が参照する step 実体が supportScripts に無い場合 → 対象ファイル名と原因を含む CliError で非 0 終了し、ファイルへの書き込みが発生しない（silent に不正定義を適用しない。検証条件は AC-02 を一次情報源とする）
- 想定エラー3（built-in 名との衝突）: `--profile react-nextjs --profile-file ...`（built-in 名に定義ファイル併用）や、custom 定義の `profile.name` が built-in 名（`react-nextjs` 等）と一致する場合 → CliError で非 0 終了する。custom は built-in を上書き・置換せず、`--profile-file` は custom モード専用である（`supportedProfiles` に custom を足さない。検証条件は AC-04 を一次情報源とする）
- 想定エラー4（パストラバーサル / メタ文字）: `--profile-file` の値が絶対パス・`..` 入り、または定義ファイルの `profile.name` / step 名がパターン外（シェルメタ文字・パスセパレータ入り）→ CliError で非 0 終了する（検証条件は AC-07 の SEC-02/03 ケースを一次情報源とする）
- 想定エラー5（state customProfile の不正）: install state の `customProfile` が不正（非文字列 `name`・絶対パス / `..` 入り `filePath`・gate 3 種を欠く `definition`）→ `loadInstallState` が invalid-install-state を返し、doctor は state issue として報告、update は既存の invalid state 経路（`assertWritableInstallState` 相当）で書き込み拒否する（検証条件は AC-05 を一次情報源とする）
- 境界ケース1（custom README 不在）: custom docs（`profiles/custom-<name>/README.md` 相当）が templates に存在しない場合 → `getProfileDocFiles` は汎用パスを組み立てるが、`collectManagedFileHashes` の既存の欠落スキップ規則により managed 一覧から自然に落ちる（CLI は custom README を生成しない前提。エラーにしない。検証条件は AC-03 / AC-06 を一次情報源とする）
- 境界ケース2（`--profile-file` だが `--profile` 未指定）: `--profile-file` があるが `--profile` の既定値（`react-nextjs`）のまま = built-in 名になる → 想定エラー3 と同じ経路で CliError（custom モードは `--profile custom:<name>` を要求する。既定値の built-in 名では custom に入れない旨を案内。検証条件は AC-04 を一次情報源とする）

## 契約

- API: (1) **`--profile-file <path>`**: init / update / doctor 共通、単一・相対パスのみ。未指定時の挙動は現行と完全同一（opt-in）。将来の複数指定 / custom 合成は同フラグの複数回受理 or state の型拡張として additive に拡張可能（v1 では 2 回目で CliError）。 (2) **custom モード**: `--profile-file` 指定時のみ有効で、`--profile custom:<name>` を要求。built-in 名との併用は CliError。custom は `supportedProfiles`（`profile.mjs`）に追加されず、built-in レジストリ・テーブル・8 組合せスナップショットを変えない別経路で解決される。 (3) **定義ファイル schema（version 1）**: 最上位 `version: 1` + `profile: { name, gateScripts（ai:check/fast/secure 網羅）, supportScripts, devDependencies? }`。SPEC-0058 の `parseConfigYaml` 同方針の YAML サブセット + `.json` escape hatch で読む。将来の schema 拡張は version 追加 or optional キー追加で additive に行う。 (4) **install state**: schema v2 に optional `customProfile: { name, filePath, definition }` を additive 追加。欠落 = built-in。将来の複数 custom 対応は `customProfile` の型拡張ではなく別フィールドの additive 追加で行い、既存フィールドの意味を変えない。SPEC-0056 の managedFiles / 3-way・SPEC-0061 の `workspace` と非干渉。 (5) **built-in 境界の保存**: built-in profile（4 base + supabase-rls）の合成結果（`getProfileScripts` / `getProfileSupportScripts` / `getProfileDocFiles` / `getManagedFiles`）は本 SPEC で不変。custom は built-in テーブルを参照しない。 (6) **run config 非干渉**: `.ai-check.yaml`（SPEC-0058）と custom 定義ファイル（`.ai-check-profile.*`）は別ファイル・別責務で、`run.mjs` / `check-config.mjs` は不変。
- DB: なし
- イベント: なし

## リスク

- リスク1: custom 定義ファイルの schema が「gate scripts の書き方」の自由度と検証の厳しさの間でバランスを崩し、妥当な定義を誤って reject する、または不正な定義を silent に通す → 軽減策: schema は SPEC-0058 の `parseConfigYaml` / `validateCheckConfig`（version + steps + fail-fast）の実績ある方針に倣い、必須キー・型・gate 3 種網羅・step 名規則・gateScripts↔supportScripts 参照整合を fail-fast で検証する（FR-03 / AC-02）。誤 reject 事例は OPS-01 で観測し、閾値超過で schema 緩和を別 SPEC 化する
- リスク2: custom 解決を built-in テーブル参照の手前で分岐させる実装が不完全で、custom 名が `profile-scripts.mjs` L95（`BASE_PROFILE_SCRIPTS[profile.base]` の undefined spread）に到達すると、例外ではなく **silent に空の gate scripts が生成され** custom 導入が黙って失敗する → 軽減策: 解決分岐は `custom-profile.mjs` に集約し、custom モードでは `parseProfiles` / built-in テーブルを一切呼ばない。custom 経路のテスト（AC-03）で「built-in テーブル未参照 + 定義ファイル由来の**非空** scripts 生成」を固定し、空 scripts 経路に到達しないことを機械確認する
- リスク3: 旧バージョン CLI が `customProfile` 付き state を読むと（未知フィールド無視により）built-in profile として診断し、対象 `package.json` の scripts drift を誤報告する → 軽減策: 受容する（additive 拡張の既知の限界。schemaVersion を上げると SPEC-0056 の互換マトリクス全体に波及し、フィールド 1 つの追加に対して過剰。SPEC-0061 `workspace` と同じ判断）。`docs/cli.md` に「custom profile は vX.Y 以降」を明記する
- リスク4: custom を `supportedProfiles` に足したくなる誘惑（レジストリ拡張の方が「素直」に見える）で 8 組合せスナップショットが壊れる → 軽減策: custom を別経路で解決する設計を SPEC / 契約で固定し、`supportedProfiles` 不変・8 組合せ fixture 無修正 pass を AC-06 で機械確認する。`profile.mjs` / `profile-composition` に触れたら設計ミスとして立ち止まる（Forbidden Shortcuts）
- リスク5: custom 定義の `gateScripts` / `supportScripts` の command 直書きに secret を混入させる、または信頼できない定義ファイルを実行してしまう → 軽減策: 信頼境界を SPEC-0058 SEC-01（`.ai-check.yaml` の command 実行）と同一と定義し、`docs/cli.md` に「定義ファイルの command がそのまま実行される。secret を直書きせず env var 経由に」を明記（SEC-01 / SEC-04）。パス・名前のメタ文字は SEC-02 / SEC-03 で fail-fast する
- リスク6: 機構を撤去する必要が生じた場合 → 軽減策: `--profile-file` は opt-in フラグ + optional state フィールド + 新規モジュール（`custom-profile.mjs`）のみで、フラグ受理を落とし state フィールドを無視すれば現行動作に戻る（built-in 利用者への影響ゼロ）。built-in テーブル・8 組合せスナップショットを一切触っていないため、撤去時の回帰面が最小

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: `--profile-file` / custom profile は配布 CLI の利用者向け機能であり、本リポの開発運用ルールに影響しない。配布物ドキュメントの一次情報源は `docs/cli.md` で、CLAUDE.md / `ai-check-template.md` は既に参照型（配布物・profile の fixed-list を持たない）ため追記不要。built-in profile レジストリを変えないため `package-templates/profiles/` の master 一覧も不変）
- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。OPS-01 の原因タグ『custom-profile: schema 検証誤 reject』を該当時に付す
- 「新規依存ゼロで YAML/JSON を読む」は SPEC-0058（`parseConfigYaml` / JSON escape hatch）・`expect.mjs`（`parseTemplateYaml`）で確立した既知パターンであり、新規パターンではない。custom 定義パーサはこの方針を踏襲し、npm 依存を追加しない
- 「state への additive フィールド追加は schemaVersion を上げずに行い、validation は存在時のみ」は SPEC-0056（managedFiles）・SPEC-0061（`workspace`）で確立した既知パターンであり、新規パターンではない。破ると旧 state が invalid になる事故は SPEC-0056 のテストが継続検出する
- 「built-in を別経路で回避して additive に足す（既定を壊さない追加）」は SPEC-0051 / SPEC-0062 / SPEC-0064（`security:sast` opt-in 追加）・SPEC-0061（`--workspace` opt-in）で確立したパターンの継続。custom profile も built-in テーブルに手を入れず opt-in の別経路で解決する。破ると 8 組合せスナップショットが壊れる（後方互換の破壊）ため Forbidden Shortcuts / AC-06 でガードする
- 「利用者定義ファイル由来の値（`name` / step 名 / command）を scripts・パスに埋め込む」のは信頼境界越えであり、SEC-02 / SEC-03 のパターン検証・パストラバーサル防止を文章ルールでなく AC-07 の機械テストでガードする（AP-06 Human-Only Guard の回避）
- 「`getProfileDocFiles` が既に汎用パス構築で custom 名に対応済み」は事前調査で確認済みの既知事実。`profile-docs.mjs` / `managed-files.mjs` を触らずに custom docs を扱えるため File Scope から除外する
- テスト期待値は本 SPEC の契約節から導出し、AC-N 参照をテストケース名に付す

**アンチパターン照合の補記**: 想定タスク分割 T1〜T4 は各 File Scope が 10 ファイル未満で AP-02（Big Bang Prompt）の 20 ファイル閾値に抵触しない。commit message への TASK-ID 必須（commit-msg hook）は AP-05（Invisible Development）の防止策と一致する。File Scope 外変更（特に `profile.mjs` / `profile-scripts.mjs` / built-in テーブル / 8 組合せ fixture）は `templates/hooks/check-file-scope.sh` で検出される（AP-03）。custom 解決の built-in 境界不変をテスト（AC-06）でガードするのは AP-06（Human-Only Guard）の回避。

## 実装メモ（Implementation Agent向け）

- **`src/cli/custom-profile.mjs` の責務**: (1) `loadCustomProfile(targetDir, profileFilePath)` — SEC-02 のパス検証（正規化・target 配下確認・絶対 / `..` 禁止）→ 拡張子判定で YAML（`parseConfigYaml` 同方針の自前サブセットパーサ）or JSON（`JSON.parse`）読み込み → schema validation（FR-03）→ 正規化した `{ name, filePath, definition: { gateScripts, supportScripts, devDependencies } }` を返す。(2) `resolveCustomProfileScripts(definition, { packageManager })` — gate scripts の PM 別描画（既存 `renderScriptCommand` の `pnpm <step>` 変換方針に合わせる）+ support scripts を返す。(3) SEC-03 の `name` / step 名パターン検証もここに集約。すべて CliError で fail
- **解決分岐の位置**: `init.mjs` / `update.mjs` / `doctor.mjs` の profile 解決点で「`options.profileFile` あり → `loadCustomProfile` → custom scripts / deps」「なし → 既存 `getProfileScripts` / `getProfileDevDependencies` 経路」に分岐する。**custom 経路では `parseProfiles` を呼ばない**（built-in 名検証は custom には不要で、`custom:<name>` は `custom-profile.mjs` 側で検証する）。built-in 経路のコードは 1 行も変えない（NFR-01。既存テストの期待値を書き換えたら設計を疑う）
- **YAML サブセットパーサ**: `check-config.mjs` の `parseConfigYaml`（version + steps の 3 レベル nesting、inline array、quoted string、bool / number スカラ、JSON escape hatch）と同構造。定義ファイル用に `profile:` mapping + `gateScripts:` / `supportScripts:` の mapping + `devDependencies:` の list を扱えれば足りる。**`parseConfigYaml` をそのまま流用せず同方針で書く**（対象構造が異なるため。`expect.mjs` が `parseConfigYaml` と別実装なのと同じ判断）
- **install state の customProfile 追加**: `install-state.mjs` の `buildInstallState` に `customProfile`（あれば）を additive に含め、`validateInstallState` に「`customProfile` 存在時のみ検証」を足す（`workspace` フィールドの additive 対応 = SPEC-0061 と同パターン）。`resolveEffectiveOptions` に `customProfile` の解決（explicit `--profile-file` > state > null）を足す。built-in profile の state には `customProfile` を書かない
- **doctor の drift 検出**: custom モードでは (a) `loadCustomProfile` で定義ファイル再読込 → 存在 / schema チェック、(b) 再読込した definition と state の `customProfile.definition` を比較して drift issue、(c) `checkPackageScripts` 相当で対象 `package.json` の gate/support scripts を definition 期待値と照合。base 別 diagnostics（`diagnoseProfileScripts`）は custom モードでは**呼ばない**（if 分岐が custom 名で silent スキップするのを頼りにせず、custom では明示的に別診断経路にする）
- **docs 生成**: custom docs は `getProfileDocFiles` の汎用パス（`profiles/custom-<name>/README.md`）を通す。templates に該当 README が無ければ `collectManagedFileHashes` の欠落スキップで自然に落ちる。`profile-docs.mjs` は変更不要（既に汎用）。**重要な呼び出し形状**: `getProfileDocFiles` は文字列入力を `parseProfiles` に通す（L20）ため、custom 名の文字列（`custom:mystack`）をそのまま渡すと未知名 CliError になる。custom 経路は必ず **pre-parsed オブジェクト** `getProfileDocFiles({ base: "custom-<name>", addons: [], all: ["custom-<name>"] })` の形で呼び、`parseProfiles` を経由させないこと（AC-03 でこの relativePath = `profiles/custom-<name>/README.md` を明示検証する）
- **8 組合せスナップショット不変**: custom を `supportedProfiles` に足さないこと。`profile-composition.test.mjs` は `supportedProfiles` から機械列挙するため、custom を足すと 8 → 増加して fixture が壊れる。custom profile は列挙の外（別経路）に置く（AC-06）
- exit code / エラー規約: 既存どおり `CliError` で表現し `process.exit` 直呼びをしない
- 言語規約: `docs/cli.md` への追記は英語（既存 cli.md に合わせる）、テストケース名は日本語 + AC-N 参照、コード識別子（フラグ名 `--profile-file` / state キー `customProfile` / schema キー `gateScripts` 等）は英語

### 実装ルール

- built-in profile レジストリ・テーブル（`profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs`）を変更しない（custom は別経路。触れたら設計を疑う）
- custom を `supportedProfiles` に足さない（8 組合せスナップショットの不変性 — AC-06。`profile-composition.test.mjs` / fixture を変更しない）
- `--profile-file` 未指定経路のコードパスに条件分岐以外の変更を入れない（NFR-01。既存テストの期待値を 1 箇所でも書き換えたら設計を疑う）
- custom 定義ファイルのパースは `parseConfigYaml` 同方針の自前サブセット + `.json` escape hatch で行い、YAML パーサ / schema validator を新規導入しない（NFR-02）
- state の `customProfile` に `null` / 空を書かない（欠落 = built-in、の 2 状態のみ）。schemaVersion は 2 のまま
- 定義ファイル由来の `name` / step 名 / パスは SEC-02 / SEC-03 の検証を通してから埋め込む（信頼境界越え — src-rules.md AI Output Verification）
- custom 定義ファイル / docs に `service_role` 等の実 secret / 本番 URL / 本番 email を書かない。例示は非機密プレースホルダ（SEC-04）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `src/cli/profile.mjs` `parseProfiles`（L17-53、未知名 CliError）→ custom 名は `parseProfiles` を通さない（`--profile-file` あり時に custom モードで別解決）。`parseProfiles` 自体は不変で、built-in 名の検証にのみ使う
- `src/cli/profile-scripts.mjs` `getProfileScripts` L95（`BASE_PROFILE_SCRIPTS[profile.base]` の undefined spread → 例外ではなく空 `{}` 生成の silent 縮退）→ custom 経路はここに到達させない。custom scripts は `custom-profile.mjs` の `resolveCustomProfileScripts` から生成する。built-in テーブルは不変
- `src/cli/dependency-installer.mjs` `getProfileDevDependencies` L49-60（custom 名で silent 空配列）→ custom deps は定義ファイルの `devDependencies` から解決する。built-in テーブルは不変
- `src/cli/profile-diagnostics.mjs` `diagnoseProfileScripts` L34-85（custom 名で base 別 if を silent スキップ）→ custom モードでは呼ばず、doctor で custom 専用診断を行う。if 分岐は不変（built-in 専用）
- `src/cli/profile-docs.mjs` `getProfileDocFiles`（汎用パス `profiles/${name}/README.md`）→ custom 名で既に妥当なパスを生成するため変更不要。custom README が無ければ欠落スキップで落ちる
- `src/cli/install-state.mjs` `validateInstallState` / `resolveEffectiveOptions` / `serializeProfile`（schema v2）→ `customProfile` を additive に足す（`workspace` = SPEC-0061 と同パターン）。schemaVersion / 既存フィールドは不変
- `tests/cli/profile-composition.test.mjs` / `fixtures/profile-composition.json`（SPEC-0060 の 8 組合せ）→ built-in のみを列挙し不変。custom を `supportedProfiles` に足さないことで無修正 pass（AC-06）
- `src/cli/check-config.mjs` `parseConfigYaml`（`.ai-check.yaml` run config）→ 別ファイル・別責務。参照する（同方針で書く）が変更しない
- `docs/cli.md` の `--profile` / init/doctor/update option 表・`--workspace` 節（SPEC-0061）→ `--profile-file` 行を各 option 表に足し、custom profile 節を追加する。既存 `--profile` の built-in 説明は不変

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: `src/cli/custom-profile.mjs`（定義ファイル読み込み・YAML サブセットパース・schema validation・SEC-02/03 検証・gate/support/deps 解決）+ `tests/cli/custom-profile.test.mjs`（AC-01 / AC-02 / AC-04 の unit 部分・SEC ケース）（依存なし）
  - 完了条件: `node --test tests/cli/custom-profile.test.mjs` がパスし、既存テスト全件（特に 8 組合せ fixture）が無修正で pass
- T2: `install-state.mjs` の `customProfile` additive 対応（`buildInstallState` / `validateInstallState` / `resolveEffectiveOptions`）+ state round-trip テスト（AC-05 の state 部分）（依存: T1 — 正規化した definition スナップショットの形を state に写すため）
  - 完了条件: AC-05 の state round-trip テストがパスし、既存 install-state / 8 組合せ fixture テストが無修正で pass
- T3: `init.mjs` / `update.mjs` / `doctor.mjs` の `--profile-file` 経路（解析・custom モード分岐・scripts 配置・doctor drift 診断）+ 既存テストファイルへの追加ケース（AC-03 / AC-04 / AC-05 / AC-06 / AC-07）（依存: T2）
  - 完了条件: AC-01〜AC-07 の全テストがパスし、8 組合せ fixture が無修正で pass
- T4: `docs/cli.md` の `--profile-file` / custom profile 節追加（AC-08）（依存: T3 — 確定した挙動を docs 化するため）
  - 完了条件: AC-08 の grep がヒットし、既存 preflight が壊れない

T1 → T2 → T3 は直列（定義解決モジュール → state additive → コマンド統合の依存順）。T4 は docs のみで T3 完了後に独立実行可能。T3 を init/update/doctor 別に分割しない理由: 3 コマンドは同一の custom 解決経路の呼び出しのみで、分離すると呼び出し側の重複実装を誘発するため一括を維持する（ただし PLAN 起票時に File Scope が 10 ファイルを超える場合はサブタスク分割を再検討する）。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- built-in profile レジストリ・テーブルの変更の禁止 — `profile.mjs` の `BASE_PROFILES` / `ADDON_PROFILES` / `supportedProfiles` / `parseProfiles`、`profile-scripts.mjs` / `dependency-installer.mjs` / `profile-diagnostics.mjs` の built-in テーブル・if 分岐は不変。custom は別経路（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + AC-06 の built-in 不変 + レビュー）
- custom を `supportedProfiles` に追加すること・8 組合せ fixture（`tests/cli/fixtures/profile-composition.json`）の変更の禁止 — custom は列挙の外の別経路（検出: AC-06 の 8 組合せ fixture 無修正 pass + `profile-composition.test.mjs` 無変更 + レビュー）
- `--profile-file` 未指定経路の挙動・既存テスト期待値の変更の禁止（検出: AC-06 の既存テスト無修正 pass + レビューで既存テスト diff が追加ケースのみであることの確認）
- 定義ファイルの schema validation を warning で続行する実装の禁止 — FR-03 は CliError で fail-fast のみ（検出: AC-02 のテスト）
- パストラバーサル・メタ文字の未検証埋め込み（SEC-02 / SEC-03 のバイパス）の禁止（検出: AC-07 のテスト）
- 定義ファイル / docs への実 secret / 本番 URL / 本番 email の混入の禁止 — 例示は非機密プレースホルダ、command は env var 経由を案内（検出: AC-08 のレビュー + 定義ファイル / docs の grep — SEC-04）
- install state の schemaVersion 変更・既存フィールドの意味変更の禁止 — `customProfile` の additive 追加のみ（検出: AC-05 + 既存 `install-state` 系テストの無修正 pass）
- 新規 npm 依存（YAML パーサ・schema validator）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- `check-config.mjs` / `run.mjs`（`.ai-check.yaml` run config）/ `package-templates/` 配下の変更の禁止（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) `--profile-file` 未指定（かつ state に `customProfile` 無し）の init / update / doctor の観測可能な挙動は、本 SPEC 適用前と常に同一である（opt-in の完全性）
- [INV-02] (Gate 4) built-in profile（4 base + supabase-rls）の合成結果（`getProfileScripts` / `getProfileSupportScripts` / `getProfileDocFiles` / `getManagedFiles`）と `supportedProfiles` の内容は本 SPEC で常に不変であり、`tests/cli/profile-composition.test.mjs` の 8 組合せ fixture は無修正で pass し続ける（built-in 境界の保存）
- [INV-03] (Gate 2) custom モードで書き込まれる gate/support scripts は常に定義ファイル由来であり、custom 名が built-in テーブル（`BASE_PROFILE_SCRIPTS` 等）を参照することはない（`profile-scripts.mjs` L95 の silent 空 scripts 経路に custom 名が到達しない — 解決分岐の保存）
- [INV-04] (Gate 3) 生成 scripts・docs パスに埋め込まれる `profile.name` / step 名は常に SEC-03 のパターン検証（`name`: `[a-z][a-z0-9-]*` / step: `[a-z][a-z0-9:_-]*`）を通過済みであり、`--profile-file` / `filePath` は SEC-02（絶対パス / `..` 禁止・target 配下）を通過済みである
- [INV-05] (Gate 2) install state の `customProfile` は「存在して valid（`name` / `filePath` / gate 3 種網羅 `definition`）」か「キー欠落」の 2 状態のみを取り、`null` / 空文字は書き込み・読み込みのいずれでも valid にならない。schemaVersion は常に 2 のまま
- [INV-06] (Gate 3) custom 定義ファイルの schema 検証は fail-fast であり、必須キー欠落・gate 3 種欠落・型不正・参照整合違反の定義が silent に適用されて `package.json` に書き込まれることはない

### Pre-conditions
- [PRE-01] (Gate 2) custom モードの書き込みは、FR-02（custom モード判定）/ FR-03（schema validation）/ SEC-02 / SEC-03 の全検証を通過した後にのみ開始される（検証失敗時の部分書き込みの不在）
- [PRE-02] (Gate 2) doctor / update の custom 解決は explicit `--profile-file` > install state `customProfile` > なし の優先順で決定的に行われ、環境変数・カレントディレクトリに依存しない

### Post-conditions
- [POST-01] (Gate 2) `init --profile custom:<name> --profile-file <path>` 成功後、install state は `customProfile` を含む valid な v2 state であり、直後の `doctor`（フラグなし）は custom モードで pass する（init → doctor の整合）
- [POST-02] (Gate 2) `update`（`customProfile` state あり）成功後も `customProfile` フィールドは保持され、配置規則（対象 `package.json` の gate/support scripts）は init と同一である

### Assumptions
- [ASM-01] (Gate 横断) custom 定義ファイルは利用者プロジェクト内のローカルファイルであり、その `gateScripts` / `supportScripts` の command は `package.json` scripts・`.ai-check.yaml`（SPEC-0058 SEC-01）と同一の信頼境界内にある（追加のサンドボックス・署名検証は不要）
- [ASM-02] (Gate 横断) `getProfileDocFiles`（`profile-docs.mjs`）は `profiles/${name}/README.md` を allow-list なしで汎用構築するため、custom 名でも妥当な docs パスを生成でき、custom README が templates に無ければ `collectManagedFileHashes` の欠落スキップで自然に落ちる（`profile-docs.mjs` / `managed-files.mjs` を変更せずに custom docs を扱える — 事前調査で確認済み）
- [ASM-03] (Gate 横断) 旧 CLI は state の未知フィールド（`customProfile`）を無視して valid 扱いする（`validateInstallState` の現行実装の事実 — リスク3 の前提。SPEC-0061 `workspace` と同じ）
- [ASM-04] (Gate 横断) 新規依存ゼロで YAML/JSON を読む方針（`parseConfigYaml` 同方針の自前サブセット + `.json` escape hatch）は SPEC-0058 で実証済みであり、custom 定義ファイルにも適用できる（YAML サブセットで表現できない構造は `.json` で等価に扱える）

## 関連ID

- PLAN-ID: [PLAN-0065](../plans/PLAN-0065-custom-profile.md)
- TASK-ID: TASK-0232（custom-profile.mjs 定義解決モジュール）, TASK-0233（install-state customProfile additive）, TASK-0234（init/update/doctor --profile-file 統合）, TASK-0235（docs/cli.md custom profile 節）
- Done Definition: [tasks/done-def-SPEC-0065-round-1.md](../tasks/done-def-SPEC-0065-round-1.md)
- 参考: SPEC-0060（profile 合成規則 + 8 組合せスナップショット固定 — 「custom profile の外部定義（依頼 #6）」を明示スコープ外化。本 SPEC がその継続で、8 組合せの不変性を守る）, SPEC-0058（`.ai-check.yaml` config — `parseConfigYaml` / JSON escape hatch = 新規依存ゼロで定義ファイルを読む前例。信頼境界 SEC-01 の共有）, SPEC-0056（install state schema v2 + managed file hash 3-way — `customProfile` を additive 追加する土台）, SPEC-0061（`--workspace` opt-in + state additive フィールド — opt-in の別経路 + state additive の同型パターン）, SPEC-0005（profiles の出自 — built-in base 4 種の内部テーブル）, SPEC-0020（install state / `resolveEffectiveOptions` の解決規則）
