# Done Definition: SPEC-0059 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0058 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0059
- PLAN-ID: PLAN-0059
- TASK-ID: TASK-0210, TASK-0211, TASK-0212, TASK-0213, TASK-0214
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0059 AC-01〜AC-10）

### Structural Gate

- [ ] `git diff --check` が pass する
- [ ] 各 TASK の File Scope 外の変更がない
- [ ] commit message に TASK-ID を含める
- [ ] AC-09: `npm pack --dry-run` の内容に `package-templates/docs/run-result.schema.json` と更新済み `ac-test-matrix.schema.json` が含まれ、`package.json` に runtime dependencies が存在しない（NFR-02、`tests/cli/package.test.mjs` で機械検証）
- [ ] AC-10: `grep -q 'report' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットし、`grep -q 'report --format markdown' package-templates/.github/PULL_REQUEST_TEMPLATE.md` がヒットする
- [ ] `make validate` が壊れない

### Functional Gate

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 expect/run テストの無修正期待値部分を含む — NFR-01）
- [ ] AC-02: `step` 明示 AC + PASS/FAIL/SKIPPED 混在 run 結果で `report --format json` が各 AC の判定・対応 step 名・判定理由（`matched-step`/`matched-command`/`no-match`/`ambiguous-command`）・サマリ件数を期待どおり出力する（FR-04 / FR-05 / OPS-01）
- [ ] AC-03: `step` 省略 AC で同一 `command` の step 1 件なら `matched-command`、2 件以上なら `ambiguous-command` で UNVERIFIED（曖昧照合しないことの検証 — INV-02）
- [ ] AC-05: FAIL/UNVERIFIED ≥1 で `--strict` は exit 1、全 PASS で exit 0、`--strict` 無しは同一入力で exit 0（FR-07 / POST-01。全 AC UNVERIFIED の境界ケース1 を含む）
- [ ] AC-06: (a) expect validation fail、(b) run JSON パース不能、(c) 必須フィールド欠落、(d) step `name` 重複 — 各サブケースで照合結果を出力せずファイル名・原因入り CliError で非 0 終了（FR-01〜FR-03 / INV-04 / OPS-02）
- [ ] AC-06 サブケース網羅の確認: (a)〜(d) 各 1 件以上のテストケースが unit（TASK-0212）と integration（TASK-0213 の CLI 経由）の両水準に存在することを `node --test` のテスト名一覧と grep で確認する
- [ ] AC-08: `step` 有り/無し両ファイルが `expect` で pass、`step` 空文字列は issue（FR-08 後方互換）
- [ ] INV-03: `summary` の `passed + failed + unverified == total` がテストで検証されている
- [ ] NFR-03: AC 50 × step 50 で 200ms 未満（閾値超過は WARN 非ブロッキング、run log（`.sage/runs/`）に記録）
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）

### Security Gate

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli tests/cli docs/cli.md` が新規 unfinished marker を検出しない
- [ ] NFR-02: 新規 npm 依存（ajv / zod 等）を追加していない（`tests/cli/package.test.mjs` で機械検証）
- [ ] AC-04（SEC-02 部分）: `report` の text / markdown / json いずれの出力にも step の stdout/stderr が含まれない（INV-05、テストで検証）
- [ ] SEC-01: `report.mjs` に `child_process` / `writeFile` の import が無い（`tests/cli/report.test.mjs` の grep 検査で機械検証。読み取り専用コマンド）
- [ ] docs の CI 例に secret 直書きが無い

### Architecture Gate

- [ ] AC-07: `run --json` の実出力（config 経路・default 経路）が `run-result.schema.json` の必須フィールド・型・許容値に適合し、スキーマに無いフィールドが出力に存在しない（INV-06 / FR-09、`tests/cli/run-schema.test.mjs` 常設回帰ガード）
- [ ] AC-04（表構造部分）: `--format markdown` が GFM 表 + サマリ行で、`|` 含有セルでも表構造が壊れない（FR-06 / POST-02 — 出力契約）
- [ ] `src/cli/run.mjs` / `doctor.mjs` / `init.mjs` / `update.mjs` / `managed-files.mjs` / `package-templates/ci/` を変更していない（SPEC File Scope）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] `ac-test-matrix.schema.json` の変更が `step` の additive 追加のみで、既存必須フィールド・validation 規則が不変（契約 (2)）
- [ ] docs/cli.md に照合規則（明示キーのみ）・`step` フィールド・`--strict` CI 例・`step` typo → UNVERIFIED 注記が記載されている（OPS-01 / 想定エラー4）

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
