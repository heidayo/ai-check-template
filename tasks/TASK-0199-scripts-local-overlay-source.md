# TASK-0199: 配布 scripts 3 本への ai-check.local.sh source 行追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0199 |
| SPEC-ID   | SPEC-0057 |
| PLAN-ID   | PLAN-0057 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | Yes（TASK-0200 / TASK-0201 と並列可） |
| 依存TASK  | なし |
| 見積     | 1.5h |

## 責務

配布 scripts 3 本（`ai-check.sh` / `ai-check-fast.sh` / `ai-check-secure.sh`）に、同ディレクトリの `ai-check.local.sh` が存在すれば source する機構を同一パターンで追加し、`package-templates/scripts/README.md` に overlay 契約を明文化する（FR-01 / SEC-01 / OPS-02 / PRE-01 / INV-03 / INV-04）。

## 入力

- SPEC-0057 FR-01、SEC-01（source 行直前コメント）、OPS-02（installer 管理コメント）、NFR-01 / NFR-03、想定エラー1・2、境界ケース1、INV-03 / INV-04 / PRE-01 / ASM-01
- 実装メモ: `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` + `if [ -f "${SCRIPT_DIR}/ai-check.local.sh" ]; then source ...; fi` 形式（`set -e` 下の `[ -f ] && source` 回避）。source 行は `PM="${PM:-pnpm}"` の後・PM 委譲コマンドの前に置く（local で `PM` を上書き可能にする）
- 既存 scripts: `package-templates/scripts/*.sh`（`set -euo pipefail` + thin wrapper 3 本同型）

## 出力

- 3 scripts への同一パターン・同一コメントの source 機構（SEC-01: 「local ファイルはコミットされた内容がそのまま実行される」/ OPS-02: 「この行は installer 管理。カスタマイズは ai-check.local.sh 側へ」）
- `package-templates/scripts/README.md` の overlay 契約明文化（source 挙動 / SEC-01 / SEC-02 / +x 不要 — 想定エラー2）
- AC-02 対応テスト + `release-readiness.test.mjs` 期待値更新

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `package-templates/scripts/ai-check.sh`, `package-templates/scripts/ai-check-fast.sh`, `package-templates/scripts/ai-check-secure.sh`, `package-templates/scripts/README.md`, `tests/cli/release-readiness.test.mjs`（AC-02 の source 機構検証は本ファイルに集約し、`tests/cli/init.test.mjs` には置かない — TASK-0201 との並列実行時の競合回避）
- 削除: なし

## 禁止事項

- `ai-check.local.sh` という実ファイルの追加禁止（example は README 内コードブロックのみ — SPEC Forbidden Shortcuts）
- source 行を `set +e` で囲む等、local 失敗を silent に握りつぶす実装の禁止（INV-04）
- 3 scripts 間で source パターン・コメントに差異を作ることの禁止（実装ルール）
- `src/cli/` / `docs/` への変更禁止（TASK-0201/0202/0203 の責務 — AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止

## 完了条件

- [ ] AC-02: `ai-check.local.sh`（例: env var を echo する内容）を同 dir に置くと source され、削除すると従来どおり動作するテストがパスする（source 行の存在 + 3 scripts すべてに同一機構 — FR-01 / INV-03）
- [ ] 想定エラー1: 構文エラー local で scripts が非 0 で即終了するテストがパスする（INV-04）
- [ ] 想定エラー2: 実行権限なし local が正常に source されるテストがパスする
- [ ] PRE-01: scripts を別 cwd から呼んでも local が解決されるテストがパスする
- [ ] `node --test tests/cli/release-readiness.test.mjs` がパスする（テンプレート内容変更の期待値更新込み）
- [ ] NFR-03: local 不在時の `time bash <rendered scripts dir>/ai-check.sh` の増分が real 100ms 未満
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0199 を含める（commit-msg hook で強制）

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
