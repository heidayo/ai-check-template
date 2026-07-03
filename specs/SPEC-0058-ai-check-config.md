# SPEC-0058: `.ai-check.yaml` / `.ai-check.json` によるチェックステップの外部設定化

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0058 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0056（managed-files / 3-way update — 非管理原則の参照元）、SPEC-0057（overlay — ユーザー所有ファイル非管理の先行事例） |
| 権限レベル | platform |

## 背景・目的

現行の `ai:check` / `ai:check:fast` / `ai:check:secure` のステップ構成は `package.json` scripts の `&&` チェーン（`package-templates/package.scripts.fragment.json` 起点）に埋め込まれており、`ai-check-template run` は指定 script のコマンド文字列を `&&` で分割してステップとして逐次実行する（`src/cli/run.mjs` `executeScript()` / `splitCommandChain()`）。ステップのコマンド差し替え・有効/無効の切り替えには package.json scripts か shell scripts の直接編集が必要で、以下の問題がある:

- ステップ構成が命令的な文字列連結に埋もれ、「どのゲートに何が属するか」を宣言的に把握・変更できない
- `run --json` の steps にはコマンド文字列しかなく、ステップの由来（既定か、利用者設定か）が evidence として残らない
- 一部ステップだけ無効化したい場合（例: E2E smoke を一時停止）に scripts 文字列の手編集が必要で、編集ミスがゲート全体を壊す

本 SPEC は、プロジェクトルートの設定ファイル `.ai-check.yaml`（または `.ai-check.json`）で、ゲート（fast / full / secure）ごとのステップ（名前・コマンド・有効/無効・所属ゲート）を宣言できるようにする。設定ファイルは **opt-in** であり、存在しなければ現行動作（package.json scripts 解決）に完全フォールバックする。設定ファイルは SPEC-0057 の overlay と同じ **ユーザー所有・installer 非管理** 原則に従い、managed 一覧に含めない。

- **`.ai-check.yaml/json`（本 SPEC）**: ステップ構成の宣言的な差し替え・無効化・追加の一次手段
- **overlay（SPEC-0057）**: scripts 実行環境（env var 等）のカスタマイズ手段 — 役割が異なり共存する

## 対象ユーザー

- `ai-check-template` CLI（v0.5.0+ 想定）の `run` を AI 内部ループ / CI で利用し、ステップ構成をプロジェクト要件に合わせたい開発者
- 既存プロジェクト（設定ファイルを置かない）の開発者 — 挙動は従来と完全同一（NFR-01）
- CI / repair プロンプトで `run --json` の evidence を読む AI エージェント — ステップの由来（config / default）を機械判読する
- 本リポ maintainer（config スキーマとドキュメントの保守）

## スコープ（含む）

- 設定ファイルの読み込み: `run` 実行時、`--target` ディレクトリ直下の `.ai-check.yaml` / `.ai-check.json` を検出して読み込む（両方存在する場合はエラー、想定エラー4）
- スキーマ（version 1）: 最上位 `version: 1` と `steps:`。`steps` 配下は step 名（英語識別子）→ `{ command?: string, enabled?: boolean, gates: (fast|full|secure)[] }`
- ゲート解決: `run --script ai:check` → gate `full`、`ai:check:fast` → `fast`、`ai:check:secure` → `secure`。設定に該当 gate のステップが 1 件以上あれば、そのゲートの実行ステップ列は設定の宣言順で **全置換** される（上書き・無効化・追加はこの全列挙モデルで表現する）。`command` 省略時は `package.json` の `scripts[<step名>]` を参照（既定ステップのコマンド再利用）。該当 gate のステップが設定に無ければ現行どおり package script の `&&` 分割にフォールバックする
- `run --json` 出力の拡張: 各 step に `name`（config 由来は step 名、default 由来は連番名）と `source: "config" | "default"` を追加し、結果ルートに `configPath`（使用した設定ファイルの相対パス、未使用時 `null`）を追加する（OPS-01）
- 設定ファイルの validation は `run` 実行時に行う: 不正キー・型エラー・未知 gate 値・空 command・重複 step 名などは CliError で非 0 終了（silent 続行しない）
- YAML パース: 新規依存を追加せず、`src/cli/expect.mjs` `parseTemplateYaml()` と同方針の **最小 YAML サブセット自前パーサ** で対応。サブセットで表現できない構造が必要な場合の escape hatch として `.ai-check.json`（JSON.parse、フル表現）を等価サポートする
- 非管理原則: `.ai-check.yaml` / `.ai-check.json` は配布物に含めず、`src/cli/managed-files.mjs` の managed 一覧に含めない（init は生成せず、update は上書き・削除せず、doctor は検査しない）
- `docs/cli.md` / README（ja/en）への config ガイド追記（スキーマ、フォールバック規則、secrets 直書き禁止案内）

