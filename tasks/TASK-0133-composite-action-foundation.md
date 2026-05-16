# TASK-0133: Composite Action foundation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0133 |
| SPEC-ID   | SPEC-0036 |
| PLAN-ID   | PLAN-0036 |
| ステータス | Done |
| 担当Agent | Infra |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

external repository から `uses: heidayo/ai-check-template/ai-quality@<tag>` で呼べる Composite Action metadata を追加する。

## File Scope（変更許可範囲）

- 作成: `ai-quality/action.yml`
- 削除: なし

## 禁止事項

- CLI runtime source を変更しない
- checkout を action 内で実行しない
- secret literal を書かない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `runs.using: composite` を持つ
- [x] package manager / node / command / working directory / artifact inputs を持つ
- [x] checkout 済み workspace 前提が action description に現れる
- [x] install / check / optional artifact upload steps を持つ
- [x] TASK-0133 採点が 100/S++

## Tests

- `ruby -e 'require "yaml"; YAML.load_file("ai-quality/action.yml")'`
- `rg -n "using: composite|package-manager|check-command|working-directory|upload-ai-check-artifacts" ai-quality/action.yml`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| YAML parse fail | indentation / quoting を修正 |
| checkout included | checkout step を削除し docs に caller responsibility と書く |
| missing input | action inputs に追加 |

## Knowledge Management

Composite Action contract の不足が再発した場合、maintainer が missing input, expected contract, affected action metadata を `sage/failures.md` に記録する。同じ不足が 3 回累積した場合は `sage/anti-patterns.md` への昇格候補にする。

## 段階採用

Composite Action は exact tag pin で使える foundation とし、Marketplace metadata / branding は後続に残す。

## Done Definition

SPEC-0036 AC-02 の action path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0036-task-0133 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
