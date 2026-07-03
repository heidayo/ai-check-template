# SPEC-0061: monorepo / workspace 対応（`--workspace` による対象パッケージ指定）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0061 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0020（install state / effective options の出自）、SPEC-0056（install state schema v2 + managed file hash — additive 拡張の前提）、SPEC-0058（`.ai-check.yaml` config — 上書き手段としての共存）、SPEC-0060（profile 合成規則 — scripts 生成の契約） |
| 権限レベル | platform |

## 背景・目的

`--target` が monorepo（pnpm workspace / npm・yarn・bun workspaces）のルートを指す場合、現行 CLI はルートの `package.json` に単一パッケージ前提の scripts（`ai:check` = `pnpm typecheck && ...`）を書き込む。workspace ルートには `typecheck` / `lint` 等の実体が無いため、生成された gate scripts はそのままでは動かない。事前調査（2026-07-03、`src/cli/` 現行実装）で確認した現状は次のとおり:

- **workspace / monorepo の概念は CLI に一切存在しない**。`grep -rn "workspace|monorepo|--filter" src/` はヒット 0 件。`init` / `update` / `doctor` はいずれも `--target` 直下の `package.json` を唯一の scripts 書き込み・診断対象とする
- **package manager 検出は既に存在する**（`src/cli/package-manager.mjs` `detectPackageManager`: `package.json` の `packageManager` フィールド → lockfile（`pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` / `bun.lock(b)`）→ 既定 `pnpm` の順）。lockfile は workspace ルートに置かれるため、`--target` = workspace ルートでの PM 検出はそのまま流用できる
- **scripts 生成（`src/cli/profile-scripts.mjs`）**は内部テーブルを `pnpm <step>` 表記で持ち、`renderScriptCommand` が `/\bpnpm ([a-zA-Z0-9:_-]+)/g` の置換で PM 別（`npm run X` / `yarn X` / `bun run X`）に変換する。step 単位の invocation は `package-manager.mjs` `scriptCommand(pm, name)` に集約されている — workspace 対応はこの 1 箇所に「workspace スコープ付き invocation」を足すのが最小変更
- **install state（`src/cli/install-state.mjs` schema v2、SPEC-0056）**の `validateInstallState` は既知フィールドのみを normalized state に写し、未知フィールドを黙って落とす。したがって optional な `workspace` フィールドの追加は **schemaVersion を上げずに additive に可能**（`workspace` 欠落 = 単一パッケージとして従来どおり valid。SPEC-0056 の managed file hash validation とも干渉しない）
- **`doctor` の `diagnoseProfileScripts`（`src/cli/profile-diagnostics.mjs`）**は `\b(?:pnpm|yarn)\s+([A-Za-z0-9:_-]+)` 等の正規表現で gate scripts 内の step 参照を抽出する。文字クラスに `-` を含むため、`pnpm --filter app typecheck` のような workspace 形 script では `--filter` が「script 名」として誤抽出され、偽の missing-script warning を出す — workspace 対応時に必ず手当てが必要な既知の衝突点
- **`.ai-check.yaml`（SPEC-0058）**により、利用者は今日でも `steps` にパッケージ別コマンド（`pnpm --filter app typecheck` 等）を書けば monorepo で `run` gate を運用**できる**。ただし init が生成する雛形・`doctor` の scripts 診断は単一パッケージ前提のままで、初期導入の摩擦が残っている

本 SPEC は「**init が最初から workspace 対応の雛形を出す**」レイヤを追加する。事前調査に基づき、次の 1 案に確定する:

> **案: 明示 opt-in の `--workspace <pkg-dir>`（単一・相対パス）を init / update / doctor に追加する。**
> PM 検出のみによる暗黙の monorepo 認識（自動モード切替）は採用しない。理由: (a) workspace ルート検出（`pnpm-workspace.yaml` / `workspaces` フィールド）だけでは**どのパッケージを対象にするか**が決められず、結局利用者の指定が要る、(b) 暗黙切替は「workspace ルートに単一パッケージとして入れたい」既存利用（現に可能）を壊す、(c) opt-in なら `--workspace` 未指定時の挙動が完全に現行どおりでリグレッション面がゼロ。workspace ルート検出自体は `--workspace` 指定時の**前提検証**（fail-fast）として使う。

生成物の配置規則（契約）: gate scripts（`ai:check` / `ai:check:fast` / `ai:check:secure`）は **workspace ルートの `package.json`** に、各 step を workspace スコープ付き invocation（pnpm: `pnpm --filter <name> <step>` / npm: `npm run <step> --workspace <dir>` / yarn: `yarn workspace <name> <step>` / bun: `bun run --filter <name> <step>`）に変換して書き込む。step の実体（`typecheck` / `lint` / `doctor` / `deadcode` / support scripts / addon scripts）は **対象パッケージの `package.json`** に書き込む。managed files（docs / hooks / CI / config）と install state はルートに置いたまま変えない。