## スコープ外（明示的に除外）

- 形名参同レポート（`expect` × `run` の照合・成功基準判定）— 次 SPEC（候補 C-2）
- profile 合成・monorepo 対応 — 別 SPEC（候補 B 系）
- CI テンプレート（GitHub Actions workflows）の config 対応 — workflows は従来どおり package scripts を呼ぶ。config は `run` 経由でのみ効く
- Claude hooks（`.claude/` 配下）の config 対応
- 配布 shell scripts（`package-templates/scripts/*.sh`）の config 対応 — scripts は PM 委譲 thin wrapper のまま。scripts カスタマイズは SPEC-0057 overlay の責務
- `doctor` への config schema validation 統合 — validation は `run` 実行時のみとする。doctor は config の存在・内容を一切見ない（非管理原則と検査境界を単純に保つため。dogfooding で「run 前に検証したい」需要が実証されたら別 SPEC で再検討）
- 既定ステップ列への **部分パッチ**（既定を暗黙継承して 1 件だけ差し替える merge semantics）— v1 は「gate ごとに全列挙」モデルのみ。部分パッチは merge 規則の複雑化を招くため、dogfooding での需要実証後に別 SPEC で検討
- YAML フル仕様（anchor / alias / multi-line scalar / flow mapping 等）のサポート — サブセット外は `.ai-check.json` を案内するエラーで拒否
- config ファイルの雛形配布・init での生成 — opt-in 原則を守るため利用者が手書きする（ドキュメントに例を記載）

## 要件

### 機能要件
- [FR-01] `run` は `--target` ディレクトリ直下の `.ai-check.yaml`（優先拡張子）または `.ai-check.json` を検出する。どちらも存在しない場合、`run` の挙動（実行コマンド・exit code・`--json` の既存フィールド）は現行と同一である（`name` / `source` / `configPath` フィールドの追加を除く）
- [FR-02] 設定スキーマ version 1: 最上位に `version: 1`（必須）と `steps`（必須、1 件以上）。各 step は `gates`（必須、`fast` / `full` / `secure` の 1 つ以上の配列）、`command`（省略可、非空文字列）、`enabled`（省略可、boolean、既定 true）を持つ。step 名は `[a-z][a-z0-9:_-]*` の英語識別子
- [FR-03] gate 解決: `--script` が `ai:check` / `ai:check:fast` / `ai:check:secure` のとき、それぞれ gate `full` / `fast` / `secure` として設定を参照する。それ以外の `--script` 値では設定を参照せず現行どおり package script を実行する（`configPath` は `null`）
- [FR-04] 設定に該当 gate の step が 1 件以上ある場合、実行ステップ列は「該当 gate を `gates` に含む step の宣言順リスト」で全置換される。`command` 省略時は対象プロジェクトの `package.json` `scripts[<step名>]` を `<PM> run <step名>` 相当ではなくコマンド文字列としてそのまま採用する（scripts に該当名が無ければエラー、想定エラー2）。`enabled: false` の step は実行せず `status: "SKIPPED"`・`source: "config"` として結果に記録する
- [FR-05] 設定に該当 gate の step が 1 件も無い場合（設定ファイル自体は存在しても）、該当 gate は package script の `&&` 分割にフォールバックし、steps はすべて `source: "default"` となる
- [FR-06] `--json` / `--output` の結果 JSON: 各 step に `name` と `source` を追加し、ルートに `configPath` を追加する。config 由来 step の stdout/stderr も既存の `redact()` を通す（既存 redaction を config 経路で迂回しない）
- [FR-07] validation（`run` 実行時）: (a) パース不能（不正 YAML/JSON）、(b) `version` 欠落または 1 以外、(c) 未知の最上位キー、(d) step の型不正・未知キー・未知 gate 値、(e) `command` が空文字列、(f) step 名の識別子規則違反・重複 — のいずれかを検出したら、対象ファイル名と原因を含む CliError で非 0 終了する。ステップ実行は開始しない（fail-fast、silent 続行禁止）
- [FR-08] `.ai-check.yaml` / `.ai-check.json` は `src/cli/managed-files.mjs` の managed 一覧に含めない。init は生成せず、update は上書き・削除せず、doctor は検査しない（SPEC-0057 の overlay と同じ非管理原則）

