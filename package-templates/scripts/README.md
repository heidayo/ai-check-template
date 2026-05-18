# scripts/

`ai:check` 系の薄い entry point スクリプト。配布される example。

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 提供物

```
scripts/
├── ai-check.sh          # full check（Static + Unit + Integration + Diagnostic + E2E）
├── ai-check-fast.sh     # fast check（Static + Unit のみ、AI 内部ループ用）
└── ai-check-secure.sh   # security check（Semgrep 等）
```

## 思想

形名参同（[`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md)）の「形」を取得する実体。

- 「名」（成功基準）は `package.json` の `ai:check` / `ai:check:fast` / `ai:check:secure` スクリプトに定義
- 「形」（実測値）はそれらを実行した出力
- 本スクリプトは PM 抽象化と最小ロギングのみ担当し、ロジックは npm scripts に委譲する

## 使い方

### 直接実行
```bash
bash scripts/ai-check.sh
bash scripts/ai-check-fast.sh
bash scripts/ai-check-secure.sh
```

### PM 切り替え
デフォルトは `pnpm`。`PM` 環境変数で上書き可:
```bash
PM=npm  bash scripts/ai-check.sh
PM=yarn bash scripts/ai-check.sh
PM=bun  bash scripts/ai-check.sh
```

### 直接 npm script を呼ぶ場合
シェルスクリプトを使わず `pnpm` 直接呼びでも同等:
```bash
pnpm ai:check
pnpm ai:check:fast
pnpm ai:check:secure
```

シェルスクリプトの利点:
- PM 非依存（環境変数で切り替え）
- 非 Node プロジェクトでも entry point として配置可能
- 統一 logging プレフィックス（`[ai-check]` / `[ai-check-fast]` / `[ai-check-secure]`）

## package.scripts.fragment.json との関係

`ai:check` / `ai:check:fast` / `ai:check:secure` の中身は `../package.scripts.fragment.json` に定義される。
利用者は自プロジェクトの `package.json` に scripts エントリをマージする。

```
scripts/ai-check.sh → ${PM} ai:check → package.json scripts.ai:check
                                       (typecheck → lint → test → e2e:smoke 等を連鎖)
scripts/ai-check-secure.sh → ${PM} ai:check:secure → package.json scripts.ai:check:secure
                                                     (semgrep scan --config auto)
```

## CI 統合との関係

[`../ci-examples/github-actions/ai-check.yml`](../ci-examples/github-actions/ai-check.yml) でも同じ `${PM} ai:check` を呼ぶ。
ローカル（シェル）と CI（GitHub Actions）で**同じコマンド**が走る設計。
Security gate を CI で分ける場合は、hosted workflow / Composite Action の `check-command` に `pnpm ai:check:secure` を渡す。

## Claude Code Hook との関係

[`../.claude/settings.hook-fragment.json`](../.claude/settings.hook-fragment.json) の Edit hook が `pnpm ai:check:fast` を呼び、Stop hook が `pnpm ai:check` を呼ぶ。
シェル経由でも npm script 直接でも、最終的に同じスクリプトが走る。

## カスタマイズ

- timeout: シェルラッパーには timeout 設定なし。CI 側で `timeout-minutes` を設定する
- 失敗時の自動修正ループ: 本スクリプトはスコープ外。AI への修正指示は上位の運用プロンプトで行う

## 出典

- Notion Doc #2（`c3e549660ca44005a20c4f6fdb54c8d5`、参照日 2026-05-13）の「## package.jsonに入れる推奨script」節