v1 は **workspace 1 箇所を対象にした init / update / doctor** に限定する。複数 workspace の一括管理をスコープ外とする理由: install state はルートに 1 つで、managed files（docs / hooks / CI）はルート共有物のため複数指定しても差分は scripts のみ。複数パッケージの gate 統合は `.ai-check.yaml`（SPEC-0058）で既に表現でき、雛形レイヤで先回りする必要がない。需要が実証されたら別 SPEC で `--workspace` の複数受理を additive に拡張できる（フラグ形態・state 形状とも拡張余地を塞がない設計にする — 契約節参照）。

## 対象ユーザー

- monorepo でアプリを開発する CLI 利用者 — `npx ai-check-template init --target <root> --workspace packages/app` の 1 コマンドで、ルートに動く gate scripts、対象パッケージに step scripts が入る
- 既存の単一パッケージ利用者 — `--workspace` 未指定なら観測可能な挙動は完全に現行どおり（影響ゼロ）
- 既に `.ai-check.yaml` で monorepo 運用している利用者 — config は従来どおり run gate の上書き手段として優先され、本 SPEC と競合しない（config は「実行 step の定義」、本 SPEC は「init が出す雛形と doctor の診断」— レイヤが異なる）
- Review Agent / CI — workspace 有無 × PM 4 種の scripts 生成と state round-trip がテストで固定される

## スコープ（含む）

- `init` / `update` / `doctor` への `--workspace <pkg-dir>` オプション追加（値は `--target` からの相対パス、単一指定のみ。`--workspace=` 形式も既存フラグと同様に受理）
- `--workspace` 指定時の前提検証（新規 `src/cli/workspace.mjs` に集約）: (a) `--target` 直下に `pnpm-workspace.yaml` または `package.json` の `workspaces` フィールドが存在すること（workspace ルート判定）、(b) `<target>/<pkg-dir>` がディレクトリとして存在すること、(c) その直下に `package.json` があり `name` フィールド（非空文字列）を持つこと — いずれか不成立で CliError
- scripts 生成の workspace 対応: `package-manager.mjs` に workspace スコープ付き invocation 関数を追加し、`profile-scripts.mjs` の gate scripts 描画で使用する（PM 別: pnpm `--filter <name>` / npm `--workspace <dir>` / yarn `workspace <name>` / bun `run --filter <name>`）。step 実体 scripts（gate 以外の profile scripts + support scripts + addon scripts）は対象パッケージの `package.json` に merge する
- install state の additive 拡張: schema v2 のまま optional フィールド `workspace`（値: 相対パス文字列）を追加。未指定 init では**フィールド自体を書かない**（`null` も書かない）。validation は存在時のみ（非空文字列・絶対パス禁止・`..` セグメント禁止）
- `doctor` の workspace 認識: install state の `workspace`（または明示 `--workspace`）を effective options に解決し、ルート `package.json` の gate scripts と対象パッケージ `package.json` の step scripts をそれぞれ期待値照合する。`diagnoseProfileScripts` の workspace 形 script での偽 warning 手当て
- `update` の workspace 認識: state から `workspace` を解決して init と同じ配置規則で scripts を更新し、state の `workspace` を維持する
- テスト追加（workspace 検証・PM 4 種の invocation・init/update/doctor の workspace 経路・state round-trip・未指定時の不変性）
- `docs/cli.md` への `--workspace` の記載（オプション・配置規則・`.ai-check.yaml` との関係・単一指定制限）

## スコープ外（明示的に除外）

- CI テンプレート（`package-templates/` の workflow）の monorepo 対応（依頼 #10）— 別 SPEC。本 SPEC の CI workflow 生成は現行のまま（ルート配置・内容不変）
- 複数 workspace の同時管理（`--workspace` の複数指定・全パッケージ一括 init）— 上記のとおり別 SPEC。v1 は単一指定のみ
- Turborepo / Nx 等のタスクランナー統合（`turbo run` 形式の生成等）— 対象外。利用者は `.ai-check.yaml` で任意コマンドに上書きできる
- profile 合成規則（SPEC-0060）の変更 — scripts の**描画**（invocation 形）のみを変え、合成（マージ順・キー集合）は変えない
- managed files（docs / hooks / CI / config）の配置変更 — すべてルート据え置き。対象パッケージへの docs 配布はしない
- `.ai-check.yaml`（SPEC-0058）の schema 変更 — config は無変更で従来どおり優先される
- workspace ルート以外を `--target` にした従来のパッケージ直接 init — 現行どおり動作し、本 SPEC は関与しない
- `--install-deps` の workspace 対応（依存を対象パッケージへインストールする経路）— v1 では `--workspace` と `--install-deps` の併用を CliError とし、別 SPEC で解禁する（誤ってルートへ dev 依存を入れる事故を防ぐ fail-fast）

## 要件

