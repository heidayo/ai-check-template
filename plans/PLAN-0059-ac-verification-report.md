# PLAN-0059: 形名参同レポート（`report` コマンド + run スキーマ固定）の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0059 |
| SPEC-ID   | [SPEC-0059](../specs/SPEC-0059-ac-verification-report.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: `src/cli/report.mjs` 新規 — 照合・判定・3 形式出力・run JSON 構造チェック。`src/cli/expect.mjs` — `step` 許容 + validation 関数の export 化のみ。`src/cli/index.mjs` — `report` コマンド登録・usage 追記）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/` — unit + integration + 契約回帰ガード）
- [x] docs（`docs/cli.md`, README ja/en, `package-templates/.github/PULL_REQUEST_TEMPLATE.md` 案内 1 行）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `src/cli/report.mjs`（新規） | 照合コア（明示 `step` キー完全一致 / `command` trim 後完全一致がちょうど 1 件 — FR-04）、3 値判定 + サマリ（FR-05）、run JSON 手書き構造チェック（FR-03、ajv 不使用）、text / markdown / json 出力 + `--strict`（FR-01 / FR-06 / FR-07）。読み取り専用（SEC-01）、stdout/stderr 非含有（SEC-02） |
| `src/cli/expect.mjs` | `validateExpectationFile()` 相当の export 化 + `validateExpectation()` への「`step` があれば非空文字列」チェック追加のみ（FR-02 / FR-08）。既存挙動不変（NFR-01） |
| `src/cli/index.mjs` | `report` コマンド登録 + USAGE のコマンド一覧・オプション表への追記 |
| `package-templates/docs/run-result.schema.json`（新規） | `run --json` 現行出力（SPEC-0049 + SPEC-0058）を固定する初版スキーマ（draft 2020-12、`additionalProperties` 不許容の厳格形 — FR-09） |
| `package-templates/docs/ac-test-matrix.schema.json` / example 2 ファイル | `acceptanceCriteria[].step`（任意、`minLength: 1`）の additive 追加 + example への `step` 記載例（FR-08） |
| `package-templates/.github/PULL_REQUEST_TEMPLATE.md` | Verification 節へ `report --format markdown` 案内コメント 1 行（additive、managed-files.mjs 変更不要 — SPEC リスク3） |
| `tests/cli/report.test.mjs`（新規） | AC-02〜AC-06 の unit + integration、`child_process` / `writeFile` import 非存在の grep 検査（SEC-01 機械ガード） |
| `tests/cli/run-schema.test.mjs`（新規） | AC-07: `run --json` 実出力（config 有り/無し両経路）× `run-result.schema.json` の再帰比較回帰ガード（INV-06） |
| `tests/cli/expect.test.mjs` | AC-08: `step` 有り/無し/空文字列の追加ケース（既存ケース不変） |
| `tests/cli/package.test.mjs` | AC-09: pack に `run-result.schema.json` 同梱 + runtime dependencies ゼロ検査（NFR-02） |
| `docs/cli.md`, `README.md`, `README-en.md`（`README-ja.md` は stub） | `report` ガイド（照合規則・`step` フィールド・`--strict` CI 例・typo→UNVERIFIED 注記 — 想定エラー4） |

`src/cli/run.mjs` / `doctor.mjs` / `init.mjs` / `update.mjs` / `managed-files.mjs` / CI workflow テンプレート / `sage/` / `CLAUDE.md` / `.claude/rules/` は変更しない（SPEC File Scope）。

## 実装方針

1. **契約先行（FR-09 / INV-06 / AC-07）**: `run-result.schema.json` + 回帰ガードテストを他 TASK と独立に先行投入する（TASK-0210）。`report` の入力契約を先に固定することで、後続 TASK が読む run JSON の形が実装中に揺れない（AP-03 対策、SPEC リスク2 の軽減）。
2. **expect の additive 拡張（FR-02 / FR-08 / NFR-01）**: `expect.mjs` は「validation 関数の export 化」と「`step` 非空文字列チェック 1 箇所追加」のみ（TASK-0211）。既存テストの無修正期待値部分の pass 継続（AC-01）を完了条件に含め、挙動不変を機械検証する。
3. **照合コアと出力の分離（Evaluator 申し送り: T3 分割）**: SPEC T3 を T3a（照合・判定コア + run JSON 構造チェック — TASK-0212）と T3b（text/markdown/json 出力 + `--strict` + `index.mjs` 登録 — TASK-0213、依存: T3a）に分割する。T3a は pure な export 関数群として unit テスト可能にし（INV-01〜INV-04 の決定性・fail-fast をコアで担保）、T3b は CLI 統合（exit code・出力形式・SEC-02 非含有）を integration テストで担保する。
4. **明示キー照合のみ（FR-04 / Forbidden Shortcuts）**: 部分一致・正規化・類似度を実装しない。曖昧（同一 command 複数 step）は `ambiguous-command` の UNVERIFIED、silent 部分照合は禁止で構造不一致・step 名重複は fail-fast の CliError（INV-04）。AC-03 / AC-06 のテストを常設機械ガードとする（AP-06 対策）。
5. **依存ゼロ維持（NFR-02）**: run JSON 構造チェックは `report.mjs` 内の手書きチェッカ（必須キー・typeof・列挙値）、スキーマ照合テストは小さな再帰比較の自前実装。ajv / zod は追加しない（AC-09 の dependencies 検査で機械検証）。
6. **docs は機能実在後（TASK-0214）**: docs / PR template / pack 検査は `report` コマンド実在（TASK-0213）後に投入する（存在しない機能を先に説明しない — SPEC T4 依存順序）。

代替案比較: `expect --verify-against` 拡張案は SPEC が理由付きで不採用（1 コマンド = 1 責務、additive 保証）。runtime で schema ファイルを読み込む validation 案も不採用（NFR-02 の依存ゼロ + FR-03 手書きチェッカで足り、チェッカとスキーマの一致は AC-07 が両方向から固定する — SPEC 実装メモ）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0210 | `run-result.schema.json` 新規 + `tests/cli/run-schema.test.mjs` 回帰ガード（SPEC T1） | Implementation + Test | 2h | - | Yes（TASK-0211 と並列可） |
| TASK-0211 | `ac-test-matrix.schema.json` `step` 追加 + example 2 ファイル + `expect.mjs` の `step` 許容・export 化 + `tests/cli/expect.test.mjs` 追加ケース（SPEC T2） | Implementation + Test | 2h | - | Yes（TASK-0210 と並列可） |
| TASK-0212 | `report.mjs` 照合・判定コア + run JSON 構造チェック（export 関数群）+ unit テスト（SPEC T3a） | Implementation + Test | 3h | TASK-0211 | No（TASK-0210 とは編集ファイル非重複だが、弱依存あり — 下記注記） |
| TASK-0213 | `report.mjs` の text/markdown/json 出力 + `--strict` + `index.mjs` 登録 + integration テスト（SPEC T3b） | Implementation + Test | 3h | TASK-0212 | No |
| TASK-0214 | `package.test.mjs` pack / dependencies 検査 + PR template 案内行 + docs（cli.md / README ja/en）（SPEC T4） | Implementation | 1.5h | TASK-0213 | No |

- AC 対応: TASK-0210 → AC-07、TASK-0211 → AC-08、TASK-0212 → AC-03 / AC-06（コア部）、TASK-0213 → AC-02 / AC-04 / AC-05 / AC-06（CLI 部: (a)〜(d) 全サブケースを integration で再検証。TASK-0212 は同サブケースを unit で担保）、TASK-0214 → AC-09 / AC-10。AC-01（全テストパス）は全 TASK 共通の完了条件。
- 弱依存注記: TASK-0212 は TASK-0210 の `run-result.schema.json` に**弱依存**する（構造チェッカの必須キー・型はスキーマと一致させる必要があり、スキーマ確定後に書くのが安全。ただし編集対象ファイルは重複せず、AC-07 テストが乖離を検出するため並行着手自体は可能）。TASK-0211 への依存は強依存（expect の export を import するため）。
- TASK-0212 の分割境界: T3a は CLI arg 解析・出力・exit code を含まない pure 関数（照合・判定・構造チェック）のみとし、`index.mjs` は触らない。`report` コマンドがユーザーから実行可能になるのは TASK-0213 完了時点。

依存グラフ: TASK-0210 ─(弱)→ TASK-0212、TASK-0211 ─(強)→ TASK-0212 → TASK-0213 → TASK-0214。TASK-0210 と TASK-0211 は独立して並列着手可。

AC-01（全テストパス）は各 TASK の完了条件に個別記載され、Round 全体の最終確認は tasks/done-def-SPEC-0059-round-1.md の Functional Gate で行う。

知識管理: 各 TASK 実装中の想定外エラーは担当 Agent が `sage/failures.md` に FAIL-XXXX 形式で記録する（新規/既存の判定は `sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。

## リスク

- リスク1（SPEC リスク1）: `command` 完全一致フォールバックの誤対応 → 軽減策: 2 件以上一致は `ambiguous-command` で対応付けない（TASK-0212 / AC-03）。docs（TASK-0214）で `step` 明示を推奨形として先に示す。
- リスク2（SPEC リスク2）: 将来の `run` 出力変更でスキーマ更新漏れ → 軽減策: TASK-0210 の厳格スキーマ回帰ガード（AC-07 / INV-06）を先行常設。additive 追加でもテスト更新が必要な設計で契約変更を必ず可視化（AP-03 対策）。
- リスク3（SPEC リスク3）: PR template 追記の update conflict → 軽減策: Verification 節への 1 行コメントのみの additive 変更（TASK-0214）。SPEC-0056 の 3-way update で未改変ユーザーは自動追従、改変済みは skip-modified 保護（既存機構、本 PLAN での特別対応なし）。
- リスク4（SPEC リスク4）: `--strict` の UNVERIFIED 多発による形骸化 → 軽減策: TASK-0213 の JSON 出力に判定理由（`no-match` / `ambiguous-command`）を必ず含め（OPS-01）、是正（`step` 追記）を機械提案可能にする。OPS-03 の観測は下記「段階採用」参照。
- リスク5（SPEC リスク5）: 機構撤去 → 軽減策: `report.mjs` と `index.mjs` 登録行の削除のみで復旧できる構造を維持（TASK-0213 で統合点を登録 1 箇所に集約）。`expect.mjs` の変更は export 化 + `step` 許容のみで残置無害、schema の `step` は任意フィールドのため残置無害。
- 実装リスク6: T3a/T3b 分割により中間状態（TASK-0212 完了時点）で `report.mjs` が CLI 未登録の export のみになる → 軽減策: 意図した設計（unit テストで検証される dead-code ではない実装途中状態）。TASK-0212 完了条件は unit テストのパスで定義し、TASK-0213 で必ず登録する（依存を強制、TODO 残留禁止は「登録は次 TASK の責務」の File Scope 分割で満たす）。
- 実装リスク7: `expect.mjs` の export 化リファクタが既存挙動を変える（NFR-01 違反） → 軽減策: TASK-0211 の完了条件に既存 `tests/cli/expect.test.mjs` の無修正期待値部分の pass 継続（AC-01）を含める。
- 実装リスク8（NFR-03）: AC 50 × step 50 で 200ms 超過 → 軽減策: 照合は O(AC × step) 単純走査で十分。TASK-0213 完了条件に `performance.now()` 計測テスト（CI ubuntu-latest, Node 20+、ファイル読み込み・プロセス起動除く）を含め、閾値超過は WARN 非ブロッキング（WARN は run log（`.sage/runs/`）に記録し、3 リリース連続発生で maintainer が `sage/failures.md` に FAIL-XXXX 記録し次 PLAN で閾値見直し）。
- 実装リスク9（OPS-03）: 形名参同ループの実効性観測は本 Round 1 スコープ外 → 軽減策: v0.5.0 リリース後、本リポ + 外部 dogfooding 1 件で `report --strict` を PR ゲートに 1 リリースサイクル試験適用。判定は次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'ambiguous-command' sage/failures.md` で機械的に件数確認し、3 件累積で `step` 必須化または照合規則の SPEC 改訂を起票。

## 必要な検証

- [x] unit test（照合コアの決定性・3 値判定・判定理由 — AC-03 / FR-04 / FR-05 / INV-01〜INV-03、run JSON 構造チェックの fail-fast — AC-06 / FR-03 / INV-04、`step` 許容の後方互換 — AC-08 / FR-08）
- [x] integration test（`report` CLI の 3 形式出力・`--strict` exit code — AC-02 / AC-04 / AC-05 / FR-01 / FR-06 / FR-07 / POST-01 / POST-02、入力不正の CliError — AC-06 / OPS-02、run --json 実出力 × スキーマ — AC-07 / INV-06）
- [x] build（`npm pack --dry-run` / `make validate`、pack に `run-result.schema.json` + 更新済み `ac-test-matrix.schema.json` を含む — AC-09）
- [x] performance check（NFR-03: AC 50 × step 50 で 200ms 未満。CI (ubuntu-latest, Node 20+)、`node --test` 内 `performance.now()` 計測、閾値超過は WARN 非ブロッキング — 実装リスク8 参照）
- [x] security scan（Gate 3: AC-04 の stdout/stderr 非含有テスト — SEC-02 / INV-05、`report.mjs` に `child_process` / `writeFile` import が無い grep 検査 — SEC-01、新規依存なし — NFR-02、既存 `bash scripts/sage-validate.sh` の範囲）
- [x] e2e test（N/A: HTTP/UI を持たない CLI のため integration test で代替と判断済み）
- [x] architecture boundary check（INV-06: AC-07 回帰ガード + `src/cli/run.mjs` / `doctor.mjs` / `init.mjs` / `update.mjs` / `managed-files.mjs` / CI workflow テンプレート無変更の diff 検査）

## 段階採用 / ロールバック

- 影響ゼロ: `report` は新設サブコマンドで opt-in。`expect` / `run` の既存挙動・既存出力フィールドは不変（NFR-01、`ac-test-matrix.schema.json` の `step` は任意フィールドの additive 追加のみ）
- ロールバック: `src/cli/report.mjs` と `index.mjs` の登録行を削除するのみで現行動作へ復旧（SPEC リスク5）。`expect.mjs` の export 化・`step` 許容、schema の `step`、`run-result.schema.json` は残置しても既存ファイルの妥当性・挙動に影響しない
- 観測: v0.5.0 リリース後 1 リリースサイクル、本リポ + 外部 dogfooding 1 件で `report --strict` を PR ゲートに試験適用（OPS-03）。`ambiguous-command` 起因 UNVERIFIED の `sage/failures.md` 3 回累積で `step` 必須化 / 照合規則の SPEC 改訂を起票（実装リスク9 参照）
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（曖昧照合禁止・additive only・silent 部分照合禁止・stdout 非含有・依存追加禁止）は AC-03 / AC-04 / AC-06 / AC-07 / AC-09 の機械テストで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを採用する判断。無変更判断自体は `tasks/done-def-SPEC-0059-round-1.md` Architecture Gate の CLAUDE.md/.claude/rules/ 無変更チェックで機械検証される）、CLAUDE.md / `.claude/rules/ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり。配布物実態は docs/cli.md 更新（TASK-0214）に反映される）
