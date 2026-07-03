# SPEC-0056: install state への managed ファイルハッシュ記録と update の 3-way 処理

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0056 |
| ステータス | Draft |
| 作成日    | 2026-07-02 |
| 更新日    | 2026-07-02 |
| 担当Agent | Spec Agent |
| 依存SPEC  | none |
| 権限レベル | platform |

## 背景・目的

実プロジェクト（TypeScript/pnpm monorepo、Next.js + Supabase + RLS 構成）での dogfooding で、利用者が `scripts/ai-check.sh` や `.claude/rules/` 配下の managed ファイルをローカル要件に合わせて書き換えざるを得ず、その改変が `ai-check-template update` で無警告に上書きされて失われる構造的問題が確認された。

現行の `update`（`src/cli/update.mjs`）は「CLI がレンダリングした期待内容とのバイト比較」で drift を検出し、差分があれば常に上書きする（update always wins）。これは「upstream 更新の反映」と「ユーザーカスタマイズ」を区別できないため、カスタマイズは drift として破壊される。

本 SPEC では、install state（`.ai-check-template.json`）に **インストール時点の managed ファイルのハッシュ** を記録し、update 時に「baseline（インストール時）/ local（現在のファイル）/ upstream（新テンプレート）」の 3 者比較でユーザー改変を検知し、無警告上書きを廃止する。

## 対象ユーザー

- `ai-check-template` CLI（v0.2.0+）で init/update を利用しているプロジェクトの開発者
- v0.1.0 手動コピー利用者（install state なし）— 動作不変であること
- 本リポ maintainer（install state schema と update ロジックの保守）

## スコープ（含む）

- `.ai-check-template.json` の schema v2 化: `managedFiles: { "<relative path>": { hash: "sha256:<hex>" } }` を追加し、init / update 完了時に管理対象ファイル（shell scripts、CI workflow、Claude hooks/rules、review templates、profile docs）のハッシュを記録する
- schemaVersion 1 → 2 の自動 migration（v1 state を読んだら v2 形式に変換。hash 情報が無い場合の扱いは FR-04）
- `update` の上書き判定を 3-way 化する:
  - local == baseline（未改変）→ upstream で更新（現行どおり）
  - local == upstream（適用済み）→ keep
  - local != baseline かつ local != upstream（ユーザー改変あり）→ **デフォルトで上書きせず skip し、keep / overwrite / diff の案内を表示**
- 非対話環境向けの解決フラグ: `--keep-local`（改変ファイルを保持、デフォルト動作の明示）/ `--force-managed`（改変ファイルも上書き）/ `--diff`（unified diff を表示して終了コードで通知）
- `doctor` の drift 報告を「upstream との差分」と「ユーザー改変（baseline との差分）」に区別して表示する
- `docs/cli.md` / README（ja/en）の update セクション更新

## スコープ外（明示的に除外）

- overlay 置き場（`scripts/ai-check.local.sh` 自動 source、`.claude/rules/local/`）の公式サポート — 別 SPEC（候補 A-2）
- `doctor --strict`（CI 用の厳格 exit code）— 別 SPEC（候補 A-3）
- 対話式（TTY prompt）での 3-way マージ UI — 案内表示とフラグのみ。interactive merge は将来検討
- package.json scripts のフィールド単位 3-way — 本 SPEC ではファイル単位のみ。scripts merge は現行ロジック維持
- profile 合成・monorepo 対応・`.ai-check.yaml` 外部設定（候補 B/C 系）
- install state の改ざん検出（署名・検証）— install state は信頼境界内のためスコープ外（SEC-01 参照）

## 要件

### 機能要件
- [FR-01] init / update 完了時、書き込んだ全 managed ファイルの SHA-256 を install state `managedFiles` に記録する（dry-run 時は記録しない）
- [FR-02] update は managed ファイルごとに baseline hash / local 内容 / upstream 内容の 3 者比較を行い、ユーザー改変ファイルをデフォルトで上書きしない（action: `skip-modified` として operations に報告）
- [FR-03] `--force-managed` 指定時のみ改変ファイルを上書きし、上書き前の内容を `<file>.bak-<packageVersion>` として保存する
- [FR-04] baseline hash が存在しない場合（v1 state からの migration 直後、v0.1 手動導入）は現行のバイト比較にフォールバックし、**差分ありなら上書きせず警告**（安全側に倒す）。update 完了時、フォールバックで差分なし（= upstream と一致）だったファイルのみ hash を記録して以後 3-way に移行する。**差分ありで skip したファイルの baseline に「改変済みローカル内容」の hash を記録してはならない**（次回 update で local==baseline と誤判定され改変が無警告上書きされるため。INV-01 違反）。差分ありのファイルは baseline 未記録のままフォールバック警告を継続し、ユーザーが `--force-managed` 等で解決した時点で 3-way に移行する
- [FR-05] schemaVersion 1 の state は読み込み時に自動で v2 へ migration し、次回書き込みで永続化する。未知の schemaVersion (>2) はエラーで停止する
- [FR-06] doctor は managed ファイルごとに `ok` / `drift-upstream`（更新未適用）/ `modified-local`（ユーザー改変）を区別して報告する。baseline hash が存在しないファイルは upstream 差分とユーザー改変を区別できないため、第 4 の状態 `drift`（区別不能な差分あり）として報告する