### 機能要件
- [FR-01] オプション追加: `init` / `update` / `doctor` は `--workspace <pkg-dir>`（および `--workspace=<pkg-dir>`）を受理する。値は `--target` からの相対パス。2 回以上の指定は CliError（単一指定制限）。`--workspace` 未指定時、3 コマンドの観測可能な挙動（出力・書き込み内容・exit code）は本 SPEC 適用前と同一である
- [FR-02] 前提検証（fail-fast）: `--workspace` 指定時、(a) workspace ルート判定（`<target>/pnpm-workspace.yaml` の存在、または `<target>/package.json` の `workspaces` フィールド（配列 or `{ packages: [...] }`）の存在）に失敗したら CliError、(b) `<target>/<pkg-dir>` が存在しない・ディレクトリでないなら CliError、(c) `<target>/<pkg-dir>/package.json` が存在しない、または `name` が非空文字列でないなら CliError。検証は書き込み前に完了する（部分書き込みの不在）
- [FR-03] gate scripts の workspace 描画: `--workspace` 指定時（または state から解決時）、ルート `package.json` に merge する `ai:check` / `ai:check:fast` / `ai:check:secure` の各 step は PM 別の workspace スコープ付き invocation に描画する — pnpm: `pnpm --filter <name> <step>`、npm: `npm run <step> --workspace <pkg-dir>`、yarn: `yarn workspace <name> <step>`、bun: `bun run --filter <name> <step>`（`<name>` = 対象パッケージ `package.json` の `name`、`<pkg-dir>` = 相対パス）。addon の `ADDON_CHECK_STEPS` 追記（SPEC-0060）も同じ描画を通る
- [FR-04] step 実体 scripts の配置: gate scripts 以外の profile scripts（`doctor` / `deadcode` / `test:e2e:smoke` 等）、addon scripts（`test:db` 等）、support scripts（`typecheck` / `lint` / `test` 等）は**対象パッケージの `package.json`** に merge する（keep / skip / overwrite の既存規則をパッケージ側 `package.json` に対して適用）。ルート `package.json` には gate scripts のみを merge する
- [FR-05] install state の additive 拡張: `--workspace` 指定の init / update は state に `workspace: "<pkg-dir>"`（正規化した相対パス、`/` 区切り）を記録する。未指定ならフィールドを書かない。`validateInstallState` は `workspace` が存在する場合のみ検証（非空文字列・`path.isAbsolute` 禁止・`..` セグメント禁止。違反は invalid-install-state）し、schemaVersion は 2 のまま。v1 state・`workspace` 無し v2 state は従来どおり valid（SPEC-0056 の validation を破らない）
- [FR-06] doctor / update の workspace 解決: `resolveEffectiveOptions` の他オプションと同じ規則で、明示 `--workspace` > state の `workspace` > なし（単一パッケージ動作）の優先順で解決する。doctor は解決された workspace に対し FR-02 の前提検証を診断として実施（不成立は issue、exit 1）し、ルート gate scripts / パッケージ step scripts を FR-03 / FR-04 の期待値と照合する。`diagnoseProfileScripts` は workspace 形 gate script から step 名を正しく抽出する（`--filter` 等のフラグ字句を script 名と誤認して偽 warning を出さない）
- [FR-07] `.ai-check.yaml`（SPEC-0058）との共存: config が存在する場合の `run` gate の step 解決は現行どおり config が優先され、本 SPEC は `run` の挙動を変えない。config でパッケージ別コマンドを書く monorepo 運用は引き続き有効で、本 SPEC の雛形はその初期値を提供するレイヤである — この関係を docs/cli.md に明記する
- [FR-08] `--workspace` と `--install-deps` の併用は CliError（スコープ外節の理由による fail-fast。エラーメッセージで別途 config / 手動インストールを案内する）

### 非機能要件
- [NFR-01] 後方互換: `--workspace` 未指定の全経路（init / update / doctor × 全 profile × 全 PM）で観測可能な挙動が不変（検証: 既存 `tests/cli/*.test.mjs` が無修正期待値部分で pass し続けること = AC-01）。`workspace` フィールドを持たない既存 install state の読み込み結果も不変
- [NFR-02] 新規依存ゼロ: workspace ルート判定・パッケージ検証は `node:fs` / `node:path` のみで行い、YAML パーサ等を導入しない（`pnpm-workspace.yaml` は**存在チェックのみ**で中身をパースしない）。`package.json` runtime dependencies ゼロを維持（検証: `tests/cli/package.test.mjs`）
- [NFR-03] state 拡張は additive のみ: schemaVersion は 2 のまま、既存フィールドの意味・validation を変えない。旧 CLI が `workspace` 付き state を読んだ場合もエラーにならない（未知フィールドとして無視される — 現行実装の事実。リスク2 参照）
- [NFR-04] 新規コードパス（workspace 検証・PM 別 invocation・state validation・diagnostics 手当て）は各分岐に最低 1 テストケースを対応させる。対象分岐: (1) FR-02(a) 成功/失敗 (2) FR-02(b) 成功/失敗 (3) FR-02(c) 成功/失敗 (4) PM 4 種の invocation 描画 (5) state workspace 有効/欠落/不正 (6) doctor/update の workspace 有無 × drift 検出（分岐網羅はテストケース列挙で担保、カバレッジツール導入不要 — SPEC-0060 NFR-04 と同方針）

