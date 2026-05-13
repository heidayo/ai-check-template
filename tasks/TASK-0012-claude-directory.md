# TASK-0012: package-templates/.claude/ 配下 3 ファイル作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0012 |
| SPEC-ID   | SPEC-0003 |
| PLAN-ID   | PLAN-0003 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 50m |

## 責務

`package-templates/.claude/` 配下に 3 ファイルを作成: `rules/test-rules.md`（Playwright Locator 優先順位）/ `settings.hook-fragment.json`（Edit/Stop hook 雛形）/ `README.md`。

## 入力

- SPEC-0003 §実装メモ §推奨実装骨格（.claude/settings.hook-fragment.json, .claude/rules/test-rules.md）
- philosophy: `package-templates/docs/philosophy/test-pyramid.md`（Playwright 層）, `formal-name-match.md`（hook ループ思想）
- Claude Code Hooks 公式 docs（参照日 2026-05-13）

## 出力

### `rules/test-rules.md`（30-150 行）
- H1: `# Test Rules`
- §Playwright Locator 優先順位（getByRole > Label > Text > TestId > locator）
- 各 locator の説明 + 良い例 / 悪い例
- philosophy への参照（test-pyramid.md）

### `settings.hook-fragment.json`（10-30 行）
- 有効な JSON
- `hooks.PostToolUse[]`: matcher `Edit|Write`、`pnpm ai:check:fast` を呼ぶ
- `hooks.Stop[]`: `pnpm ai:check` を呼ぶ
- コメント不要（純 JSON、説明は README で）

### `README.md`（50-200 行）
- H1: `# .claude/`
- 配布する内容（rules + settings fragment）
- 利用者の `.claude/settings.json` への組み込み方法（merge 例）
- hook が呼ぶコマンドと `package.scripts.fragment.json` の対応
- Claude Code Hooks 公式 spec への参照リンク

## File Scope

- 作成: `package-templates/.claude/rules/test-rules.md`, `package-templates/.claude/settings.hook-fragment.json`, `package-templates/.claude/README.md`
- 変更: なし
- 削除: なし

**変更禁止**: 本リポ自身の `.claude/settings.json` や `.claude/rules/*-rules.md` / SAGE 内部物 / TASK-0011, TASK-0013 の対象ファイル

## 禁止事項

PLAN-0003 §Forbidden Shortcuts 継承。本 TASK 固有:
- `settings.hook-fragment.json` で `--no-verify` / `--force` / `rm -rf` / `sudo` を含むコマンドを設定
- secret 直書き
- gakuten 固有語
- Claude Code spec と乖離した key 名（`Edit|Write` matcher / `Stop` event）
- 本リポ自身の `.claude/` を上書き

## 完了条件

- [ ] AC: `ls package-templates/.claude/{rules/test-rules.md, settings.hook-fragment.json, README.md}` 全成功
- [ ] AC: JSON 構文 pass: `python3 -c "import json; json.load(open('package-templates/.claude/settings.hook-fragment.json'))"` 成功
- [ ] AC: `grep -cE "getByRole|getByLabel|getByText|getByTestId|locator" package-templates/.claude/rules/test-rules.md` が 5 以上
- [ ] AC: hook fragment が `pnpm ai:check:fast` および `pnpm ai:check`（非 fast）を含む
- [ ] AC: 危険コマンド不在
- [ ] AC: secret 不在
- [ ] AC: gakuten 固有語不在
- [ ] AC: README と test-rules.md が H1 を持つ

## Done Definition

SPEC-0003 AC-01（部分）, AC-03, AC-04, AC-08, AC-09, AC-11, AC-12, AC-14 のうち .claude/ 部分。

## SPEC/PLAN 継承事項

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate | PLAN-0003 §Quality Gate | Gate 1 / 2 / 3 / 4 |
| テスト種別 | PLAN-0003 §必要な検証 | structural + syntax + security |
| カバレッジ | SPEC-0003 §NFR-05 | N/A |
| commit-msg hook | SPEC-0003 §契約 | 各 commit に TASK-0012 |
| Error Resolution | SPEC-0003 §Error Resolution | AC 別の復旧手順 |
| failures.md / anti-patterns.md | PLAN-0003 §Knowledge Management | hook spec 乖離 → failures.md |
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
