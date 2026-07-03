# SPEC-0059: 形名参同レポート — AC 宣言と run 実測の機械照合（`report` コマンド）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0059 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0050（AC/Test Matrix 構造化フォーマット — `expect` と schema の出自）、SPEC-0049（structured run — run 結果 JSON の出自）、SPEC-0058（`.ai-check.yaml` config — run 結果への `name`/`source`/`configPath` 追加） |
| 権限レベル | platform |

## 背景・目的

本パッケージの中核思想「形名参同」は、**実装前に成功基準（AC）を宣言し、実装後に実測値と照合する** ループである。現状、宣言側と実測側の道具は揃っている:

- 宣言側: `ai-check-template expect --file <path>`（`src/cli/expect.mjs`）が AC/Test Matrix 構造化ファイル（`package-templates/docs/ac-test-matrix.schema.json` 準拠の JSON / template-subset YAML）を validation する。AC は `id`（`AC-NN`）・`criterion`・`command`（・任意 `layer`）を持つ
- 実測側: `ai-check-template run --json / --output`（`src/cli/run.mjs`）が step ごとの `name` / `source` / `command` / `status`（PASS/FAIL/SKIPPED）/ `exitCode` / `durationMs` / redact 済み stdout・stderr と、ルートの `status` / `script` / `command` / `startedAt` / `durationMs` / `configPath` を構造化 JSON として出力する

しかし両者を**突き合わせる機械はまだ無く**、「宣言した AC のうち何件が実測で検証されたか」の判定は人間（または AI の自己申告）に委ねられている。AI の「完了しました」という自己申告と実測の乖離こそ形名参同が塞ぐべき穴であり、この照合を手作業に残すのは中核ループの欠落である。

本 SPEC は次の 3 点を追加する:

1. **`ai-check-template report --expect <file> --run <run-result.json>`**: 新サブコマンド `report` として照合機能を追加する。`expect --verify-against` の拡張ではなくサブコマンド新設とする理由: (a) 既存 CLI は 1 コマンド = 1 責務（validate / run / init / doctor / update）で構成されており、`expect` の責務は「宣言ファイル単体の validation」、照合は「2 入力の突き合わせ」で責務が異なる、(b) `expect` の既存挙動を一切変えない additive 追加にできる（NFR-01）
2. **`--format markdown`**: PR 本文（`package-templates/.github/PULL_REQUEST_TEMPLATE.md` の Verification 節）や worksheet（`package-templates/worksheet/ai-code-understanding.md`）に貼れる Markdown 表フラグメント（AC ID / 宣言内容 / 対応 step or コマンド / PASS・FAIL・未検証）を出力する
3. **run 結果 JSON のスキーマ固定**（残ギャップ #8）: `run --json` の出力スキーマ（SPEC-0058 で追加した `name` / `source` / `configPath` を含む）を JSON Schema ファイル `package-templates/docs/run-result.schema.json` として固定し、テストで実出力と照合する。以後の変更は additive のみ許容する回帰ガードとし、`report` が読む run 結果の契約を安定させる

照合キーは**明示キーのみ**とする。AC エントリに任意フィールド `step`（run 結果の step `name` を指す）を additive に追加し、`step` 省略時は AC の `command` と step の `command` の**完全一致**（trim 後の文字列等価）でのみ対応付ける。部分一致・正規化・類似度などの曖昧照合は行わない（Forbidden Shortcuts 参照）。理由: 照合結果は CI の判定材料（`--strict`）になるため、「どの AC がどの実測に対応したか」が決定的・再現可能・レビュー可能でなければならない。

## 対象ユーザー

- AI 内部ループで「実装完了」を自己申告ではなく実測で判定したい開発者 / AI エージェント（`--strict` を CI・Stop hook 後段の判定に使う）
- PR reviewer — Markdown フラグメントで「宣言済み AC の検証状況」を PR 上で一覧確認する
- 既存の `expect` / `run` 利用者 — 両コマンドの挙動は不変（NFR-01）
- 本リポ maintainer — run 結果 JSON スキーマの回帰ガードにより `report` の入力契約を保守する

## スコープ（含む）