### セキュリティ要件
- [SEC-01] パストラバーサル防止: `--workspace` の値は絶対パス・`..` セグメントを含む場合に CliError とし、正規化後のパスが `--target` 配下であることを保証する（`--target` 外の `package.json` への書き込み経路を作らない）。state 経由の `workspace` も FR-05 の同一 validation を通る（state 改竄でルート外書き込みを誘発できない）
- [SEC-02] コマンドインジェクション防止: `<name>` / `<pkg-dir>` は scripts 文字列に埋め込まれるため、`name` が `[A-Za-z0-9@/._-]+`（npm package name 相当）に一致しない場合、`pkg-dir` がシェルメタ文字（空白・`;` `&` `|` `$` 等）を含む場合は CliError とする（利用者の `package.json` は信頼境界の外側として扱う）

### 運用要件
- [OPS-01] 段階観測: v1 リリース後 1 リリースサイクル、`--workspace` の失敗事例を観測する。「workspace ルート判定（FR-02 (a)）が実在の monorepo 構成で誤って fail する」事例が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'workspace: ルート判定誤検知（固定文字列タグ。表記ゆれ禁止）' sage/failures.md` で機械的に件数確認する。failures.md 記録時は説明冒頭に『workspace: ルート判定誤検知』の原因タグを付す）、判定条件の緩和（warning 化 or 検出対象追加）を別 SPEC で起票する
- [OPS-02] 複数 workspace 需要の観測: 利用者要望・dogfooding で複数指定の必要が確認されたら別 SPEC で `--workspace` 複数受理を検討する（state の `workspace` は文字列 → 配列の additive 変換余地を契約節で確保済み）。判定は roadmap 見直し時に issue / feedback を確認して行う

## File Scope

| 区分 | ファイル |
|---|---|
| 新規（CLI） | `src/cli/workspace.mjs`（workspace ルート判定・pkg-dir 検証・name 取得・SEC-01/02 検証の集約） |
| 変更（CLI） | `src/cli/init.mjs`, `src/cli/update.mjs`, `src/cli/doctor.mjs`（`--workspace` 解析・scripts 配置分岐・診断）, `src/cli/install-state.mjs`（`workspace` フィールドの additive 対応）, `src/cli/package-manager.mjs`（workspace スコープ付き invocation 関数）, `src/cli/profile-scripts.mjs`（gate scripts の workspace 描画オプション）, `src/cli/profile-diagnostics.mjs`（workspace 形 script の step 抽出手当て） |
| 新規（テスト） | `tests/cli/workspace.test.mjs`（検証・invocation・SEC ケース） |
| 変更（テスト） | `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`（workspace 経路の追加ケースのみ。既存ケースの期待値は変更しない） |
| ドキュメント | `docs/cli.md`（`--workspace` 節の追加） |

上記以外への変更は本 SPEC のスコープ外。`src/cli/managed-files.mjs`・`src/cli/check-config.mjs`・`src/cli/run.mjs`・`src/cli/ci-workflows.mjs`・`package-templates/` 配下・`tests/cli/profile-composition.test.mjs` と fixture（SPEC-0060 のスナップショットは workspace 未指定描画を固定しており不変のはず — 変更が必要になった時点で設計ミスとして立ち止まる）は**変更しない**。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスし、既存テストの無修正期待値部分（`--workspace` 未指定経路）が変更なしで pass し続ける（NFR-01 の後方互換検証）【種別: unit + integration】
- [ ] AC-02: `init --workspace packages/app` を pnpm / npm / yarn / bun の 4 PM で（実 PM バイナリを実行せず、`detectPackageManager` の検出結果を固定した状態で invocation 文字列の組み立てのみを）検証した場合（bun の `--filter` は実施時に公式ドキュメントでサポートバージョンを確認し、テストファイルのコメントに記録する）、ルート `package.json` の `ai:check` 各 step が FR-03 の PM 別 workspace invocation（pnpm `--filter <name>` / npm `--workspace <dir>` / yarn `workspace <name>` / bun `run --filter <name>`）に描画され、対象パッケージの `package.json` に step 実体 scripts（support scripts 含む）が merge される（テストで 4 PM とも検証）【種別: integration】
- [ ] AC-03: `init --workspace` 後の install state に `workspace: "packages/app"` が記録され、`--workspace` 未指定 init の state には `workspace` キーが存在しない。`workspace` 付き state は `loadInstallState` で valid、絶対パス・`..` 入り・非文字列の `workspace` は invalid-install-state になる（テストで検証）【種別: unit】
- [ ] AC-04: state に `workspace` がある target への `doctor`（フラグなし）が workspace モードで診断し、ルート gate scripts の drift / 対象パッケージの missing step script を issue として検出する。workspace 形 gate script に対し `--filter` 等を script 名と誤認した偽 warning を出さない（FR-06。テストで検証）【種別: integration】
- [ ] AC-05: state に `workspace` がある target への `update`（フラグなし）が workspace 配置規則で scripts を更新し、state の `workspace` を維持する（テストで検証）【種別: integration】
- [ ] AC-06: FR-02 の前提検証 3 種が fail-fast する — (a) workspace ルート判定失敗（`pnpm-workspace.yaml` も `workspaces` フィールドも無い target + `--workspace`）、(b) pkg-dir 不在、(c) pkg-dir に `package.json` なし / `name` なし — の各ケースで CliError（非 0 終了）となり、ルート・パッケージいずれの `package.json` にも書き込みが発生しない（テストで検証）【種別: unit + integration】
- [ ] AC-07: SEC-01 / SEC-02 の検証 — `--workspace ../outside`・絶対パス・シェルメタ文字入り pkg-dir・不正 `name`（メタ文字入り）の各入力が CliError になる（テストで検証）【種別: unit】
- [ ] AC-08: `docs/cli.md` に `--workspace` の記載が存在する（`grep -q '\-\-workspace' docs/cli.md` がヒットし、配置規則（root gate / package steps）・単一指定制限・`.ai-check.yaml` 優先の関係の 3 点が同節に含まれることをレビューで確認）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | integration | Gate 2: Functional |
| AC-03 | unit | Gate 2: Functional |
| AC-04 | integration | Gate 2: Functional |
| AC-05 | integration | Gate 2: Functional |
| AC-06 | unit + integration | Gate 2: Functional |
| AC-07 | unit | Gate 3: Security |
| AC-08 | docs | Gate 1: Structural |

AC-02〜AC-07 のテストは `tests/cli/workspace.test.mjs` および既存 `tests/cli/{init,update,doctor}.test.mjs` への追加ケースとして、既存 `node --test tests/cli/*.test.mjs`（AC-01）の実行対象に含まれるため、CI 上は追加の workflow 設定なしに必須チェック化される。

## 異常系

- 想定エラー1: workspace パス不在（`--workspace packages/ghost` で `<target>/packages/ghost` が存在しない、またはファイルである）→ pkg-dir と target を含む CliError で非 0 終了し、何も書き込まない（検証条件は AC-06 (b) を一次情報源とする）。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` 追記
- 想定エラー2: workspace 内に `package.json` が無い、または `name` が非空文字列でない → 「対象パッケージに name 付き package.json が必要」である旨の CliError で非 0 終了する（yarn / pnpm の filter 生成に name が必須。検証条件は AC-06 (c) を一次情報源とする）
- 想定エラー3: workspace ルート判定失敗（`--target` に `pnpm-workspace.yaml` も `package.json` `workspaces` も無いのに `--workspace` を指定）→ 判定に使った 2 検出手段を明記した CliError で非 0 終了する（生成する `--filter` invocation が動かないため fail-fast。検証条件は AC-06 (a) を一次情報源とする）
- 想定エラー4: `--workspace` の値が絶対パス・`..` 入り・シェルメタ文字入り、または対象パッケージの `name` が SEC-02 パターン外 → CliError で非 0 終了する（検証条件は AC-07 を一次情報源とする）
- 想定エラー5: install state の `workspace` が不正（非文字列・絶対パス・`..` 入り）→ `loadInstallState` が invalid-install-state を返し、doctor は state issue として報告、update は `assertWritableInstallState` により書き込み拒否する（既存の invalid state 経路に乗せる。検証条件は AC-03 を一次情報源とする）
- 境界ケース1: state に `workspace` があるが、その後利用者がパッケージを削除した → doctor が FR-02 検証を診断として実施し issue（非 0）で報告する。update も書き込み前検証で CliError（検証条件は AC-04 / AC-06 を一次情報源とする）
- 境界ケース2: `--workspace .`（target 自身の指定）→ 正規化後 pkg-dir が空になるため CliError（単一パッケージなら `--workspace` を外す旨を案内）

## 契約

- API: (1) **`--workspace <pkg-dir>`**: init / update / doctor 共通、単一・相対パスのみ。未指定時の挙動は現行と完全同一（opt-in）。将来の複数指定は同フラグの複数回受理として additive に拡張可能（v1 では 2 回目で CliError）。 (2) **scripts 配置規則**: workspace モードでは gate scripts（`ai:check*`）= ルート `package.json`（step を PM 別 workspace invocation で描画）、step 実体 scripts = 対象パッケージ `package.json`。profile 合成のキー集合・マージ順は SPEC-0060 の契約のまま（描画のみが変わる）。 (3) **install state**: schema v2 に optional `workspace: string`（`/` 区切り相対パス）を additive 追加。欠落 = 単一パッケージ。将来の複数対応は `workspace` の型拡張ではなく別フィールド（例: `workspaces: string[]`）の additive 追加で行い、既存フィールドの意味を変えない。 (4) **`.ai-check.yaml` 優先**: `run` gate の step 解決は config > 生成 scripts の現行優先順を維持（本 SPEC は run.mjs / check-config.mjs に触れない）
- DB: なし
- イベント: なし

## リスク

- リスク1: PM 各社の workspace CLI 仕様（`--filter` / `--workspace` / `workspace` サブコマンド）が将来変わる、または bun の `--filter` がユーザーの bun バージョンで未対応 → 軽減策: invocation 生成を `package-manager.mjs` の 1 関数に集約し、変更時の修正点を局所化する。生成 scripts は利用者の `package.json` に入る平文であり、利用者側で自由に修正・`.ai-check.yaml` で上書き可能（実装ドキュメント照合は src-rules.md の AI Output Verification に従い実 PM ドキュメントで確認する）
- リスク2: 旧バージョン CLI が `workspace` 付き state を読むと（未知フィールド無視により）単一パッケージとして診断し、ルート `package.json` に単一形 scripts の drift を誤報告する → 軽減策: 受容する（additive 拡張の既知の限界。schemaVersion を上げると SPEC-0056 の互換マトリクス全体に波及し、フィールド 1 つの追加に対して過剰）。docs/cli.md に「workspace モードは vX.Y 以降」を明記する
- リスク3: step 実体 scripts を対象パッケージへ merge する経路が、既存の keep / skip / overwrite 規則と operations 出力の整合を崩す → 軽減策: `mergePackageScripts` を「書き込み先 package.json + scripts サブセット」でパラメタ化して再利用し、新規の merge 実装を書かない（operations の `targetPath` がルート / パッケージのどちらかを自然に示す）
- リスク4: `diagnoseProfileScripts` の正規表現手当てが既存（非 workspace）の warning 挙動を変えてしまう → 軽減策: 手当ては workspace モードの期待 script 形に限定し、非 workspace 経路の抽出結果が不変であることを既存テスト（AC-01）+ 追加ケースで固定する
- リスク5: 機構を撤去する必要が生じた場合 → 軽減策: `--workspace` は opt-in フラグ + optional state フィールドのみで、フラグ受理を落とし state フィールドを無視すれば現行動作に戻る（未指定利用者への影響ゼロ）

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: `--workspace` は配布 CLI の利用者向け機能であり、本リポの開発運用ルールに影響しない。配布物ドキュメントの一次情報源は docs/cli.md で、CLAUDE.md は既に参照型（fixed-list を持たない）ため追記不要）
- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。OPS-01 の原因タグ『workspace: ルート判定誤検知』を該当時に付す
- 「state への additive フィールド追加は schemaVersion を上げずに行い、validation は存在時のみ」は SPEC-0056（managedFiles）で確立した既知パターンであり、新規パターンではない。破ると旧 state が invalid になる事故は SPEC-0056 のテストが継続検出する
- 「利用者 `package.json` 由来の値（`name`）を scripts に埋め込む」のは信頼境界越えであり、SEC-02 のパターン検証を文章ルールでなく AC-07 の機械テストでガードする（AP-06 Human-Only Guard の回避）
- テスト期待値は本 SPEC の契約節から導出し、AC-N 参照をテストケース名に付す

**アンチパターン照合の補記**: 想定タスク分割 T1〜T4 は各 File Scope が 10 ファイル未満で AP-02（Big Bang Prompt）の 20 ファイル閾値に抵触しない。commit message への TASK-ID 必須（commit-msg hook）は AP-05（Invisible Development）の防止策と一致する。File Scope 外変更は `templates/hooks/check-file-scope.sh` で検出される（AP-03）。

## 実装メモ（Implementation Agent向け）

- `src/cli/workspace.mjs` の責務: `resolveWorkspace(targetDir, pkgDir)` — SEC-01 のパス検証（正規化・target 配下確認）→ FR-02 (a) ルート判定（`pathExists(pnpm-workspace.yaml)` or root package.json `workspaces`）→ (b)(c) パッケージ検証 → `{ dir, name }` を返す。SEC-02 の name / dir パターン検証もここに置く。すべて CliError で fail
- invocation 生成: `package-manager.mjs` に `workspaceScriptCommand(packageManager, workspace, scriptName)` を追加し、`scriptCommand` と並置する。`profile-scripts.mjs` の `getProfileScripts` は `options.workspace`（`{ dir, name }`）を受けた場合のみ gate scripts の step 描画に workspace 形を使う。**内部テーブル・合成順は変更しない**（SPEC-0060 の fixture が無修正で pass することが設計の正しさの証左）
- gate / step の分割点: `getProfileScripts` の返り値のうち `ai:check` / `ai:check:fast` / `ai:check:secure`（`check-config.mjs` の `GATE_BY_SCRIPT` キーと同一集合）がルート行き、残り + `getProfileSupportScripts` がパッケージ行き。分割は呼び出し側（init/update）で行い、profile-scripts の返り値スキーマは変えない
- `renderScriptCommand` の `pnpm X` 置換は workspace 描画と併走させない実装順に注意: gate scripts は step 名から `workspaceScriptCommand` で直接組み立てる方が、正規表現置換の二重適用より安全
- init の書き込み順: workspace 検証（FR-02 / SEC）→ ルート scripts merge → パッケージ scripts merge → managed files（現行どおりルート）→ state 書き込み（`workspace` 記録）。dry-run は現行規則どおり一切書かない
- `resolveEffectiveOptions`（install-state.mjs）に `workspace` を追加: `options.explicit.workspace ? options.workspace : state?.workspace ?? null`。doctor / update は解決値が非 null のとき workspace モード
- `diagnoseProfileScripts` 手当て: workspace モードでは gate script の期待形が既知（自ら生成した invocation）なので、期待値完全一致の照合（`checkPackageScripts` 相当）に寄せ、正規表現での step 参照抽出は非 workspace 経路に限定するのが最小手当て
- `installationSummary` / `effectiveOptionsSummary` への `workspace` 追加は JSON 出力の additive 拡張（キー追加のみ）で、既存キーの値は変えない
- exit code 規約: 既存どおり `CliError` で表現し `process.exit` 直呼びをしない
- 言語規約: docs/cli.md への追記は英語（既存 cli.md に合わせる）、テストケース名は日本語 + AC-N 参照、コード識別子は英語

### 実装ルール

- `--workspace` 未指定経路のコードパスに条件分岐以外の変更を入れない（NFR-01。既存テストの期待値を 1 箇所でも書き換えたら設計を疑う）
- `pnpm-workspace.yaml` をパースしない（存在チェックのみ。NFR-02: YAML パーサ導入禁止）
- state の `workspace` に `null` / 空文字を書かない（欠落 = 単一パッケージ、の 2 状態のみ）
- PM 別 invocation は実 PM の公式ドキュメントと照合してから確定する（src-rules.md AI Output Verification: 幻覚フラグの混入防止）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `tests/cli/profile-composition.test.mjs`（SPEC-0060 fixture）は workspace 未指定描画を固定している → `getProfileScripts` のシグネチャ変更は optional options 追加のみに留め、fixture が無修正で pass することを AC-01 で機械確認する
- `checkPackageScripts`（doctor.mjs）は単一 `package.json` 前提 → workspace モードではルート（gate）とパッケージ（step）の 2 回照合に分ける。既存の issue code（missing-script / drift）は流用し、`path` でどちらの package.json かを示す
- `mergePackageScripts`（init.mjs）と update.mjs の scripts 更新は各々独立実装 → workspace 分岐を両方に入れる際、配置規則（gate/step 分割）の定義は workspace.mjs か profile-scripts.mjs の 1 箇所に集約し、init / update で重複定義しない
- `dependency-installer.mjs` はルート `package.json` を前提とする → FR-08 の併用 CliError により本 SPEC では経路に入らない（解禁は別 SPEC）
- `effectiveOptionsSummary` の JSON 出力を期待値に持つ既存テストがある可能性 → キー追加が既存アサーションを壊さないか AC-01 で確認し、壊れる場合は追加ケース側のみで検証する（既存期待値は変更しない原則の例外にしない）

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: `src/cli/workspace.mjs` + `package-manager.mjs` の invocation 関数 + `tests/cli/workspace.test.mjs`（FR-02 / SEC-01 / SEC-02 / PM 4 種 invocation。AC-06 / AC-07 / AC-02 の invocation 部分）（依存なし）
  - 完了条件: `node --test tests/cli/workspace.test.mjs` がパスし、既存テスト全件が無修正で pass
- T2: install-state の `workspace` additive 対応 + `profile-scripts.mjs` の workspace 描画オプション（AC-03 + AC-02 の描画部分）（依存: T1）
  - 完了条件: AC-03 のテストがパスし、SPEC-0060 fixture テストが無修正で pass
- T3: init / update / doctor の `--workspace` 経路（解析・配置・診断・diagnostics 手当て）+ 既存テストファイルへの追加ケース（AC-02 / AC-04 / AC-05 / FR-08）（依存: T2）
  - 完了条件: AC-01〜AC-07 の全テストがパス
- T4: `docs/cli.md` の `--workspace` 節追加（AC-08）（依存: T3。確定した挙動を docs 化するため）
  - 完了条件: AC-08 の grep がヒットし、既存 preflight が壊れない

T1 → T2 → T3 は直列（下位モジュール → state/描画 → コマンド統合の依存順）。T4 は docs のみで T3 完了後に独立実行可能。T3 を init/update/doctor 別に分割しない理由: 3 コマンドは同一の配置規則を共有する共通経路の呼び出しのみで、分離すると呼び出し側の重複実装を誘発するため一括を維持する（ただし PLAN 起票時に File Scope が 10 ファイルを超える場合はサブタスク分割を再検討する）。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- `--workspace` 未指定経路の挙動・既存テスト期待値の変更の禁止（検出: AC-01 の既存テスト無修正 pass + レビューで既存テスト diff が追加ケースのみであることの確認）
- workspace ルート判定・パス検証を warning で続行する実装の禁止 — FR-02 / SEC-01 / SEC-02 は CliError で fail-fast のみ（検出: AC-06 / AC-07 のテスト）
- `pnpm-workspace.yaml` の YAML パース・パーサ依存の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー)
- install state の schemaVersion 変更・既存フィールドの意味変更の禁止 — `workspace` の additive 追加のみ（検出: AC-03 + 既存 `install-state` 系テストの無修正 pass）
- 検証済みでない PM invocation 形（実 PM ドキュメント未照合の `--filter` 構文等）のコミットの禁止（検出: レビューで各 PM 公式ドキュメントの参照確認 — src-rules.md AI Output Verification）
- 対象パッケージ `name` / pkg-dir の未検証埋め込み（SEC-02 パターン検証のバイパス）の禁止（検出: AC-07 のテスト）
- File Scope 外への変更の禁止 — 特に `run.mjs` / `check-config.mjs` / `managed-files.mjs` / `package-templates/`（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) `--workspace` 未指定（かつ state に `workspace` 無し）の init / update / doctor の観測可能な挙動は、本 SPEC 適用前と常に同一である（opt-in の完全性）
- [INV-02] (Gate 2) workspace モードで書き込まれる `package.json` はルートと対象パッケージのちょうど 2 つであり、それ以外のファイルへの書き込み先は非 workspace モードと同一集合である（managed files / state はルート固定）
- [INV-03] (Gate 2) workspace モードの gate scripts に含まれる step 集合・順序は、同条件の非 workspace モードと常に一致する（変わるのは invocation 描画のみ — SPEC-0060 合成契約の保存）
- [INV-04] (Gate 3) 生成 scripts に埋め込まれる `name` / `pkg-dir` は常に SEC-02 のパターン検証を通過済みであり、検証を通らない値が scripts に現れることはない
- [INV-05] (Gate 2) install state の `workspace` は「存在して valid な相対パス」か「キー欠落」の 2 状態のみを取り、`null` / 空文字は書き込み・読み込みのいずれでも valid にならない

### Pre-conditions
- [PRE-01] (Gate 2) workspace モードの書き込みは、FR-02 / SEC-01 / SEC-02 の全検証を通過した後にのみ開始される（検証失敗時の部分書き込みの不在）
- [PRE-02] (Gate 2) doctor / update の workspace 解決は explicit フラグ > install state > なし の優先順で決定的に行われ、環境変数・カレントディレクトリに依存しない

### Post-conditions
- [POST-01] (Gate 2) `init --workspace` 成功後、install state は `workspace` を含む valid な v2 state であり、直後の `doctor`（フラグなし）は workspace モードで pass する（init → doctor の整合）
- [POST-02] (Gate 2) `update`（workspace state あり）成功後も `workspace` フィールドは保持され、配置規則（ルート gate / パッケージ step）は init と同一である

### Assumptions
- [ASM-01] (Gate 横断) workspace ルートの検出は `pnpm-workspace.yaml` の存在または root `package.json` の `workspaces` フィールドで十分である（pnpm / npm / yarn / bun の標準構成をカバー。Turborepo / Nx も下層はこのいずれかを使う）。誤検知の累積は OPS-01 で観測する
- [ASM-02] (Gate 横断) PM 検出（`detectPackageManager`）は workspace ルートでそのまま正しく機能する（lockfile・`packageManager` フィールドはルートに置かれる — 事前調査で確認済み）
- [ASM-03] (Gate 横断) 旧 CLI は state の未知フィールドを無視して valid 扱いする（`validateInstallState` の現行実装の事実 — リスク2 の前提）

## 関連ID

- PLAN-ID: [PLAN-0061](../plans/PLAN-0061-monorepo-workspace.md)
- TASK-ID: TASK-0218（T1: workspace 検証モジュール + PM invocation）, TASK-0219（T2: state additive + gate scripts 描画）, TASK-0220（T3: init/update/doctor 統合 + diagnostics 手当て — File Scope 7 ファイルで再検討条項に該当せず一括維持）, TASK-0221（T4: docs/cli.md）
- Done Definition: [tasks/done-def-SPEC-0061-round-1.md](../tasks/done-def-SPEC-0061-round-1.md)