### 非機能要件
- [NFR-01] 後方互換: 設定ファイルが存在しないプロジェクトでは、`run`（human / `--json` / `--output`）の実行コマンド列・exit code・既存 JSON フィールドの値が本 SPEC 適用前と同一である（追加フィールドのみ増える。既存フィールドの削除・改名はしない）
- [NFR-02] 新規依存を追加しない: 本リポの `package.json` は runtime dependencies ゼロを維持する（YAML はサブセット自前パーサ、JSON は `JSON.parse`。検証: `node -e` で `package.json` に `dependencies` フィールドが存在しない、または空であることを確認）
- [NFR-03] config 読み込み・検証のオーバーヘッドは、設定ファイル不在時 10ms 未満（存在チェック 2 回のみ）、存在時 50ms 未満（計測条件: CI (ubuntu-latest, Node 20+) 上で 20 step 規模の設定ファイルを対象に、`run` 全体からステップ実行時間を除いた前処理時間を before/after 比較。ステップ実行自体は対象外）。検証は T2 の完了条件に含め、閾値超過は CI で WARN（非ブロッキング、fail-fast 対象外）として扱う

### セキュリティ要件
- [SEC-01] config の `command` は**任意コード実行**である。設定ファイルはリポジトリ内のファイルであり、`package.json` scripts・既存 shell scripts と同一の信頼境界内のため、追加のサンドボックス・署名検証は行わない。ただし `docs/cli.md` の config ガイドに「コミットされた command がそのまま実行される。信頼できない変更を混入させないこと」を明記する
- [SEC-02] config への secret / token / API key の直書き禁止を `docs/cli.md` / README の config ガイドで案内する（secret は env var / secret manager 経由）。また config 由来 step の出力も FR-06 のとおり既存 redaction を必ず通す

### 運用要件
- [OPS-01] `run --json` / `--output` の結果から、各 step が設定由来（`source: "config"`）か既定由来（`source: "default"`）か、およびどの設定ファイルが使われたか（`configPath`）を CI ログ・repair プロンプトから機械判別できる
- [OPS-02] FR-07 の validation エラーは、対象ファイル・違反キー（または行の内容）・是正ヒント（例: YAML サブセット外なら「`.ai-check.json` を使う」案内）を 1 メッセージに含め、利用者が設定ファイルだけを見て修正できるようにする
- [OPS-03] 段階観測: v0.5.0 リリース後、本リポ + 外部 dogfooding 1 件で config 利用（ステップ無効化・差し替え各 1 例以上）を 1 リリースサイクル観測する。YAML サブセット制限起因のエラーが `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'ai-check.yaml' sage/failures.md` 等で機械的に件数確認する）、サブセット拡張または部分パッチ対応の SPEC 改訂を起票する

## File Scope

| 区分 | ファイル |
|---|---|
| 新規（CLI） | `src/cli/check-config.mjs`（config 検出・パース・validation・gate 解決） |
| 変更（CLI） | `src/cli/run.mjs`（config 統合、steps への `name`/`source`、ルート `configPath` 追加）, `src/cli/index.mjs`（run usage ヘルプ追記） |
| テスト | `tests/cli/check-config.test.mjs`（新規）, `tests/cli/run.test.mjs`, `tests/cli/managed-files.test.mjs`（非管理の回帰ガード追加）, `tests/cli/package.test.mjs`（pack 内容検査: config 実ファイル非同梱） |
| ドキュメント | `docs/cli.md`, `README.md`, `README-en.md` |