- 新サブコマンド `report`: `ai-check-template report --expect <file> --run <file> [--format <text|markdown|json>] [--json] [--strict]`。`--expect` は AC/Test Matrix ファイル（JSON / template-subset YAML、`expect` と同じパーサ・validation を再利用）、`--run` は `run --output` / `run --json` が書いた結果 JSON
- 照合規則（決定的・明示キーのみ）:
  - AC エントリの新規任意フィールド `step`（非空文字列）が run 結果の step `name` と完全一致すればその step に対応付ける
  - `step` 省略時、AC の `command` と trim 後完全一致する step が**ちょうど 1 件**あればその step に対応付ける。0 件または 2 件以上（曖昧）なら対応なし = 未検証（判定理由 `no-match` / `ambiguous-command` を結果に記録）
  - AC ごとの判定: 対応 step の `status` が `PASS` → **PASS**、`FAIL` → **FAIL**、`SKIPPED` または対応なし → **未検証（UNVERIFIED）**
- 出力: `--format text`（既定、human 向け）/ `--format markdown`（AC ID・宣言内容・対応 step or コマンド・判定の表 + 検証済み件数サマリ行）/ `--format json`（機械可読。`--json` は `--format json` の別名として既存 CLI 慣習に合わせて受け付ける）
- `--strict`: 判定が FAIL または未検証の AC が 1 件以上あれば非 0 終了する（CI 利用可能な形名参同判定）。`--strict` 無しでは照合レポートのみで exit 0（入力不正時を除く）
- 入力 validation: expect 側は既存 `expect` と同一の validation を通し、fail なら非 0 終了。run 側は `run-result.schema.json` 相当の構造チェック（必須フィールド・型・step 配列）を行い、不一致なら非 0 終了
- `ac-test-matrix.schema.json` への additive 変更: `acceptanceCriteria[].step`（任意、非空文字列）を追加し、`expect` の validation も `step` を許容する（後方互換: `step` 無しの既存ファイルは従来どおり pass）。example（`ac-test-matrix.example.json` / `.yaml`）に `step` の記載例を追加
- run 結果 JSON スキーマの固定: `package-templates/docs/run-result.schema.json`（新規、draft 2020-12）を配布物に追加し、`run --json` の実出力がスキーマの必須フィールド・型と一致することをテストで検証する（additive-only 回帰ガード）
- `package-templates/.github/PULL_REQUEST_TEMPLATE.md` Verification 節に「`report --format markdown` の出力を貼る」案内コメントを 1 行追加（managed ファイルの additive 変更）
- `docs/cli.md` / README（ja/en）への `report` ガイド追記（照合規則・`step` フィールド・`--strict` の CI 例）

## スコープ外（明示的に除外）

- `doctor` への AC 欠落警告統合（AC/Test Matrix ファイル不在の検出等）— 依頼 D-2 後段として将来 SPEC
- profile 合成・monorepo 対応 — 別 SPEC（候補 B 系）
- CI テンプレート（`package-templates/ci/` / GitHub Actions workflows）への `report` 組み込み — docs に CI 例を示すのみで workflow ファイルは変更しない
- PR 横断の履歴集計・トレンド分析（複数 run 結果の統合）— 本 SPEC は 1 expect × 1 run の照合のみ
- 曖昧照合（部分一致・正規化・類似度・testMatrix の `command` 経由の推移的対応付け）— 明示キーのみ。testMatrix 行と step の照合も将来検討（v1 は AC 単位のみ）
- `run` から `report` の自動連続実行（`run --expect` のようなワンショット統合）— 責務分離を保つ。パイプラインは利用者が 2 コマンドで組む
- `expect` / `run` の既存挙動・既存出力フィールドの変更（additive のみ）

## 要件

