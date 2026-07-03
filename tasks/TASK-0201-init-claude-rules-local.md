# TASK-0201: init の .claude/rules/local/ 作成と案内 README テンプレート

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0201 |
| SPEC-ID   | SPEC-0057 |
| PLAN-ID   | PLAN-0057 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes（TASK-0199 / TASK-0200 と並列可） |
| 依存TASK  | なし |
| 見積     | 2h |

## 責務

init の `--claude-hooks` 指定時に `.claude/rules/local/` ディレクトリと案内 README を create / skip で配置する機能を実装し、README テンプレートを新規作成、`package-templates/.claude/README.md` に overlay 説明を追記する（FR-03 / SEC-01 / SEC-02 / OPS-01 / INV-05 / POST-01 / POST-02、想定エラー3）。

## 入力

- SPEC-0057 FR-03、想定エラー3（`.claude/rules/local` が同名ファイル → skip + 警告 reason、破壊しない）、SEC-01 / SEC-02（README への任意コード実行・secret 直書き禁止の案内）、リスク4（README は参照型: 「本ファイルは初回 init 時のスナップショット。最新は docs/cli.md 参照」）
- 実装メモ: `src/cli/init.mjs` の `--claude-hooks` 分岐（L80 付近 `mergeClaudeSettings()`、L320 付近）。README テンプレートは `fromTemplates(".claude", "rules", "local", "README.md")` で参照
- 実装ルール: operations は既存語彙（create / skip + reason）のみ。新語彙を追加しない

## 出力

- `package-templates/.claude/rules/local/README.md`（新規テンプレート: overlay の使い方 / `ai-check.local.sh` の配置例（env var 上書き・追加チェック、README 内コードブロックで）/ SEC-01 / SEC-02 / +x 不要 / 参照型記載）
- `src/cli/init.mjs` の create / skip / 想定エラー3 処理（operations 出力 — OPS-01 / POST-02）
- `package-templates/.claude/README.md` の提供物ツリー + overlay 説明追記
- AC-05 / 想定エラー3 対応テスト

## File Scope（変更許可範囲）

- 作成: `package-templates/.claude/rules/local/README.md`
- 変更: `src/cli/init.mjs`, `src/cli/index.mjs`（usage ヘルプ追記が必要な場合のみ）, `package-templates/.claude/README.md`, `tests/cli/init.test.mjs`
- 削除: なし

## 禁止事項

- README テンプレートおよび README 追記への secret 直書き例の掲載禁止（例示は env var 参照形式のみ — SEC-02 / Gate 3）
- `README.md` を managed 一覧（`src/cli/managed-files.mjs`）へ追加することの禁止（FR-02 / INV-01 — TASK-0200 のガード対象）
- 既存 `.claude/rules/local/README.md` の上書き禁止（INV-05 — skip で内容不変）
- operations への新語彙追加の禁止（既存 create / skip + reason で表現）
- scripts / update / doctor / docs への変更禁止（TASK-0199/0202/0203 の責務 — AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] AC-05: `--claude-hooks` 付き init で `.claude/rules/local/README.md` が作成され（operations: create）、再 init で skip される（operations: skip、README の SHA-256 一致で内容不変を検証 — INV-05 / POST-01 / POST-02）テストがパスする
- [ ] 想定エラー3: `.claude/rules/local` が同名ファイルとして存在する場合、上書き・削除せず skip + 警告 reason を operations に報告するテストがパスする
- [ ] `--claude-hooks` なし init では `.claude/rules/local/` を作成しないテストがパスする（FR-03 は `--claude-hooks` 指定時のみ）
- [ ] `--json` 出力に README の create / skip が 1 件含まれるテストがパスする（OPS-01 / POST-02）
- [ ] `node --test tests/cli/init.test.mjs` が全件パスする
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0201 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0057-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
