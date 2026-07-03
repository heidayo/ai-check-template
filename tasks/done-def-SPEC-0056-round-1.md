# Done Definition: SPEC-0056 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0047 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0056
- PLAN-ID: PLAN-0056
- TASK-ID: TASK-0193, TASK-0194, TASK-0195, TASK-0196, TASK-0197, TASK-0198
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0056 AC-01〜AC-07）

### Structural Gate

- [ ] `git diff --check` が pass する
- [ ] 各 TASK の File Scope 外の変更がない
- [ ] commit message に TASK-ID を含める
- [ ] `npm pack --dry-run` / `make validate` が壊れていない（AC-07）

### Functional Gate

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 init/update/doctor テスト含む）
- [ ] AC-02: init 直後の `.ai-check-template.json` に `schemaVersion: 2` と全 managed ファイルの `managedFiles` hash が記録されている（テストで検証）
- [ ] AC-03: ローカル改変後の `update` で当該ファイルが上書きされず `skip-modified` 報告。3-way 4 分岐（keep / update / skip-modified / overwrite-forced）を各分岐最低 1 テストケースで 100% カバー
- [ ] AC-04: 改変後 `update --force-managed` で上書き + `.bak-<version>` 生成（INV-05: `.bak` 先行書き込みのテスト含む）
- [ ] AC-05: v1 形式の install state で `update` がエラーなく完走し v2 に migration される
- [ ] AC-06: 未改変プロジェクトで update → doctor が PASS（冪等性）
- [ ] 異常系: schemaVersion>2 で明確なエラー停止 / JSON 破損で validation エラー停止 / `managedFiles` 記録ありでファイル欠落 → missing 報告 + doctor 警告（Evaluator 申し送り）
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）

### Security Gate

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli tests/cli docs/cli.md` が新規 unfinished marker を検出しない
- [ ] 新規外部依存を追加していない（NFR-02: Node 標準 `crypto` のみ）
- [ ] `--force-managed` 上書き時、`.bak` 書き込みが先行する（INV-05）
- [ ] `.bak-*` 生成時に .gitignore 追加検討の案内を stdout に出す（SEC-02）、`.bak-*` をコミットしない

### Architecture Gate

- [ ] managed ファイル一覧は `src/cli/managed-files.mjs` に集約され、init / update / doctor はそこから import している（INV-03、grep で検証）
- [ ] `package-templates/` / `CLAUDE.md` / `.claude/rules/` を変更していない
- [ ] docs/cli.md に `.bak-<version>` からの復元手順と breaking-behavior が記載されている

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