### 機能要件
- [FR-01] `report` は `--expect` / `--run` の両方が必須で、欠落時は usage 付き CliError で非 0 終了する。`--format` は `text`（既定）/ `markdown` / `json` のみ受け付け、未知値はエラー。`--json` は `--format json` の別名
- [FR-02] expect 入力は `src/cli/expect.mjs` の既存パース・validation（`validateExpectationFile` 相当）を再利用し、validation fail なら照合せず既存 `expect` と同型の issue 一覧付き CliError で非 0 終了する
- [FR-03] run 入力は `run-result.schema.json` と同等の構造チェック（ルート `status`/`script`/`command`/`startedAt`/`durationMs`/`configPath`/`steps` の存在と型、各 step の `index`/`name`/`source`/`command`/`status`/`exitCode`/`durationMs`/`stdout`/`stderr` の存在と型）を行い、不一致ならフィールド名入り CliError で非 0 終了する
- [FR-04] 照合は明示キーのみ: (a) AC に `step` があれば step `name` との完全一致、(b) `step` 省略時は AC `command` と step `command` の trim 後完全一致がちょうど 1 件の場合のみ対応付ける。各 AC の結果に対応 step 名（または `null`）と判定理由（`matched-step` / `matched-command` / `no-match` / `ambiguous-command`）を記録する
- [FR-05] AC ごとの判定は PASS（対応 step が PASS）/ FAIL（対応 step が FAIL）/ UNVERIFIED（対応なし・対応 step が SKIPPED）の 3 値。サマリとして宣言 AC 総数・PASS 件数・FAIL 件数・UNVERIFIED 件数を出力する
- [FR-06] `--format markdown` は、ヘッダ行 `| AC | 宣言内容 | 対応 step / コマンド | 判定 |` の GitHub Flavored Markdown 表 + `検証済み N / 宣言 M` のサマリ行を出力し、PR 本文にそのまま貼って表として描画される（表セル内の `|` はエスケープする）
- [FR-07] `--strict` 指定時、FAIL または UNVERIFIED の AC が 1 件以上あれば exit code 1 で終了する（レポート出力は行った上で）。`--strict` 無しでは照合結果にかかわらず exit 0（入力不正 FR-01〜03 を除く）
- [FR-08] `ac-test-matrix.schema.json` に `acceptanceCriteria[].step`（任意、`minLength: 1` の string）を additive に追加し、`expect` は `step` 有り/無しの両ファイルを従来どおり validation する（`step` の値が非空文字列でない場合のみ issue）。既存必須フィールド・validation 規則は不変
- [FR-09] `package-templates/docs/run-result.schema.json` を新規追加し、`run --json` の実出力（config 有り/無し両経路）がスキーマに適合することをテストで固定する。スキーマは `additionalProperties` を許容しない厳格形とし、フィールド削除・改名・型変更はテスト失敗として検出される（additive 変更時はスキーマとテストを同時更新する運用）

### 非機能要件
- [NFR-01] 後方互換: `expect` / `run` の既存挙動（実行コマンド列・exit code・既存出力フィールド）は本 SPEC 適用前と同一である。`ac-test-matrix.schema.json` は `step` 追加以外不変で、既存の valid なファイルはすべて valid のまま（検証: 既存 `tests/cli/expect.test.mjs` / `tests/cli/run.test.mjs` が無修正の期待値部分で pass し続けること）
- [NFR-02] 新規依存を追加しない: 照合・Markdown 生成・run JSON 構造チェックはすべて自前実装とし、`package.json` の runtime dependencies ゼロを維持する（JSON Schema validator（ajv 等）を追加しない。検証: `tests/cli/package.test.mjs` の dependencies 検査）
- [NFR-03] `report` の実行時間は、AC 50 件 × step 50 件規模の入力で 200ms 未満（計測条件: CI (ubuntu-latest, Node 20+) 上で `node --test` 内の `performance.now()` 計測、ファイル読み込み込み・プロセス起動時間除く。照合は O(AC × step) の単純走査で足りる規模）。閾値超過は CI で WARN（非ブロッキング）として扱う
- [NFR-04] report の新規コードパス（照合・判定・3 形式出力・--strict 分岐）は各分岐に最低 1 テストケースを対応させる（分岐網羅はテストケース列挙で担保、カバレッジツール導入は不要 — SPEC-0056 AC-03 と同方針）

### セキュリティ要件
- [SEC-01] `report` は入力 2 ファイルの読み取りと stdout 出力のみで、コマンド実行・ファイル書き込み・ネットワークアクセスを行わない（読み取り専用コマンド）
- [SEC-02] run 結果の stdout/stderr は `run` 側で redact 済み（SPEC-0058 FR-06）であり、`report` の text / markdown / json 出力には step の stdout/stderr を**含めない**（AC ID・宣言内容・step 名・コマンド・判定のみ）。PR に貼るフラグメント経由で実行ログ断片（redact 漏れリスク）が公開面に流出する経路を作らない

