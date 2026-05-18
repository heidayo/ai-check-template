# react-vanilla profile

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定。実体ファイルは Phase 2 で配布）

## 目的

純 React + TypeScript（Next.js なし、Vite / CRA / 自前 setup）の typical stack 向け profile。Next.js 固有機能を除外し、SPA としての品質ループを構築する。

## 対象スタック

| カテゴリ | 想定 |
|---|---|
| Framework | React 18+（Vite / Create React App / 自前 webpack 等） |
| Language | TypeScript |
| Routing | React Router / TanStack Router 等 |
| Package Manager | pnpm（npm / yarn / bun でも可） |
| Node version | 22 LTS |
| UI Test | Playwright（任意、SPA のみなら React Testing Library で代替可） |

## 推奨ツール

| ツール | 必須/推奨/任意 | 用途 | 備考 |
|---|---|---|---|
| TypeScript | 必須 | 型チェック | |
| ESLint / oxlint | 必須 | lint | |
| React Doctor | 任意 | React 品質診断 | Next.js 固有診断項目は対象外、純 React 部分のみ有効 |
| Knip | 推奨 | 未使用検出 | |
| Vitest | 必須 | Unit / Integration | |
| Playwright | 任意 | E2E | SPA で十分な testing-library 等で代替可 |
| Semgrep | 推奨 | セキュリティ | |

## ai:check / ai:check:fast カスタマイズ案

```json
{
  "scripts": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": "semgrep scan --config auto"
  }
}
```

Playwright を使う場合は `ai:check` に `pnpm test:e2e:smoke` を追加。
Security gate は `ai:check:secure` として分離し、Semgrep の導入・設定は利用プロジェクト側で行う。

## .claude / scripts カスタマイズ案

react-nextjs profile と同じ（hook fragment / test-rules / scripts はそのまま使える）。
ただし test-rules.md の Playwright Locator 優先順位は Playwright を使わない場合は不要。

## 注意事項

- **SPA の SEO 制約**: SSR がないため、SEO 観点のテストは別途検討
- **react-router の権限制御**: `<ProtectedRoute>` 等の wrapper が server-side 認可と一致するか確認
- **localStorage / sessionStorage の漏洩**: secret を store しないか lint で検出
- **CSP**: SPA は inline script を多用しがちなので strict CSP との相性を確認

## 隣接 profile

- [`../react-nextjs/README.md`](../react-nextjs/README.md) — Next.js（推奨：本 profile より広範囲）
- [`../node-cli/README.md`](../node-cli/README.md) — UI なしの Node
- [`../supabase-rls/README.md`](../supabase-rls/README.md) — Supabase + RLS を追加

## 隣接思想

- [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) — 各層の責務分割
- [`../../docs/philosophy/formal-name-match.md`](../../docs/philosophy/formal-name-match.md) — 形名参同
- [`../../docs/philosophy/qa-techniques.md`](../../docs/philosophy/qa-techniques.md) — QA 技法
- [`../../docs/philosophy/given-when-then.md`](../../docs/philosophy/given-when-then.md) — GWT

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）
- Testing Library Guiding Principles（公式）