上記以外への変更は本 SPEC のスコープ外。`src/cli/managed-files.mjs`・`src/cli/init.mjs`・`src/cli/update.mjs`・`src/cli/doctor.mjs`・`package-templates/` 配下は**変更しない**（config を managed 化しない・配布しないことが要件そのもの）。`README-ja.md` は `README.md` への stub のため対象外。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 run/expect/managed-files テスト含む）【種別: unit + integration】
- [ ] AC-02: 設定ファイル不在のプロジェクトで `run --script ai:check --json` を実行すると、実行コマンド列・exit code・既存 JSON フィールド値が本 SPEC 適用前と同一で、`configPath: null`・全 step `source: "default"` となる（NFR-01、テストで検証）【種別: integration】
- [ ] AC-03: `full` gate に 3 step（うち 1 件 `enabled: false`、1 件 `command` 省略で package script 名参照）を宣言した `.ai-check.yaml` を置いて `run --script ai:check --json` を実行すると、宣言順に有効 step のみ実行され、無効 step は `SKIPPED`、全 step `source: "config"`、`configPath` が `.ai-check.yaml` となる（テストで検証）【種別: integration】
- [ ] AC-04: 同一スキーマの `.ai-check.json` で AC-03 と同じ解決結果になり（YAML/JSON 等価性）、両ファイル併存時は CliError で非 0 終了する（テストで検証）【種別: integration】
- [ ] AC-05: FR-07 の validation 違反ケース（不正 YAML、`version` 欠落、未知キー、未知 gate 値、空 `command`、重複 step 名）それぞれで、`run` がステップを 1 件も実行せず対象ファイル名入りエラーで非 0 終了する（テストで検証）【種別: unit + integration】
- [ ] AC-06: config に無い gate（例: 設定は `full` のみ宣言）で `run --script ai:check:fast` を実行すると package script にフォールバックし全 step `source: "default"`、また `--script` が 3 ゲート名以外のとき config が存在しても参照されない（テストで検証）【種別: integration】
- [ ] AC-07: config 由来 step の stdout に secret パターン（例: `GITHUB_TOKEN=ghp_...`）を出力させた場合、`--json` 結果で `[REDACTED]` 化されている（SEC-02、テストで検証)【種別: integration】
- [ ] AC-08: `getManagedFiles()` の返す一覧（全 profile / オプション組合せ）に `.ai-check.yaml` / `.ai-check.json` が含まれない（テストで検証）【種別: unit】
- [ ] AC-09: `npm pack --dry-run` / 既存 preflight（`make validate`）が壊れず、pack 内容に `.ai-check.yaml` / `.ai-check.json` という実ファイルが含まれない（`src/cli/check-config.mjs` は含まれる）【種別: build】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | integration | Gate 2: Functional |
| AC-03 | integration | Gate 2: Functional |
| AC-04 | integration | Gate 2: Functional |
| AC-05 | unit + integration | Gate 2: Functional |
| AC-06 | integration | Gate 2: Functional |
| AC-07 | integration | Gate 3: Security |
| AC-08 | unit | Gate 4: Architecture |
| AC-09 | build | Gate 1: Structural |

## 異常系