### 運用要件
- [OPS-01] `--format json` の結果から、各 AC の判定・対応 step・判定理由（`matched-step` 等）を CI / repair プロンプトが機械判読できる。UNVERIFIED の理由（`no-match` / `ambiguous-command`）が区別できるため、AI は「`step` フィールドを追記して明示対応付けする」是正を自動提案できる
- [OPS-02] 入力不正エラー（FR-01〜03）は、対象ファイル・違反フィールド・是正ヒント（例: run JSON が古い場合「`run --output` を再実行する」案内）を 1 メッセージに含める
- [OPS-03] 段階観測: v0.5.0 リリース後、本リポ + 外部 dogfooding 1 件で `report --strict` を PR ゲートに 1 リリースサイクル試験適用する。`ambiguous-command` 起因の UNVERIFIED が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'ambiguous-command' sage/failures.md` で機械的に件数確認する）、`step` フィールドの必須化または照合規則の SPEC 改訂を起票する

## File Scope

| 区分 | ファイル |
|---|---|
| 新規（CLI） | `src/cli/report.mjs`（照合・判定・text/markdown/json 出力・run JSON 構造チェック） |
| 変更（CLI） | `src/cli/expect.mjs`（validation の `step` 許容 + 照合から再利用する関数の export 化のみ。既存挙動不変）, `src/cli/index.mjs`（`report` コマンド登録・usage 追記） |
| 新規（配布 schema） | `package-templates/docs/run-result.schema.json` |
| 変更（配布物） | `package-templates/docs/ac-test-matrix.schema.json`（`step` additive 追加）, `package-templates/docs/ac-test-matrix.example.json` / `ac-test-matrix.example.yaml`（`step` 記載例）, `package-templates/.github/PULL_REQUEST_TEMPLATE.md`（Verification 節に案内コメント 1 行） |
| テスト | `tests/cli/report.test.mjs`（新規）, `tests/cli/run-schema.test.mjs`（新規: run --json 実出力 × run-result.schema.json の回帰ガード）, `tests/cli/expect.test.mjs`（`step` 許容の追加ケース）, `tests/cli/package.test.mjs`（pack 内容: schema 同梱確認 + dependencies ゼロ検査） |
| ドキュメント | `docs/cli.md`, `README.md`, `README-en.md` |

上記以外への変更は本 SPEC のスコープ外。`src/cli/run.mjs`・`src/cli/doctor.mjs`・`src/cli/init.mjs`・`src/cli/update.mjs`・`src/cli/managed-files.mjs`・CI workflow テンプレートは**変更しない**（run の出力契約はスキーマ固定の対象であって変更対象ではない。PULL_REQUEST_TEMPLATE.md は既に managed 一覧に含まれるため managed-files.mjs の変更は不要）。`README-ja.md` は `README.md` への stub のため対象外。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 expect/run テストの無修正期待値部分を含む）【種別: unit + integration】
- [ ] AC-02: `step` フィールドで step 名を明示した AC を含む expect ファイルと、PASS/FAIL/SKIPPED を混在させた run 結果 JSON に対し `report --format json` を実行すると、各 AC の判定（PASS/FAIL/UNVERIFIED）・対応 step 名・判定理由（`matched-step` / `matched-command` / `no-match` / `ambiguous-command`）・サマリ件数が期待どおり出力される（テストで検証）【種別: integration】
- [ ] AC-03: `step` 省略の AC について、run 結果に同一 `command` の step が 1 件なら `matched-command` で対応付き、同一 `command` の step が 2 件以上なら `ambiguous-command` で UNVERIFIED になる（曖昧照合しないことの検証。テストで検証）【種別: unit】
- [ ] AC-04: `report --format markdown` の出力が、AC ID / 宣言内容 / 対応 step・コマンド / 判定 の GFM 表 + サマリ行であり、セル値に `|` を含むケースでも表構造が壊れない。出力に step の stdout/stderr が含まれない（SEC-02。テストで検証）【種別: integration】
- [ ] AC-05: FAIL または UNVERIFIED の AC が 1 件以上あるとき `report --strict` は exit code 1 で終了し、全 AC PASS なら exit 0。`--strict` 無しでは同一入力でも exit 0（テストで検証）【種別: integration】
- [ ] AC-06: 入力不正の各ケース — (a) expect ファイルが validation fail（`missing-acceptance-criteria` 等）、(b) run JSON がパース不能、(c) run JSON が `run-result.schema.json` の必須フィールド欠落（例: steps[].name 無し）、(d) run 結果内の step `name` 重複（照合キー一意性違反）— それぞれ AC-06a〜AC-06d として独立にテストし、`report` が照合結果を出力せず対象ファイル名・原因入り CliError で非 0 終了する（各サブケースに最低 1 テストケース）【種別: unit + integration】
- [ ] AC-07: `run --json` の実出力（config 経路・default 経路の両方）が `package-templates/docs/run-result.schema.json` の必須フィールド・型・許容値に適合し、スキーマに無いフィールドが出力に存在しない（回帰ガード。`tests/cli/run-schema.test.mjs` で検証）【種別: integration】
- [ ] AC-08: `step` 有り/無し両方の AC/Test Matrix ファイルが `expect` で pass し、`step` が空文字列の場合は issue になる（FR-08 後方互換。`tests/cli/expect.test.mjs` で検証)【種別: unit】
- [ ] AC-09: `npm pack --dry-run` の内容に `package-templates/docs/run-result.schema.json` と更新済み `ac-test-matrix.schema.json` が含まれ、`package.json` に runtime dependencies が存在しない（NFR-02。`tests/cli/package.test.mjs` で検証）【種別: build】
- [ ] AC-10: `grep -q 'report' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットし、`package-templates/.github/PULL_REQUEST_TEMPLATE.md` の Verification 節に report 案内行が存在する（`grep -q 'report --format markdown' package-templates/.github/PULL_REQUEST_TEMPLATE.md`）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | integration | Gate 2: Functional |
| AC-03 | unit | Gate 2: Functional |
| AC-04 | integration | Gate 2: Functional + Gate 3: Security（stdout 非含有） |
| AC-05 | integration | Gate 2: Functional |
| AC-06 | unit + integration | Gate 2: Functional |
| AC-07 | integration | Gate 4: Architecture（出力契約の回帰ガード） |
| AC-08 | unit | Gate 2: Functional |
| AC-09 | build | Gate 1: Structural |
| AC-10 | docs | Gate 1: Structural |

