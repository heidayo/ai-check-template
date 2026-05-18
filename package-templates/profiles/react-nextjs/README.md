# react-nextjs profile

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定。実体ファイルは Phase 2 で配布）

## 目的

Next.js（App Router 想定）+ TypeScript の typical stack で AI 駆動開発の品質ループを構築する利用者向け profile。フル toolchain（型 / lint / 静的解析 / 未使用検出 / E2E / セキュリティ）を組み合わせて、形名参同による品質照合を実装する。

## 対象スタック

| カテゴリ | 想定 |
|---|---|
| Framework | Next.js 14+（App Router、Pages Router でも動作するが調整必要） |
| Language | TypeScript |
| Package Manager | pnpm（npm / yarn / bun でも可、`PM` 環境変数で切り替え） |
| Node version | 22 LTS（20 でも動作） |
| UI Test | Playwright |
| Style | Tailwind / CSS Modules / styled-components いずれも可 |

## 推奨ツール

| ツール | 必須/推奨/任意 | 用途 | 備考 |
|---|---|---|---|
| TypeScript | 必須 | 型チェック | `tsc --noEmit` を `ai:check:fast` に含める |
| ESLint / oxlint | 必須 | lint | oxlint の高速性で AI 内部ループ向き |
| React Doctor | 推奨 | React/Next.js 品質診断 | 75 以上目標、50 未満マージ不可 |
| Knip | 推奨 | 未使用検出 | 1 週間運用後に CI 強制を検討 |
| Playwright | 必須 | E2E（主要導線のみ） | smoke は PR、full は nightly |
| Semgrep | 推奨 | セキュリティ | High/Critical でマージブロック |

## ai:check / ai:check:fast カスタマイズ案

`package.scripts.fragment.json` を以下のように調整:

```json
{
  "scripts": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": "semgrep scan --config auto"
  }
}
```

個別ツールの npm script を別途定義:
- `typecheck`: `tsc --noEmit`
- `lint`: `next lint` または `oxlint .`
- `doctor`: `npx -y react-doctor@latest . --fail-on warning`
- `deadcode`: `knip`
- `test`: `vitest run`
- `test:unit`: `vitest run --dir tests/unit`
- `test:e2e:smoke`: `playwright test --grep smoke`
- `ai:check:secure`: Semgrep による security gate。`ai:check` には混ぜず、PR / CI の別 step で実行。

## .claude / scripts カスタマイズ案

- `.claude/settings.hook-fragment.json`: そのまま使える（hook command が `pnpm ai:check` / `pnpm ai:check:fast`）
- `.claude/rules/test-rules.md`: Playwright Locator 優先順位を遵守
- `scripts/ai-check.sh` / `ai-check-fast.sh` / `ai-check-secure.sh`: そのまま

## 注意事項

- **Pages Router の場合**: App Router 前提の React Doctor 診断項目が一部対象外。`--ignore-pages` 等の調整を検討
- **monorepo**: workspace の場合、`pnpm -r ai:check` のような root レベルスクリプトを別途用意
- **Playwright のフレーキー**: 主要導線のみに絞り、retry 1 回まで許容
- **Server Actions**: 認可は client 側だけでなく server action 内でも検証（参照: [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) §3 Integration）

## 隣接 profile

- [`../react-vanilla/README.md`](../react-vanilla/README.md) — Next.js なしの純 React
- [`../supabase-rls/README.md`](../supabase-rls/README.md) — Supabase + RLS を追加適用
- [`../expo-rn/README.md`](../expo-rn/README.md) — モバイル（React Native）

## 隣接思想

- [`../../docs/philosophy/formal-name-match.md`](../../docs/philosophy/formal-name-match.md) — 形名参同
- [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) — 責務分割
- [`../../docs/philosophy/given-when-then.md`](../../docs/philosophy/given-when-then.md) — 受け入れ条件先出し
- [`../../docs/philosophy/qa-techniques.md`](../../docs/philosophy/qa-techniques.md) — QA 技法

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）
- Next.js Testing Guide（公式）