- 想定エラー1: `.ai-check.yaml` が不正（サブセット外の YAML 構造・インデント崩れ・パース不能）→ `run` はステップ実行前に、ファイル名・問題の行内容・「サブセット外の構造は `.ai-check.json` を使う」案内を含む CliError で非 0 終了する（FR-07 / OPS-02）。silent フォールバック（設定を無視して default 実行）は禁止（Forbidden Shortcuts 参照）。実装中にこのケースで想定外エラーが発生した場合は Error Resolution Protocol に従い、run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` に追記する
- 想定エラー2: step の `command` 省略かつ対象プロジェクトの `package.json` `scripts` に同名 script が無い → 「step `<name>` は command が無く package script `<name>` も存在しない」旨の CliError で非 0 終了する（未知 step 名の実行を黙って skip しない）。実装中の想定外エラーは Error Resolution Protocol に従い処理する
- 想定エラー3: `command` が空文字列・空白のみ、または `enabled` が boolean 以外 → FR-07 の型 validation で CliError（違反 step 名・キー入り）となり非 0 終了する。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → anti-patterns 確認 → failures.md 追記の手順で処理する
- 想定エラー4: `.ai-check.yaml` と `.ai-check.json` が両方存在する → どちらを意図したか判別できないため、両ファイル名を挙げて「片方を削除する」案内付き CliError で非 0 終了する（暗黙の優先順位で片方を silent に無視しない。詳細な検証条件は AC-04 を一次情報源とする）
- 境界ケース1: config で全 step を `enabled: false` にした gate → ステップは全件 `SKIPPED` で実行 0 件、結果 `status` は `PASS`（FAIL した step が無いため）。これは利用者の明示的宣言であり仕様どおり。`docs/cli.md` に「全無効はゲートの実質無効化であり CI での使用は非推奨」と明記する

## 契約

- API: `run` の結果 JSON スキーマ拡張（additive only）: step に `name: string` / `source: "config"|"default"`、ルートに `configPath: string|null`。既存フィールド（`status`/`script`/`command`/`startedAt`/`durationMs`/`steps[].index|command|status|exitCode|durationMs|stdout|stderr`）は不変。設定ファイルスキーマ version 1（FR-02）は `docs/cli.md` に明文化し、以後の破壊的変更は `version` 増分 + 明示エラーで扱う（install state schemaVersion と同じ方針）
- DB: なし
- イベント: なし

## リスク

- リスク1: 「gate ごとに全列挙」モデルでは、既定 1 step の無効化にも該当 gate の全 step 再宣言が必要で冗長 → 軽減策: `command` 省略時の package script 名参照（FR-04）で再宣言コストを最小化し、docs に完成形のコピペ可能な例（3 ゲート分）を掲載する。部分パッチ需要は OPS-03 の観測で判断し別 SPEC 化
- リスク2: 自前 YAML サブセットパーサの制限に利用者が気付かず混乱する → 軽減策: サブセット外検出時のエラーに `.ai-check.json` 案内を必須で含める（OPS-02）+ docs にサブセットの許容構文を明記
- リスク3: config で CI の実行内容が変わることに reviewer が気付かない（ゲートの実質弱体化）→ 軽減策: `run --json` の `source: "config"` / `configPath` で evidence に必ず現れる（OPS-01）+ 境界ケース1 の非推奨明記。config はコミットされた差分としてレビュー可能
- リスク4: 将来 managed ファイル追加時に誤って config パスを managed 一覧に入れる → 軽減策: AC-08 のテストを回帰ガードとして常設する（SPEC-0057 AC-07 と同型）
- リスク5: 機構を撤去する必要が生じた場合 → 軽減策: `run.mjs` の config 統合呼び出しと `check-config.mjs` を削除するのみで現行動作へ復旧できる（config ファイル自体はユーザー領域で installer 非干渉のため、残置されても FR-01 の不在時と同様に無視されるだけ。JSON スキーマの追加フィールドは additive のため consumer 互換）

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: 本 SPEC 固有の禁止事項は本 SPEC 内の Forbidden Shortcuts と AC-08/AC-09 の機械テストで担保され、既存 src-rules.md の一般原則の範囲を超える恒久ルールは発生しないため）

- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素: エラーログ / 失敗ファイル / 関連仕様 / 最近の変更 / Fix scope / 完了条件 に従う）
- 同一エラーパターンが 3 回累積した場合、`sage/anti-patterns.md` への昇格を検討する
- 「config を managed 化しない」「validation 失敗を silent 続行しない」が文章ルールだけだと AP-06（Human-Only Guard）になるため、AC-05 / AC-08 の機械テストをガードとして常設する
- managed 一覧への config パス混入（リスク4）は AP-03（Silent Scope Expansion）と関連し、INV-01 + AC-08 がその対策である
- テスト期待値は本 SPEC の AC から導出し、AC-N 参照をテストケースに付す（AP-07 Hallucination Propagation 対策）
- YAML サブセットパーサは `src/cli/expect.mjs` `parseTemplateYaml()` の前例（意図的サブセット + JSON escape hatch）を踏襲する既知パターンであり、新規パターンではない

## 実装メモ（Implementation Agent向け）

- 現行 `run` の解決方式: `src/cli/run.mjs` — `package.json` の `scripts[options.script]` を取得し `splitCommandChain()`（`&&` split）でステップ化、`spawnSync(..., { shell: true })` で逐次実行、初回 FAIL 以降は `SKIPPED`。config 統合はこの steps 構築部の手前に差し込む（`executeScript()` に steps 配列を渡せる形へ小さくリファクタしてよい）
- gate 名 → script 名の対応は `check-config.mjs` 内の定数マップ（`full: "ai:check"` 等）とし、`--script` 値からの逆引きで gate を決める。3 ゲート名以外は config 非参照（FR-03）
- default 由来 step の `name` は既存の連番 `index` を用いた `step-<index>` とする（既定チェーンのコマンドに安定した名前は無いため。命名の意味付けは config 利用時に利用者が行う）
- YAML サブセット: version 行 + `steps:` + step 名キー + ネストしたスカラー `key: value` + `gates` はインライン配列 `[fast, full]` のみ許可、で FR-02 スキーマを全て表現できる。`expect.mjs` の `splitYamlKeyValue` 系ヘルパと同型の実装とし、共通化は無理にしない（expect のサブセットと形が異なるため。共通化は重複 3 例目で検討）
- config 不在チェックは `pathExists` 2 回で済ませ、`readJson` 等の既存 utils を再利用する（NFR-03）
- redaction: config 経路でも `executeScript` 内の既存 `redact()` を通る構造を保てば FR-06 は自然に満たされる。config 統合で stdout/stderr の取り回しを変えないこと
- 言語規約: docs/cli.md への追記は英語（既存 cli.md が英語のため既存に合わせる）、README.md は日本語 / README-en.md は英語。テストケース名は日本語 + AC-N 参照

### 実装ルール

- `.ai-check.yaml` / `.ai-check.json` という実ファイルをリポジトリ（`package-templates/` 含む）に追加しない（例示は docs 内コードブロックで示す。テストでは一時ディレクトリに生成する）
- validation エラーは CliError（既存の exit code 規約）で表現し、`process.exit` 直呼びや console 直書きをしない
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `tests/cli/run.test.mjs` の既存期待値は steps の形（フィールド集合）に依存している可能性がある → `name` / `source` / `configPath` 追加に伴う期待値更新が必要（File Scope に含めた理由）
- `docs/cli.md` の run オプション表・JSON フィールド説明の更新が必要（`--json` の説明文に `name`/`source`/`configPath` を追加）
- `expect` の YAML パーサとは意図的に独立させる（前述）。`expect` 側の挙動・docs は変更しない

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: `src/cli/check-config.mjs` 新規作成（検出・YAML サブセット/JSON パース・FR-02/FR-07 validation・gate 解決）+ `tests/cli/check-config.test.mjs`（依存なし）
  - 完了条件: AC-05 の全 validation ケースと AC-04 の YAML/JSON 等価・併存エラーが unit テストでパスする
- T2: `run.mjs` への config 統合 + `--json` 拡張（`name`/`source`/`configPath`）+ `index.mjs` usage 追記 + `tests/cli/run.test.mjs` 更新（依存: T1）
  - 完了条件: AC-02 / AC-03 / AC-06 / AC-07 のテストが `node --test tests/cli/run.test.mjs` でパスする
- T3: managed 非包含・pack 内容の回帰ガード（`tests/cli/managed-files.test.mjs` / `tests/cli/package.test.mjs` 追記）（依存なし、T1/T2 と並列可）
  - 完了条件: AC-08 のテストがパスし、AC-09 の `npm pack --dry-run` 検査が `tests/cli/package.test.mjs` でパスする
- T4: `docs/cli.md` / README（ja/en）への config ガイド追加（スキーマ・3 ゲート完成例・フォールバック規則・SEC-01/SEC-02 案内・境界ケース1 の非推奨明記）（依存: T2）
  - 完了条件: `grep -l 'ai-check.yaml' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットする + `grep -q 'secret' docs/cli.md`（追記セクションに secret 直書き禁止の記載が存在することの機械検証）+ 既存 secret scan（Gate 3 相当の `bash scripts/sage-validate.sh`）がパスする + `npm pack --dry-run` パス（AC-09）

