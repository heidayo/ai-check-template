# .claude/

Claude Code 用の設定とルールを配布する example。

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

> **重要**: ここに置く `.claude/` は **配布物** として利用者のプロジェクトにコピーされる前提。本リポ自身の `.claude/`（リポジトリルート直下）は SAGE が管理しており、配布物とは別物。

## 提供物

```
.claude/
├── rules/
│   └── test-rules.md                    # Playwright Locator 優先順位
└── settings.hook-fragment.json          # Edit/Stop hook の雛形
```

## 思想

[`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) の **AI 内部ループ** を実体化するための hook 設定。

- **Edit hook**（fast）: AI がコード編集するたびに `pnpm ai:check:fast` を呼ぶ。Static + Unit のみで軽量
- **Stop hook**（full）: AI セッション終了時に `pnpm ai:check` を呼ぶ。Diagnostic + E2E まで含む完全版

これにより、AI が「実装完了しました」と言って終わる前に必ず形名照合が走る。

## 利用者の `.claude/settings.json` への組み込み

利用者は自プロジェクトの `.claude/settings.json` に hook fragment をマージする。

### 既存 settings.json がない場合

```bash
cp .claude/settings.hook-fragment.json /your-project/.claude/settings.json
```

### 既存 settings.json に hook を追加する場合

JSON の `hooks` キーをマージ。例えば `jq` を使う場合:

```bash
jq -s '.[0] * .[1]' \
  /your-project/.claude/settings.json \
  .claude/settings.hook-fragment.json \
  > /tmp/merged.json && mv /tmp/merged.json /your-project/.claude/settings.json
```

または手動で `hooks` セクションを追記する。

### test-rules.md の組み込み

```bash
cp .claude/rules/test-rules.md /your-project/.claude/rules/
```

複数の rules ファイルが既にある場合はそのままコピーで競合しない（ファイル名が衝突しない限り）。

## hook が呼ぶコマンドと package.scripts.fragment.json の対応

| Hook | コマンド | scripts エントリ |
|---|---|---|
| `PostToolUse` (Edit/Write) | `pnpm ai:check:fast` | `package.json` の `scripts."ai:check:fast"` |
| `Stop` | `pnpm ai:check` | `package.json` の `scripts."ai:check"` |

`scripts."ai:check"` / `"ai:check:fast"` の中身は [`../package.scripts.fragment.json`](../package.scripts.fragment.json) を参照。
シェル経由（[`../scripts/ai-check.sh`](../scripts/ai-check.sh)）でも CI 経由（[`../ci-examples/github-actions/ai-check.yml`](../ci-examples/github-actions/ai-check.yml)）でも同じコマンドが走る設計。

## カスタマイズ

### PM 変更
hook の `command` フィールドを `npm run ai:check`, `yarn ai:check`, `bun run ai:check` などに変更。

### Edit hook を無効化
`PostToolUse` セクションを削除すれば、Edit ごとの fast loop は走らない（Stop hook の full check のみになる）。

### blocking モード
本 fragment では `blocking` を指定していない（Claude Code default の非 blocking）。
編集を強制ブロックしたい場合は `"blocking": true` を追加。ただし誤判定でセッションが進まなくなるリスクあり。

## 出典

- Claude Code Hooks 公式 docs（参照日 2026-05-13）
- Notion Doc #2（`c3e549660ca44005a20c4f6fdb54c8d5`）の「## Codex / Claude Codeに渡す運用プロンプト」節
