# Done Definition: SPEC-0057 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0056 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0057
- PLAN-ID: PLAN-0057
- TASK-ID: TASK-0199, TASK-0200, TASK-0201, TASK-0202, TASK-0203
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0057 AC-01〜AC-08）

### Structural Gate

- [ ] `git diff --check` が pass する
- [ ] 各 TASK の File Scope 外の変更がない
- [ ] commit message に TASK-ID を含める
- [ ] AC-08: `npm pack --dry-run` / `make validate` が壊れず、pack 内容に `package-templates/.claude/rules/local/README.md` が含まれ `ai-check.local.sh` が含まれない

### Functional Gate

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 init/update/doctor テスト含む）
- [ ] AC-02: `scripts/ai-check.sh` と同 dir の `ai-check.local.sh` が source され、削除すると従来どおり動作する（source 行の存在 + 3 scripts すべてに同一機構 — FR-01 / INV-03）
- [ ] AC-03: `ai-check.local.sh` と `.claude/rules/local/` 配下のユーザーファイルが update で変更・削除されず、operations に managed 対象として現れない（FR-04 / INV-02）
- [ ] AC-04: 同状態の doctor で local ファイル起因の drift / 警告が出ず、結果が local 無しの場合と同一（FR-05）
- [ ] AC-05: `--claude-hooks` 付き init で `.claude/rules/local/README.md` が create、再 init で skip（README の SHA-256 一致で内容不変 — INV-05 / POST-01 / POST-02）
- [ ] AC-06: 旧テンプレート（source 行なし）scripts + v2 install state の update で、未改変 scripts は source 行入りへ自動更新、改変済み scripts は skip-modified（NFR-01）
- [ ] 異常系: 構文エラー local で scripts が非 0 で即終了（INV-04）/ 実行権限なし local は正常に source / `.claude/rules/local` が同名ファイルなら init は skip + 警告（想定エラー1〜3）
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）

### Security Gate

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli tests/cli package-templates docs/cli.md` が新規 unfinished marker を検出しない
- [ ] 新規外部依存を追加していない（NFR-02: source 行は bash 標準機能のみ）
- [ ] SEC-01: source 行直前コメントと `.claude/rules/local/README.md` に「local はコミット内容がそのまま実行される」旨がある
- [ ] SEC-02: README / docs に secret 直書き例がなく、env var / secret manager 経由の案内がある

### Architecture Gate

- [ ] AC-07: `getManagedFiles()` の全 profile / オプション組合せで `ai-check.local.sh` と `.claude/rules/local/` 配下パスが非包含（INV-01、回帰テスト常設）
- [ ] `src/cli/managed-files.mjs` を変更していない（SPEC File Scope）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] docs/cli.md に overlay ガイド（FR-06 a〜d）と skip-modified からの移行手順（リスク1）が記載されている

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