T1（新規モジュール）・T2（run.mjs 系）と T3（テストのみ）はいずれも編集対象ファイルが重複しないため並列実行時にコンフリクトしない。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- `.ai-check.yaml` / `.ai-check.json` を `src/cli/managed-files.mjs` の managed 一覧に追加することの禁止（検出: AC-08 の回帰テスト）
- config のパース・validation 失敗時に default 動作へ silent フォールバックして実行を続けることの禁止 — 必ず CliError で非 0 終了（検出: AC-05 のテスト — 違反ケースでステップ 0 件実行 + 非 0 終了）
- config 由来 step の出力で既存 `redact()` を迂回することの禁止（検出: AC-07 のテスト）
- `.ai-check.yaml` / `.ai-check.json` という実ファイルを配布物・本リポに追加することの禁止（検出: AC-09 の npm pack 内容検査 + レビュー）
- YAML パーサのために npm 依存（`yaml` / `js-yaml` 等）を追加することの禁止（検出: NFR-02 の `package.json` dependencies 検査を `tests/cli/package.test.mjs` に含める）
- 結果 JSON の既存フィールドの削除・改名・型変更の禁止（additive only）（検出: AC-02 のテスト — 既存フィールド値の同一性検証）
- docs への secret 直書き例の掲載禁止（例示は env var 参照形式のみ）（検出: 既存 secret scan（Gate 3）+ レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 4) `getManagedFiles()` の返す一覧は、いかなる profile / オプション組合せでも `.ai-check.yaml` / `.ai-check.json` を含まない
- [INV-02] (Gate 2) 設定ファイルが存在しない場合、`run` の実行コマンド列・exit code・既存 JSON フィールド値は本 SPEC 適用前と同一である（opt-in 保証）
- [INV-03] (Gate 2) config の validation エラー時、ステップは 1 件も実行されない（fail-fast）
- [INV-04] (Gate 3) すべての step の stdout/stderr は、由来（config / default）にかかわらず `redact()` を通ってから結果に記録される
- [INV-05] (Gate 2) 結果 JSON の各 step の `source` は、当該 step の実行コマンドの由来（config 解決 / package script 分割）と常に一致する
- [INV-06] (Gate 2) update / doctor の実行前後で `.ai-check.yaml` / `.ai-check.json` の内容・存在は不変である（既存コード無変更で満たされるが、AC-08 の非包含が根拠）