### 非機能要件
- [NFR-01] 後方互換: v0.2.0〜v0.4.0 で生成された install state を持つプロジェクトで update がエラーなく完走し、ユーザー改変ファイルが失われないこと
- [NFR-02] ハッシュ計算は Node 標準 `crypto` のみ使用（新規依存を追加しない）
- [NFR-03] managed ファイル 20 前後で `update` が 3 秒以内に完了すること（`time` コマンドで計測可能）。計測条件: CI (ubuntu-latest, Node 20+) 上で `time node bin/ai-check-template.mjs update --target <fixture>` を実行し real 3 秒未満。対象は現行 managed ファイル一式（20 件前後）

### セキュリティ要件
- [SEC-01] ハッシュは改ざん検出ではなく変更検出目的であり、install state 自体は信頼境界内（プロジェクトリポジトリ内）とする。state の hash を根拠に外部入力を実行しない。検証はスコープ外（理由: install state は信頼境界内のため改ざん検出を要件としない）
- [SEC-02] `.bak-*` バックアップファイルに secret を含む可能性があるため、生成時に「.gitignore への追加検討」を stdout で案内する

### 運用要件
- [OPS-01] update の出力（human / `--json`）に per-file action（keep / update / skip-modified / overwrite-forced）を含め、CI ログから判別可能にする
- [OPS-02] doctor の出力に install state の schemaVersion を含め、v1 state の残存（migration 未完了）を観測可能にする
- [OPS-03] 段階移行: v0.5.0 で本挙動をデフォルト化する前に、本リポ + 外部 dogfooding 1 件で skip-modified 誤検知ゼロを 1 リリースサイクル観測する。誤検知（本来 keep すべきファイルが skip-modified と判定された件数）は dogfooding プロジェクトでの update 実行ログ（`--json` 出力の operations）と手動レビューの突合で確認する。誤検知が `sage/failures.md` に 3 回累積した場合は FR-02 判定ロジックを見直す SPEC 改訂を起票する

## File Scope

| 区分 | ファイル |
|---|---|
| 新規 | `src/cli/managed-files.mjs`, `tests/cli/managed-files.test.mjs` |
| 変更 | `src/cli/update.mjs`, `src/cli/doctor.mjs`, `src/cli/init.mjs`, `src/cli/install-state.mjs`, `src/cli/index.mjs`（usage ヘルプへの新フラグ追記のみ） |
| テスト | `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`, `tests/cli/init.test.mjs`, `tests/cli/release-readiness.test.mjs`（3-way 挙動変更に伴う既存 lifecycle テストの期待値更新） |
| ドキュメント | `docs/cli.md`, `README.md`, `README-ja.md`, `README-en.md` |

上記以外への変更は本 SPEC のスコープ外。`package-templates/` 配下（配布テンプレート内容そのもの）は変更しない。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 init/update/doctor テスト含む）【種別: unit + integration】
- [ ] AC-02: init 直後の `.ai-check-template.json` に `schemaVersion: 2` と全 managed ファイルの `managedFiles` ハッシュが記録されている（テストで検証）【種別: integration】
- [ ] AC-03: managed ファイルをローカル改変後に `update` を実行すると、当該ファイルが上書きされず `skip-modified` として報告される（テストで検証）。update.mjs の 3-way 判定分岐（keep / update / skip-modified / overwrite-forced）を全分岐テストでカバーする。3-way 判定の 4 分岐を分岐テストで 100% カバーする（各分岐に最低 1 テストケース。分岐網羅はテストケース列挙で担保し、カバレッジツール導入は不要）【種別: unit + integration】
- [ ] AC-04: 改変後 `update --force-managed` で上書きされ、`.bak-<version>` が生成される（テストで検証）。3-way 判定の overwrite-forced 分岐を含む全分岐カバレッジは AC-03 と共通【種別: integration】
- [ ] AC-05: v1 形式の install state を配置して `update` を実行すると、エラーなく完走し state が v2 に migration される（テストで検証）【種別: integration】
- [ ] AC-06: 未改変ファイルのみのプロジェクトで update → doctor が PASS（冪等性、既存スナップショットテスト踏襲）【種別: integration】
- [ ] AC-07: `npm pack --dry-run` / 既存 preflight（`make validate`）が壊れない【種別: build】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | integration | Gate 2: Functional |
| AC-03 | unit + integration | Gate 2: Functional |
| AC-04 | integration | Gate 2: Functional |
| AC-05 | integration | Gate 2: Functional |
| AC-06 | integration | Gate 2: Functional |
| AC-07 | build | Gate 1: Structural |

