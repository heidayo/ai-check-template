# PLAN-0058: `.ai-check.yaml` / `.ai-check.json` によるチェックステップ外部設定化の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0058 |
| SPEC-ID   | [SPEC-0058](../specs/SPEC-0058-ai-check-config.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: `src/cli/check-config.mjs` 新規 — config 検出 / YAML サブセット・JSON パース / validation / gate 解決。`src/cli/run.mjs` — config 統合 + `--json` 拡張。`src/cli/index.mjs` — run usage ヘルプ追記）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/` — unit + integration）
- [x] docs（`docs/cli.md`, README ja/en）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `src/cli/check-config.mjs`（新規） | config 検出（`--target` 直下、YAML 優先 + 併存エラー — 想定エラー4）、FR-02 スキーマの YAML サブセット / JSON パース、FR-07 validation（fail-fast、OPS-02 の是正ヒント付き CliError）、gate 名 ↔ script 名の定数マップと解決（FR-03） |
| `src/cli/run.mjs` | steps 構築部の手前に config 統合を差し込み（`executeScript()` へ steps 配列を渡す小リファクタ許容）、steps に `name` / `source`、ルートに `configPath` を追加（FR-04〜FR-06）。`redact()` を通る構造は不変（INV-04） |
| `src/cli/index.mjs` | run usage ヘルプへの config 記述追記 |
| `src/cli/managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` / `package-templates/` | **変更しない**（FR-08 / INV-01: config を managed 化しない・配布しないことが要件。回帰ガードはテスト側で常設） |
| `tests/cli/check-config.test.mjs`（新規） | AC-04（YAML/JSON 等価・併存エラー）/ AC-05（validation 全ケース）の unit テスト |
| `tests/cli/run.test.mjs` | AC-02 / AC-03 / AC-06 / AC-07 の integration テスト + `name`/`source`/`configPath` 追加に伴う既存期待値更新 |
| `tests/cli/managed-files.test.mjs`, `tests/cli/package.test.mjs` | AC-08 非包含回帰ガード、AC-09 pack 内容検査 + NFR-02 dependencies 空検査 |
| `docs/cli.md`, `README.md`, `README-en.md`（`README-ja.md` は stub） | config ガイド（スキーマ・3 ゲート完成例・フォールバック規則・SEC-01/SEC-02・境界ケース1 の非推奨明記） |

`sage/` / `CLAUDE.md` / `.claude/rules/` / `src/cli/managed-files.mjs` / `package-templates/` は変更しない。

## 実装方針

1. **opt-in の保証（NFR-01 / INV-02 / AC-02）**: config 不在時は `pathExists` 2 回のみで既存経路へ抜け（NFR-03）、実行コマンド列・exit code・既存 JSON フィールド値を完全維持する。結果 JSON は additive only（step `name`/`source`、ルート `configPath` の追加のみ — 契約）。
2. **YAML は自前サブセット + JSON escape hatch（NFR-02 / ASM-03）**: `src/cli/expect.mjs` `parseTemplateYaml()` / `splitYamlKeyValue()` の前例と同型で `check-config.mjs` 内に独立実装する（共通化は重複 3 例目で検討 — SPEC 実装メモ）。許容構文は version 行 + `steps:` + step 名キー + ネストしたスカラー + `gates` インライン配列のみ。サブセット外は `.ai-check.json` 案内付き CliError（リスク2 / OPS-02）。npm 依存追加は禁止（Forbidden Shortcuts、`tests/cli/package.test.mjs` で機械検証）。
3. **fail-fast validation（FR-07 / INV-03 / AC-05）**: パース不能・version 不正・未知キー・型不正・未知 gate 値・空 command・識別子違反/重複はステップ実行前に CliError で非 0 終了。silent フォールバック禁止（Forbidden Shortcuts、AC-05 テストで検出）。
4. **redaction 経路の不変（FR-06 / INV-04 / AC-07）**: config 統合で stdout/stderr の取り回しを変えず、`executeScript` 内の既存 `redact()` を全 step が通る構造を保つ。
5. **非管理・非配布は「一覧に入れない」+ 機械ガード（FR-08 / INV-01 / リスク4）**: SPEC-0057 AC-07 と同型の回帰テスト（AC-08）と pack 内容検査（AC-09）を他 TASK と独立に先行投入する（AP-03 / AP-06 対策）。
6. **段階的タスク投入（AP-02 対策）**: SPEC の T1〜T4 を 4 TASK に分割。T1（config モジュール）と T3（回帰ガード）は編集対象が重複せず並列可、T2（run 統合）は T1 依存、T4（docs）は T2 依存で最後。

代替案比較: 既定ステップ列への部分パッチ（merge semantics）は規則の複雑化を招くため SPEC どおり不採用（gate ごと全列挙モデルのみ）。`doctor` への schema validation 統合もスコープ外を維持（検査境界の単純化、dogfooding で需要実証後に別 SPEC）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0206 | `src/cli/check-config.mjs` 新規（検出・パース・validation・gate 解決）+ `tests/cli/check-config.test.mjs` | Implementation + Test | 3h | - | Yes（TASK-0208 と並列可） |
| TASK-0207 | `run.mjs` への config 統合 + `--json` 拡張（`name`/`source`/`configPath`）+ `index.mjs` usage 追記 + `tests/cli/run.test.mjs` 更新 | Implementation + Test | 3h | TASK-0206 | No |
| TASK-0208 | managed 非包含（AC-08）・pack 内容 / dependencies 空（AC-09 / NFR-02）の回帰ガードテスト | Test | 0.5h | - | Yes（TASK-0206 / TASK-0207 と並列可） |
| TASK-0209 | `docs/cli.md` / README（ja/en）への config ガイド追加 | Implementation | 1h | TASK-0207 | No |

AC 対応: TASK-0206 → AC-04/AC-05、TASK-0207 → AC-01/AC-02/AC-03/AC-06/AC-07、TASK-0208 → AC-08/AC-09、TASK-0209 → AC-09（docs 検証）。

## リスク

- リスク1（SPEC リスク1）: 全列挙モデルは既定 1 step の無効化にも全 step 再宣言が必要で冗長 → 軽減策: `command` 省略時の package script 名参照（FR-04）で再宣言コストを最小化し、TASK-0209 で 3 ゲート分のコピペ可能な完成例を docs に掲載。部分パッチ需要は OPS-03 の観測で判断し別 SPEC 化。
- リスク2（SPEC リスク2）: YAML サブセット制限に利用者が気付かず混乱 → 軽減策: TASK-0206 でサブセット外検出エラーに `.ai-check.json` 案内を必須で含め（OPS-02）、TASK-0209 で許容構文を docs に明記。
- リスク3（SPEC リスク3）: config によるゲート実質弱体化に reviewer が気付かない → 軽減策: TASK-0207 の `source: "config"` / `configPath` で evidence に必ず現れる（OPS-01）+ TASK-0209 で境界ケース1（全無効）の CI 非推奨を明記。
- リスク4（SPEC リスク4）: 将来 managed 一覧へ config パスが混入（AP-03） → 軽減策: TASK-0208 の AC-08 回帰テストを常設ガードとして先行投入（他 TASK と独立・並列）。
- リスク5（SPEC リスク5）: 機構撤去が必要になった場合 → 軽減策: `run.mjs` の config 統合呼び出しと `check-config.mjs` の削除のみで復旧できる構造を維持（TASK-0207 で統合点を 1 箇所に集約。JSON 追加フィールドは additive のため consumer 互換）。
- 実装リスク6: `name`/`source`/`configPath` 追加により `tests/cli/run.test.mjs` の既存期待値が壊れる → 軽減策: TASK-0207 の File Scope と完了条件に期待値更新（AC-02 の既存フィールド同一性検証含む）を明示。
- 実装リスク7: `executeScript()` リファクタが config 不在経路の挙動を変えてしまう（NFR-01 違反） → 軽減策: AC-02 テスト（既存フィールド値の同一性）を TASK-0207 の完了条件に含め、リファクタは steps 配列注入の最小限に留める。逸脱が必要なら SPEC 改訂を起票（Error Resolution Protocol）。
- 実装リスク8（NFR-03）: config 前処理オーバーヘッドの閾値超過 → 軽減策: 不在時は存在チェック 2 回のみの実装とし、TASK-0207 完了条件で前処理時間計測（CI 環境、閾値超過は WARN 非ブロッキング（WARN は run log（.sage/runs/）に記録し、3 リリース連続で発生した場合は maintainer が sage/failures.md に FAIL-XXXX として記録し次 PLAN で閾値見直しを検討する））。ローカル代替計測時は run log に環境差異を記録。
- 実装リスク9（OPS-03）: config 利用の dogfooding 観測は本 Round 1 のスコープ外 → 軽減策: v0.5.0 リリース後 1 リリースサイクル観測。判定は次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'ai-check.yaml' sage/failures.md` で機械的に件数確認し、3 件累積でサブセット拡張または部分パッチの SPEC 改訂を起票する。

## 必要な検証

- [x] unit test（`check-config.mjs` の validation 全ケース — AC-05 / FR-07、YAML/JSON 等価・併存エラー — AC-04、managed 非包含 — AC-08 / INV-01）
- [x] integration test（config 不在時の完全互換 — AC-02 / NFR-01、config 解決・SKIPPED・宣言順 — AC-03 / POST-02、gate フォールバック / 非 3 ゲート script 非参照 — AC-06 / FR-03 / FR-05、redaction — AC-07 / INV-04）
- [x] build（`npm pack --dry-run` / `make validate`、pack に `src/cli/check-config.mjs` を含み `.ai-check.yaml` / `.ai-check.json` 実ファイルを含まない — AC-09）
- [x] performance check（NFR-03: config 不在時 10ms 未満 / 存在時 50ms 未満の前処理時間。CI (ubuntu-latest, Node 20+)、20 step 規模、閾値超過は WARN 非ブロッキング（WARN は run log（.sage/runs/）に記録し、3 リリース連続で発生した場合は maintainer が sage/failures.md に FAIL-XXXX として記録し次 PLAN で閾値見直しを検討する）。TASK-0207 完了条件と対応）
- [x] security scan（Gate 3: AC-07 redaction テスト + docs に secret 直書き例を載せない — SEC-02、既存 `bash scripts/sage-validate.sh` の範囲。新規依存なし — NFR-02）
- [x] e2e test（N/A: HTTP/UI を持たない CLI のため integration test で代替と判断済み）
- [x] architecture boundary check（INV-01: AC-08 回帰テスト + `src/cli/managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` / `package-templates/` 無変更の diff 検査）

## 段階採用 / ロールバック

- 影響ゼロ: config は opt-in。`.ai-check.yaml` / `.ai-check.json` 未配置なら `run` の挙動は不変（NFR-01 / INV-02。追加されるのは additive な JSON フィールドのみ）
- ロールバック: `run.mjs` の config 統合呼び出しと `src/cli/check-config.mjs` を削除するのみで現行動作へ復旧（SPEC リスク5。config ファイルはユーザー領域のため installer 側の追加変更は不要、残置されても不在時と同様に無視される）
- 観測: v0.5.0 リリース後 1 リリースサイクル、本リポ + 外部 dogfooding 1 件で無効化・差し替え各 1 例以上を観測。YAML サブセット起因エラー 3 回累積で SPEC 改訂起票（OPS-03、実装リスク9 参照）
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts は AC-05 / AC-07 / AC-08 / AC-09 等の機械テストで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを採用する判断。無変更判断自体は tasks/done-def-SPEC-0058-round-1.md Architecture Gate の CLAUDE.md/.claude/rules/ 無変更チェックで機械検証される）、CLAUDE.md / .claude/rules/ai-check-template.md への追記は不要（SPEC 知識管理節のとおり。配布物実態は docs/cli.md 更新（TASK-0209）に反映される）