### Pre-conditions
- [PRE-01] (Gate 2) config の検出は `--target` ディレクトリ直下のみで行い、呼び出し cwd・親ディレクトリ探索に依存しない

### Post-conditions
- [POST-01] (Gate 2) `run` の結果 JSON は常に `configPath` フィールドを持ち、config を参照した実行では設定ファイルの相対パス、それ以外では `null` である
- [POST-02] (Gate 2) config 参照実行の steps は、該当 gate を宣言した step と 1:1 対応し、宣言順を保つ

### Assumptions
- [ASM-01] (Gate 横断) リポジトリ内容（config ファイル含む）は信頼境界内であり、実行者は clone 時点でリポジトリを信頼している（SEC-01、`package.json` scripts と同等）
- [ASM-02] (Gate 横断) 対象プロジェクトの gate 用 package scripts 名は `ai:check` / `ai:check:fast` / `ai:check:secure`（init が配布する `package.scripts.fragment.json` の名前）である。改名した場合 config の gate 解決は働かない（FR-03 のとおり非参照になるだけで、エラーにはならない）
- [ASM-03] (Gate 横断) `expect.mjs` の template-subset YAML パーサ前例のとおり、意図的 YAML サブセット + JSON escape hatch は本リポの確立済み設計パターンである

## 関連ID

- PLAN-ID: PLAN-0058
- TASK-ID: TASK-0206, TASK-0207, TASK-0208, TASK-0209
