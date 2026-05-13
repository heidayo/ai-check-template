# TASK-0011: package-templates/scripts/ 配下 3 ファイル作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0011 |
| SPEC-ID   | SPEC-0003 |
| PLAN-ID   | PLAN-0003 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 40m |

## 責務

`package-templates/scripts/` 配下に 3 ファイルを作成: `ai-check.sh`（full）/ `ai-check-fast.sh`（fast）/ `README.md`。

## 入力

- SPEC-0003 §実装メモ §推奨実装骨格（scripts/ai-check.sh / ai-check-fast.sh）
- philosophy: `package-templates/docs/philosophy/formal-name-match.md`（形名参同思想）
- 言語規約: shell 本体は英語、コメント・README は日本語

## 出力

### `ai-check.sh`（10-50 行）
- shebang `#!/usr/bin/env bash`
- `set -euo pipefail`
- `PM` 環境変数（default `pnpm`、`PM=npm bash ai-check.sh` で上書き可）
- `${PM} ai:check` を呼び終了コードを伝播

### `ai-check-fast.sh`（10-50 行）
- 同上、ただし `${PM} ai:check:fast` を呼ぶ

### `README.md`（50-200 行）
- H1: `# scripts/`
- 概要（scripts/ ディレクトリは ai:check 系の薄い entry point）
- 使い方（`bash ai-check.sh` / `bash ai-check-fast.sh`、PM 切り替え）
- `package.scripts.fragment.json` との関係
- philosophy への参照（formal-name-match.md）

## File Scope（変更許可範囲）

- 作成: `package-templates/scripts/ai-check.sh`, `package-templates/scripts/ai-check-fast.sh`, `package-templates/scripts/README.md`
- 変更: なし
- 削除: なし

**変更禁止**: TASK-0012, TASK-0013 の対象ファイル / 本リポ `scripts/` / SAGE 内部物

## 禁止事項

PLAN-0003 §Forbidden Shortcuts 継承。本 TASK 固有:
- `set -euo pipefail` の省略
- `eval` / `bash -c` / `curl | sh` の使用
- `rm -rf` / `sudo` の使用
- secret / token の直書き
- `pnpm` 固定（PM 環境変数で差し替え可にする）
- gakuten 固有語の使用
- TODO / FIXME を残す

## 完了条件

- [ ] AC: `ls package-templates/scripts/{ai-check.sh,ai-check-fast.sh,README.md}` が全成功
- [ ] AC: `bash -n package-templates/scripts/ai-check.sh && bash -n package-templates/scripts/ai-check-fast.sh` が成功
- [ ] AC: 2 つの sh ファイルが `set -euo pipefail` を持つ
- [ ] AC: `grep -E "(\\\$\\{?PM\\}? )?ai:check($|[^:])" package-templates/scripts/ai-check.sh` が match
- [ ] AC: `grep -q "ai:check:fast" package-templates/scripts/ai-check-fast.sh` 成功
- [ ] AC: 危険コマンド不在: `grep -E "(rm -rf|sudo|eval|bash -c|curl.*\| *sh)" package-templates/scripts/*.sh` が空
- [ ] AC: secret 不在
- [ ] AC: gakuten 固有語不在
- [ ] AC: README が `# scripts/` で始まる
- [ ] AC: sh は 10-50 行、README は 50-200 行

## Done Definition

SPEC-0003 AC-01（部分）, AC-02, AC-05, AC-06, AC-10, AC-11, AC-12, AC-14 のうち scripts/ 部分。

## SPEC/PLAN 継承事項

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate | PLAN-0003 §Quality Gate マッピング | Gate 1 / 2 / 3 / 4 |
| テスト種別 | PLAN-0003 §必要な検証 | structural + syntax + security |
| カバレッジ | SPEC-0003 §NFR-05 | N/A |
| commit-msg hook | SPEC-0003 §契約 | 各 commit に TASK-0011 |
| Error Resolution | SPEC-0003 §Error Resolution | AC 別の復旧手順 |
| failures.md / anti-patterns.md | PLAN-0003 §Knowledge Management | 危険コマンド混入 3 回で昇格 |
| 採用メトリクス | PLAN-0003 §採用メトリクス | TASK 完了 + AC pass |
| 段階移行 | PLAN-0003 §段階移行 | Pending → Done |
| ロールバック | PLAN-0003 §ロールバック | Level 1: 該当ファイル復元 |

## 実行ログ

| フィールド | 内容 |
|---|---|
| RUN-ID | （実行時） |
| 開始 | （TBD） |
| 完了 | （TBD） |
| 結果 | （TBD） |
| Gate結果 | structural / functional / security / architecture: TBD |
