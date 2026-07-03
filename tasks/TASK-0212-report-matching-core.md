# TASK-0212: report 照合・判定コア + run JSON 構造チェック（T3a）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0212 |
| SPEC-ID   | SPEC-0059 |
| PLAN-ID   | PLAN-0059 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0211 に強依存。TASK-0210 へは弱依存 — スキーマ確定後の着手が安全だが編集ファイルは非重複） |
| 依存TASK  | TASK-0211（expect の validation export を import）。弱依存: TASK-0210（構造チェッカの必須キー・型を `run-result.schema.json` と一致させる） |
| 見積     | 3h |

## 責務

`src/cli/report.mjs` を新規作成し、CLI 統合を含まない pure な export 関数群として (1) run 結果 JSON の手書き構造チェック（FR-03、ルート + 各 step の必須フィールド・型・`status` 列挙値、step `name` 重複検査 — 想定エラー3）、(2) 明示キーのみの照合（FR-04: `step` 完全一致 / `command` trim 後完全一致がちょうど 1 件）、(3) AC ごとの 3 値判定 + サマリ（FR-05）を実装する。unit テストを併設する（SPEC T3a — Evaluator 申し送りによる T3 分割の前半）。

## 入力

- SPEC-0059 FR-03〜FR-05、AC-03 / AC-06（コア部）、想定エラー2〜4、境界ケース1、INV-01〜INV-04、契約 (1) の `criteria[]`（`id`/`criterion`/`step`/`command`/`verdict`/`reason`）と `summary`（`total`/`passed`/`failed`/`unverified`）
- 判定理由の列挙: `matched-step` / `matched-command` / `no-match` / `ambiguous-command`
- TASK-0211 の expect validation export、TASK-0210 の `run-result.schema.json`（構造チェッカの一次情報源。乖離は AC-07 テストが検出）
- エラーは既存 CliError 規約（`src/cli/utils.mjs`）、OPS-02 の是正ヒント（run JSON 不正時「`ai-check-template run --output` で再生成する」案内）を含める

## 出力

- `src/cli/report.mjs`: 構造チェック・照合・判定の export 関数群（CLI arg 解析・text/markdown 出力・`--strict`・`index.mjs` 登録は含めない — TASK-0213 の責務）
- `tests/cli/report.test.mjs`（新規、コア部）: AC-03（command 一致 1 件 → `matched-command` / 2 件以上 → `ambiguous-command` UNVERIFIED）、AC-06 コア部（run JSON 必須フィールド欠落・型不正・step `name` 重複での fail-fast CliError）、判定 3 値と `summary` 合計一致（INV-03）、`step` typo → `no-match` UNVERIFIED（想定エラー4）の unit テスト

## File Scope（変更許可範囲）

- 作成: `src/cli/report.mjs`, `tests/cli/report.test.mjs`
- 変更: なし
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- 照合への曖昧一致（部分一致・大文字小文字無視・空白正規化超え・類似度・推測対応付け）の実装禁止 — trim 後完全一致と明示 `step` キーのみ（検出: AC-03 テスト）
- run JSON の構造不一致・照合キー重複時に silent に部分照合して続行することの禁止 — 必ず CliError で非 0 終了（INV-04、検出: AC-06 テスト）
- `report` 内からのコマンド実行・ファイル書き込みの禁止（SEC-01、検出: `report.mjs` に `child_process` / `writeFile` import が無い grep 検査を `tests/cli/report.test.mjs` に含める）
- JSON Schema validation のための npm 依存（ajv / zod 等）追加禁止（NFR-02）— 構造チェックは手書きチェッカで実装
- runtime で `run-result.schema.json` を読み込んで解釈することの禁止（SPEC 実装メモ — スキーマは配布ドキュメント + テスト照合用）
- `expect.mjs` / `run.mjs` / `index.mjs` への変更禁止（TASK-0211 / TASK-0213 の責務 — AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止（CLI 未登録は TODO ではなく TASK-0213 への File Scope 分割）

## 完了条件

- [ ] 実装中に想定外エラー（照合規則の未定義ケース発見等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol、想定エラー2〜4 参照）
- [ ] AC-03: `step` 省略 AC で同一 `command` の step が 1 件なら `matched-command` 対応付き、2 件以上なら `ambiguous-command` で UNVERIFIED になる unit テストがパスする（FR-04 / INV-02）
- [ ] AC-06（コア部）: run JSON の必須フィールド欠落（例: steps[].name 無し）・型不正・step `name` 重複それぞれで、照合結果を返さず対象内容入り CliError となる unit テストがパスする（FR-03 / INV-04 / OPS-02）
- [ ] 判定 3 値（PASS/FAIL/UNVERIFIED）・判定理由 4 種・`summary` の `passed + failed + unverified == total`（INV-03）を検証する unit テストがパスする（FR-05）
- [ ] `node --test tests/cli/report.test.mjs` が全件パスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、既存テスト非破壊）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0212 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0059-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
