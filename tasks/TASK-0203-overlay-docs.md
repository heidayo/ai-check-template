# TASK-0203: docs/cli.md / README（ja/en）への overlay ガイド追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0203 |
| SPEC-ID   | SPEC-0057 |
| PLAN-ID   | PLAN-0057 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0199, TASK-0201, TASK-0202 |
| 見積     | 1h |

## 責務

`docs/cli.md` と README（ja/en）に overlay ガイドを追加し、`npm pack --dry-run` で配布内容を検証する（FR-06 / SEC-01 / SEC-02 / AC-08、SPEC リスク1 の移行手順）。

## 入力

- SPEC-0057 FR-06（a: 直接編集の代わりに overlay を推奨 / b: `ai-check.local.sh` の配置例（env var 上書き・追加チェック）/ c: `.claude/rules/local/` の用途 / d: SPEC-0056 skip-modified との関係 = overlay は一次手段・skip-modified は安全網）
- リスク1 の移行手順: 「改変内容を `ai-check.local.sh` へ移して `--force-managed` で scripts を新テンプレートに戻す」
- TASK-0199 / TASK-0201 の確定した実装内容（source 行の位置・README テンプレート）
- 言語規約: `README.md`（日本語）/ `README-en.md`（英語）、`README-ja.md` は `README.md` への stub のため対象外

## 出力

- `docs/cli.md` / `README.md` / `README-en.md` の overlay ガイド（FR-06 の a〜d + 移行手順）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `docs/cli.md`, `README.md`, `README-ja.md`（stub の参照更新が必要な場合のみ）, `README-en.md`
- 削除: なし

## 禁止事項

- docs への secret 直書き例の掲載禁止（例示は env var 参照形式のみ — SEC-02 / Gate 3）
- `ai-check.local.sh` という実ファイルの追加禁止（例示は README 内コードブロックのみ — SPEC Forbidden Shortcuts）
- src / tests / package-templates への変更禁止（TASK-0199/0200/0201/0202 の責務 — AP-03）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] `grep -l 'ai-check.local.sh' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットする（FR-06 の機械検証、SPEC T5 完了条件）
- [ ] FR-06 の a〜d と移行手順（リスク1）が記載されていることを目視確認
- [ ] AC-08: `npm pack --dry-run` / `make validate` がパスし、pack 内容に `package-templates/.claude/rules/local/README.md` が含まれ `ai-check.local.sh` が含まれない
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、docs 変更でテストが壊れないことの確認）
- [ ] commit message に TASK-0203 を含める（commit-msg hook で強制）

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
