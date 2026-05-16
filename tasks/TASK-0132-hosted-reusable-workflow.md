# TASK-0132: Hosted reusable workflow

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0132 |
| SPEC-ID   | SPEC-0036 |
| PLAN-ID   | PLAN-0036 |
| ステータス | Done |
| 担当Agent | Infra |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

external repository から `uses: heidayo/ai-check-template/.github/workflows/ai-quality.yml@<tag>` で呼べる hosted reusable workflow を追加する。

## File Scope（変更許可範囲）

- 作成: `.github/workflows/ai-quality.yml`
- 削除: なし

## 禁止事項

- `.github/workflows/validate.yml` を変更しない
- release tag / GitHub Release を作らない
- secret literal を書かない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] `on.workflow_call` を持つ
- [x] `permissions: contents: read` を持つ
- [x] package manager / node / command / working directory / artifact inputs を持つ
- [x] `pnpm`, `npm`, `yarn`, `bun` install branches を持つ
- [x] TASK-0132 採点が 100/S++

## Tests

- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ai-quality.yml")'`
- `rg -n "workflow_call|permissions:|contents: read|package-manager|check-command" .github/workflows/ai-quality.yml`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| YAML parse fail | indentation / quoting を修正 |
| missing permission | `permissions.contents: read` を追加 |
| missing PM branch | install step を追加 |

## Knowledge Management

hosted workflow contract の不足が再発した場合、maintainer が missing input, expected contract, affected workflow を `sage/failures.md` に記録する。同じ不足が 3 回累積した場合は `sage/anti-patterns.md` への昇格候補にする。

## 段階採用

hosted workflow は release tag pin 後に external repos が使える foundation とし、Marketplace は後続に残す。

## Done Definition

SPEC-0036 AC-01, AC-07 の workflow path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-16-spec-0036-task-0132 |
| 開始     | 2026-05-16 |
| 完了     | 2026-05-16 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
