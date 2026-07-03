# TASK-0198: docs/cli.md / README（ja/en）の update セクション更新

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0198 |
| SPEC-ID   | SPEC-0056 |
| PLAN-ID   | PLAN-0056 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0196, TASK-0197 |
| 見積     | 1h |

## 責務

docs/cli.md と README（ja/en）の update セクションを 3-way 挙動・新フラグ・`.bak` 復元手順を含めて更新する（SPEC T6 / リスク2 軽減策）。

## 入力

- TASK-0196/0197 の実装済み挙動（3-way 判定、`--keep-local` / `--force-managed` / `--diff`、`.bak-<version>`、doctor 3 区別、SEC-02 の .gitignore 案内）
- 言語規約: user-facing ドキュメントは日本語（README-en.md は英語）

## 出力

- `docs/cli.md`: update の 3-way 挙動（4 action の意味）、各フラグの説明、デフォルト挙動変更の breaking-behavior 明記、**`.bak-<version>` からの復元手順**（Evaluator 申し送り）、`.bak` の .gitignore 追加推奨
- `README.md` / `README-ja.md` / `README-en.md`: update セクションの要点更新

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `docs/cli.md`, `README.md`, `README-ja.md`, `README-en.md`
- 削除: なし

## 禁止事項

- src / tests の変更禁止（ドキュメントのみ — AP-03）
- CLAUDE.md / `.claude/rules/` の変更禁止（SPEC 実装メモ: 本 SPEC はこれらへの変更を含まない）
- `package-templates/` の変更禁止
- 実装と異なる挙動の記載禁止（実装済みコードと突合して記述する — AP-07 Hallucination Propagation 対策）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] docs/cli.md に 3-way 挙動・4 action・各フラグ・`.bak-<version>` からの復元手順・breaking-behavior の記載があることを目視確認（T6 完了条件）
- [ ] README ja/en に update の新挙動の記載があることを目視確認
- [ ] `npm pack --dry-run` がエラーなく完了する（AC-07）
- [ ] `make validate` がパスする（AC-07）
- [ ] `grep -q -- '--force-managed' docs/cli.md && grep -q 'skip-modified' docs/cli.md && grep -q '\.bak-' docs/cli.md` が成功する（3-way 挙動・フラグ・復元手順の記載を機械検証）
- [ ] commit message に TASK-0198 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0056-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