## 異常系

- 想定エラー1: install state の `managedFiles` に記録があるがファイルが削除されている → `missing` として報告し、update はファイルを再生成（現行 create 動作）、doctor は警告。実装中にこのケースで想定外エラーが発生した場合は Error Resolution Protocol に従い、run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` に追記する
- 想定エラー2: schemaVersion が 2 より大きい（新しい CLI で生成した state を古い CLI で読む）→ 明確なエラーメッセージで停止（silent 破壊をしない）。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → anti-patterns 確認 → failures.md 追記の手順で処理する
- 想定エラー3: install state の JSON が破損 → 現行どおり validation エラーで停止し、init のやり直しを案内。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → anti-patterns 確認 → failures.md 追記の手順で処理する
- 境界ケース1: local == upstream だが baseline と異なる（ユーザーが手動で先行適用）→ keep とし、hash を upstream 値に更新

## 契約

- API: なし（CLI フラグ追加のみ: `--keep-local` / `--force-managed` / `--diff`）
- DB: なし
- イベント: なし（install state schema v2 が実質の契約。`src/cli/install-state.mjs` の validation が仕様）

## リスク

- リスク1: v1→v2 migration 直後は baseline が無く全改変ファイルが「差分あり警告」になる → 軽減策: FR-04 のフォールバックで上書きせず警告に留め、メッセージで `--force-managed` / keep の選択肢を明示
- リスク2: update のデフォルト挙動変更（always-overwrite → skip-modified）で「更新されない」と誤解される → 軽減策: skip 時に理由と解決フラグを必ず表示、docs/cli.md と CHANGELOG に breaking-behavior として明記
- リスク3: managed ファイル一覧の定義が init/update/doctor で分散し不整合 → 軽減策: managed ファイル列挙を単一モジュール（例: `src/cli/managed-files.mjs`）に集約

## 知識管理

- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素: エラーログ / 失敗ファイル / 関連仕様 / 最近の変更 / Fix scope / 完了条件 に従う）
- 同一エラーパターンが 3 回累積した場合、`sage/anti-patterns.md` への昇格を検討する
- 現行 update の無警告上書き（update always wins）は、機械的ガードがなく利用者の注意に依存する点で AP-06（Human-Only Guard）相当の構造的欠陥である。本 SPEC はこれを 3-way 判定という機械的ガードに置き換えるものとして位置付ける
- リスク3（managed 一覧の分散）は AP-03（Silent Scope Expansion）と関連し、INV-03（単一モジュール集約）がその対策である

## 実装メモ（Implementation Agent向け）

- 期待内容のレンダリング系: `src/cli/update.mjs` `updateTemplateFile()` (L327)、`src/cli/doctor.mjs` `checkExpectedFileContent()` (L318) / `checkTemplateFile()` (L333)
- state I/O: `src/cli/install-state.mjs`（`INSTALL_STATE_SCHEMA_VERSION` L13、validation L156-220、`normalizeProfile()` L222-243）
- operations 報告形式は既存の action 語彙（keep/update/would-update/...）に `skip-modified` / `overwrite-forced` を追加する形で拡張
- テストは `tests/cli/update.test.mjs` の drift 修復テスト（L133-144）と冪等性パターン（`init.test.mjs` L220-251）を踏襲
- 本 SPEC は CLAUDE.md 本体および `.claude/rules/` への変更を含まない（本 SPEC 固有の Forbidden Shortcuts は src-rules.md の一般原則と本 SPEC 内の記載でカバーされるため）。update 挙動の破壊的変更は docs/cli.md と CHANGELOG にのみ記載する（リスク2参照）

### 実装ルール

- managed ファイルの列挙は必ず `src/cli/managed-files.mjs`（新規）に集約し、`update.mjs` / `doctor.mjs` / `init.mjs` はそこから import する（INV-03 / AP-03 Silent Scope Expansion 対応）。他モジュールへの managed 一覧のハードコードは禁止
- hash 計算は Node 標準 `crypto.createHash("sha256")` のみ使用し、外部依存を追加しない（NFR-02）
- `.bak-<version>` の命名は `<basename>.bak-<packageVersion>` 形式で固定する
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・型アサーション禁止等）を遵守する

### 既存実装との衝突点

- `src/cli/install-state.mjs` の `validateInstallState`（L161 付近）は `state.schemaVersion !== INSTALL_STATE_SCHEMA_VERSION` の厳密一致で v1 state を invalid として弾く。FR-05 実装時はこの分岐を「schemaVersion 1 または 2 を許容し、1 なら v2 へ migrate する」に変更する必要がある

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: `managed-files.mjs` への managed ファイル列挙の集約（依存なし）
  - 完了条件: `node --test tests/cli/managed-files.test.mjs` が全件パスし、update/doctor/init が managed-files.mjs を import している（grep で確認可能）
- T2: install state schema v2 化 + v1→v2 migration（依存なし、T1 と並列可）
  - 完了条件: v1 state fixture を読み込むテストが v2 への migration 成功を確認
- T3: init / update での hash 記録（依存: T1, T2）
  - 完了条件: init 直後の install state に全 managed ファイルの hash が記録されるテストがパス（AC-02）
- T4: update の 3-way 判定 + 解決フラグ + `.bak` 生成（依存: T3）
  - 完了条件: update の 4 分岐（keep/update/skip-modified/overwrite-forced）テストが全パス（AC-03/AC-04）
  - 注記: 判定ロジック・フラグ処理・`.bak` 生成は同一判定フロー内で逐次実行され密結合のため意図的に単一タスクとする
- T5: doctor の drift-upstream / modified-local 区別表示（依存: T3、T4 と並列可）
  - 完了条件: doctor の ok/drift-upstream/modified-local 区別テストがパス（FR-06）
- T6: docs/cli.md / README（ja/en）更新（依存: T4, T5）
  - 完了条件: docs/README に 3-way 挙動と各フラグの記載があることを目視 + `npm pack --dry-run` パス（AC-07）

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- baseline hash なしでの無条件上書きの禁止（FR-04 のフォールバック「差分ありなら上書きせず警告」を迂回しない）（検出: AC-03/FR-04 のテストケース）
- `--force-managed` 時、`.bak` の書き込み完了前にファイルを上書きすることの禁止（INV-05）（検出: INV-05 対応テスト — `.bak` 書込失敗時に元ファイルが無傷であることのテスト）
- schemaVersion > 2 の state を silent に読み進めることの禁止（FR-05: 明確なエラーで停止する）（検出: 異常系2 のテストケース）
- managed ファイル一覧を `managed-files.mjs` 以外のモジュールにハードコードすることの禁止（検出: T1 完了条件の grep 検査）
- `.bak-*` ファイルをコミットすることの禁止（検出: SEC-02 の .gitignore 案内 + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) update は `--force-managed` なしにユーザー改変ファイル（local != baseline かつ local != upstream）の内容を変更しない
- [INV-02] (Gate 2) init / update（非 dry-run）完了後、install state の `managedFiles` の各 hash は対応ファイルの実内容の SHA-256 と一致する
- [INV-03] (Gate 4) managed ファイルの列挙は単一モジュールに集約され、init / update / doctor はそれを共有する
- [INV-04] (Gate 2) dry-run はファイルシステムと install state を一切変更しない
- [INV-05] (Gate 3) `--force-managed` による上書き時、必ず `.bak-<version>` が先に書き込まれてから上書きが行われる

### Pre-conditions
- [PRE-01] (Gate 2) update 実行時、install state が存在し schemaVersion ∈ {1, 2} であること（それ以外はエラー停止）

### Post-conditions
- [POST-01] (Gate 2) update 完了後の install state は常に schemaVersion 2 である
- [POST-02] (Gate 2) update の operations 出力は全 managed ファイルについて 1 件ずつ action を含む

### Assumptions
- [ASM-01] (Gate 横断) Node.js >= 20（`crypto.createHash("sha256")` 利用可能）
- [ASM-02] (Gate 横断) install state はプロジェクトリポジトリ内で git 管理される前提（baseline の共有はコミット経由）

## 関連ID

- PLAN-ID: （計画フェーズで記入）
- TASK-ID: （分割フェーズで記入）