## 異常系

- 想定エラー1: `--expect` の AC ファイルが不正（パース不能・必須フィールド欠落・AC ID 重複等）→ `report` は照合を開始せず、既存 `expect` と同型の issue 一覧（`invalid-format` / `missing-field` / `duplicate-ac` 等）を含む CliError で非 0 終了する（FR-02。詳細な検証条件は AC-06(a) を一次情報源とする）。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` 追記
- 想定エラー2: `--run` の JSON がパース不能、または `run-result.schema.json` の必須フィールド・型と不一致（旧バージョンの run 出力・手書き JSON・別ツールの出力など）→ 違反フィールド名と「`ai-check-template run --output` で再生成する」案内を含む CliError で非 0 終了する（FR-03 / OPS-02。検証条件は AC-06(b)(c) を一次情報源とする）。silent に部分照合しない
- 想定エラー3: 照合キーの重複 — run 結果内に同名 `name` の step が複数存在する（config の validation は重複 step 名を拒否するが、手編集された run JSON では起こり得る）→ `step` 明示キーの一意解決が不可能なため、重複 step 名を挙げた CliError で非 0 終了する（検証条件は AC-06(d) を一次情報源とする）。AC の `command` 完全一致が複数 step に当たるケースはエラーではなく `ambiguous-command` の UNVERIFIED とする（AC-03 を一次情報源とする。run JSON 自体は正常であり、宣言側の是正 = `step` 追記で解決すべきため）
- 想定エラー4: AC の `step` が run 結果に存在しない step 名を指す → エラーではなく `no-match` の UNVERIFIED とする（検証条件は AC-02 を一次情報源とする）。run が途中 FAIL して後続 step が SKIPPED の場合と扱いを揃え、「未検証」として `--strict` で捕捉する設計。docs に「`step` の typo も UNVERIFIED になるため、`--strict` を CI に入れることで typo も検出される」旨を明記する
- 境界ケース1: acceptanceCriteria 全件が UNVERIFIED（照合 0 件）→ レポートは正常出力し、`--strict` では「宣言済み AC に対応する検証が 1 件も無い」として exit 1（AC-05 の FAIL/UNVERIFIED ≥1 件条件に包含される）。AI の「完了しました」自己申告のみで検証ゼロの状態を CI が機械的に弾く、本 SPEC の中核ケース

## 契約

- API: (1) 新コマンド `report` の JSON 出力スキーマ: ルートに `status`（`pass` = FAIL/UNVERIFIED 0 件 / `fail`）・`expectFile`・`runFile`・`summary`（`total`/`passed`/`failed`/`unverified`）・`criteria[]`（`id`/`criterion`/`step`/`command`/`verdict`/`reason`）。以後の変更は additive のみ。 (2) `ac-test-matrix.schema.json` v 追加: `acceptanceCriteria[].step`（任意）— additive、既存ファイルの妥当性不変。 (3) `run-result.schema.json` — `run --json` の現行出力（SPEC-0049 + SPEC-0058）を固定する初版。以後 `run` の出力変更は本スキーマ + AC-07 テストの同時更新を必須とし、削除・改名・型変更は禁止（additive only）
- DB: なし
- イベント: なし

## リスク

- リスク1: `command` 完全一致フォールバックが「たまたま同一コマンド」で誤対応する → 軽減策: 一致が 2 件以上なら対応付けず `ambiguous-command`（AC-03）。1 件一致の誤対応は宣言側の `command` がその step と同一実行内容であることを意味し、形名参同上は正しい対応。docs では `step` 明示を推奨形として先に示す
- リスク2: `run` の出力を変更する将来 SPEC が `run-result.schema.json` の更新を忘れ、`report` が壊れる → 軽減策: AC-07 の回帰ガードが CI で必ず検出する（スキーマ厳格形のため additive 追加でもテスト更新が必要 = 契約変更が必ず可視化される）
- リスク3: PR template 追記が既存利用者の update で conflict する → 軽減策: 追記は Verification 節への 1 行コメントのみの additive 変更で、SPEC-0056 の 3-way update により未改変ユーザーは自動追従、改変済みユーザーは skip-modified で保護される（既存機構のまま、本 SPEC での特別対応は不要）
- リスク4: `--strict` を導入した CI が UNVERIFIED 多発でブロック続きになり、利用者が `--strict` を外して形骸化する → 軽減策: OPS-01 の判定理由で是正（`step` 追記）を機械提案可能にし、OPS-03 で `ambiguous-command` 累積を観測して照合規則の改訂判断につなげる
- リスク5: 機構を撤去する必要が生じた場合 → 軽減策: `report.mjs` と `index.mjs` の登録行を削除するのみで既存コマンドへ影響しない（`expect.mjs` の変更は export 化と `step` 許容のみで、削除しても既存ファイルの妥当性は不変。schema の `step` は任意フィールドのため残置しても無害）

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: 本 SPEC 固有の禁止事項は本 SPEC 内の Forbidden Shortcuts と AC-03 / AC-07 の機械テストで担保され、既存 src-rules.md の一般原則の範囲を超える恒久ルールは発生しないため）

- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。同一パターン 3 回累積で `sage/anti-patterns.md` への昇格を検討する
- 「曖昧照合しない」「run スキーマを additive only に保つ」が文章ルールだけだと AP-06（Human-Only Guard）になるため、AC-03 / AC-07 の機械テストをガードとして常設する
- `run` 出力変更時のスキーマ更新漏れ（リスク2）は AP-03（Silent Scope Expansion）と関連し、AC-07 の厳格スキーマ照合がその対策である
- テスト期待値は本 SPEC の AC から導出し、AC-N 参照をテストケースに付す（AP-07 Hallucination Propagation 対策）
- 「読み取り専用コマンド + 明示キー照合」は `expect`（SPEC-0050）の validation-only 設計の延長にある既知パターンであり、新規パターンではない

**補記**: 本 SPEC 固有の Forbidden Shortcuts（曖昧照合禁止・additive-only 等）は `.claude/rules/src-rules.md` の一般原則『Silent scope expansion』『Bypassing quality gates』の具体化であり、新規の恒久ルールではない（AC-03/AC-07 の機械テストで検出）。

## 実装メモ（Implementation Agent向け）

- `expect.mjs` の再利用: `validateExpectationFile()`（またはパース + `validateExpectation()`）を export し、`report.mjs` から呼ぶ。`step` 許容は `validateExpectation()` に「`step` があれば非空文字列」チェックを 1 箇所追加するだけでよい（`requireString` は必須用のため任意フィールド用の分岐に注意）
- run JSON 構造チェック: ajv を入れず、`report.mjs` 内の手書きチェッカ（必須キー・typeof・`status` 列挙値）で FR-03 を満たす。`run-result.schema.json` は配布ドキュメント + テスト照合用の一次情報源であり、runtime で schema ファイルを読み込んで解釈する必要はない（チェッカとスキーマの一致は AC-07 のテストが両方向から固定する）
- `tests/cli/run-schema.test.mjs`: `run --json` を一時プロジェクト（config 有り/無し）で実行し、出力のキー集合・型を `run-result.schema.json` の `properties` / `required` と突き合わせる小さな再帰比較を書く（validator ライブラリ不要）
- 照合の一意性前提: 照合前に run steps の `name` 重複を検査してエラー（想定エラー3）、expect 側の AC ID 重複は既存 validation（`duplicate-ac`）が検出する
- Markdown 出力: セル内 `|` は `\|` にエスケープ。宣言内容（criterion）は長文になり得るがトリミングしない（PR 上での正確性優先）
- exit code 規約: 既存どおり CliError（`expect` は fail 時に `CliError(..., 1)`）で表現し、`process.exit` 直呼びをしない
- 言語規約: docs/cli.md への追記は英語（既存 cli.md に合わせる）、README.md は日本語 / README-en.md は英語、テストケース名は日本語 + AC-N 参照。markdown 表のヘッダは配布物利用者向けのため日本語（`| AC | 宣言内容 | 対応 step / コマンド | 判定 |`）でよい

### 実装ルール

- 照合ロジックに部分一致・正規化・類似度を実装しない（完全一致のみ。Forbidden Shortcuts 参照）
- `report` からコマンド実行（spawn 系）・ファイル書き込みを行わない（SEC-01）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `tests/cli/expect.test.mjs` は `validateExpectation` の issue 集合に依存 → `step` 空文字列の新 issue コード追加分のみ期待値追加（既存ケースは不変）
- `package-templates/docs/ac-test-matrix.example.json` / `.yaml` は `tests/cli/package.test.mjs` や docs から参照されている可能性 → `step` 追記は additive のため既存参照は壊れない（`expect` の example validation テストがあれば pass し続けることを確認）
- `index.mjs` の USAGE 文字列にコマンド一覧・オプション表があるため `report` 節の追記が必要
- PULL_REQUEST_TEMPLATE.md は managed ファイル → 内容更新はテンプレート側の変更として通常の update 追従に乗る（managed-files.mjs の変更は不要）

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: `package-templates/docs/run-result.schema.json` 新規作成 + `tests/cli/run-schema.test.mjs`（run --json 実出力との照合回帰ガード）（依存なし）
  - 完了条件: AC-07 のテストが `node --test tests/cli/run-schema.test.mjs` でパスする
- T2: `ac-test-matrix.schema.json` への `step` 追加 + example 2 ファイル更新 + `expect.mjs` の `step` 許容・再利用 export + `tests/cli/expect.test.mjs` 追加ケース（依存なし）
  - 完了条件: AC-08 のテストがパスし、既存 expect テストが無修正期待値部分でパスする
- T3: `src/cli/report.mjs` 新規作成（照合・判定・3 形式出力・`--strict`・run JSON 構造チェック）+ `index.mjs` 登録 + `tests/cli/report.test.mjs`（依存: T2。expect 再利用 export を使うため）
  - 完了条件: AC-02 / AC-03 / AC-04 / AC-05 / AC-06 のテストが `node --test tests/cli/report.test.mjs` でパスする
- T4: `package.test.mjs` の pack 内容・dependencies 検査追記 + PULL_REQUEST_TEMPLATE.md 案内行 + `docs/cli.md` / README（ja/en）の report ガイド（依存: T3）
  - 完了条件: AC-09 のテストがパスし、AC-10 の grep 検証 2 件がヒットし、`npm pack --dry-run` / 既存 preflight（`make validate`）が壊れない

T1（schema + 専用テスト）と T2（expect 系）は編集対象ファイルが重複しないため並列実行時にコンフリクトしない。T3 は T2 の export に依存、T4 は T3 のコマンド実在に依存（docs が存在しない機能を先に説明しない）。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- 照合への曖昧一致（部分一致・大文字小文字無視・空白正規化超え・類似度・推測対応付け）の実装禁止 — trim 後完全一致と明示 `step` キーのみ（検出: AC-03 のテスト — 同一 command 複数 step で UNVERIFIED になることの検証 + レビュー）
- `run` 結果 JSON / `report` JSON / `ac-test-matrix.schema.json` の既存フィールドの削除・改名・型変更の禁止（additive only）（検出: AC-07 の厳格スキーマ照合テスト + AC-08 / NFR-01 の後方互換テスト）
- run JSON の構造不一致・照合キー重複時に silent に部分照合して続行することの禁止 — 必ず CliError で非 0 終了（検出: AC-06 のテスト — 照合結果を出力せず非 0 終了）
- `report` の出力（text / markdown / json）に step の stdout / stderr を含めることの禁止（redact 漏れの公開面流出防止）（検出: AC-04 のテスト — 出力に stdout 断片が含まれないことの検証）
- JSON Schema validation のための npm 依存（ajv / zod 等）追加の禁止（検出: AC-09 の dependencies 検査）
- `report` 内からのコマンド実行・ファイル書き込みの禁止（読み取り専用コマンド）（検出: レビュー + `report.mjs` に `child_process` / `writeFile` import が無いことの grep 検査を `tests/cli/report.test.mjs` に含める）
- `expect` / `run` の既存挙動を変える変更の禁止（`expect.mjs` は export 化と `step` 許容のみ）（検出: AC-01 — 既存テストの無修正期待値部分の pass 継続）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) 照合結果は決定的である: 同一の expect ファイルと run 結果 JSON に対し、`report` は常に同一の判定・対応付け・exit code を返す（時刻・環境・実行順序に依存しない）
- [INV-02] (Gate 2) 各 AC は高々 1 つの step に対応付く。対応の根拠は常に `matched-step` または `matched-command`（一意一致）のいずれかで、結果 JSON の `reason` と一致する
- [INV-03] (Gate 2) `summary` の `passed + failed + unverified` は常に宣言 AC 総数 `total` に等しい
- [INV-04] (Gate 2) 入力不正（FR-01〜03・照合キー重複）のとき、照合レポートは一切出力されない（fail-fast。部分レポート禁止）
- [INV-05] (Gate 3) `report` のいかなる出力形式にも step の stdout / stderr は含まれない
- [INV-06] (Gate 4) `run --json` の出力キー集合・型は `run-result.schema.json` と常に一致する（回帰ガード AC-07）

### Pre-conditions
- [PRE-01] (Gate 2) `report` は `--expect` / `--run` の 2 ファイルのみを読み、対象プロジェクトの `package.json`・config・環境変数に依存しない
- [PRE-02] (Gate 2) run 結果 JSON は `run --json` / `--output` の生成物であることを FR-03 の構造チェックで検証してから照合する

### Post-conditions
- [POST-01] (Gate 2) `--strict` の exit code は「FAIL または UNVERIFIED の AC が 0 件」と同値である（0 件 ⇔ exit 0）
- [POST-02] (Gate 2) `--format markdown` の出力は宣言 AC 全件を 1 行ずつ含む GFM 表であり、行数は AC 総数 + ヘッダ 2 行 + サマリ行に一致する

### Assumptions
- [ASM-01] (Gate 横断) run 結果 JSON はローカル生成物で信頼境界内だが、手編集され得るため FR-03 の構造チェックを常に通す（信頼するのは内容の由来であって形ではない）
- [ASM-02] (Gate 横断) step の stdout/stderr の redaction は `run` 側（SPEC-0058 SEC-02）の責務であり、`report` は非含有（SEC-02）で二重防御する
- [ASM-03] (Gate 横断) AC/Test Matrix の一次 schema は `package-templates/docs/ac-test-matrix.schema.json` であり、`expect.mjs` の手書き validation はその実装。両者の乖離は既存の `expect` テスト系で検出される前提を踏襲する

## 関連ID

- PLAN-ID: [PLAN-0059](../plans/PLAN-0059-ac-verification-report.md)
- TASK-ID: TASK-0210（T1）, TASK-0211（T2）, TASK-0212（T3a: 照合・判定コア）, TASK-0213（T3b: 3 形式出力 + --strict + CLI 登録）, TASK-0214（T4）— T3 は Planning 時の Evaluator 申し送りに基づき T3a → T3b に分割（依存: T3a → T3b）
