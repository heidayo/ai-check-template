# profiles/

技術スタック別の typical 構成を提供する profile ライブラリ。利用者は自プロジェクトに合う profile を 1 つ選び、必要なら addon profile（supabase-rls）と組み合わせる。

> **ステータス**: Draft v0.1（Phase 0 では README のみ配布、実体ファイルは Phase 2 で）

## 5 profile 一覧

| profile | 対象スタック | 主な特徴 | 注意点 |
|---|---|---|---|
| [`react-nextjs/`](./react-nextjs/README.md) | Next.js App Router + TS | フル toolchain | 推奨スタート地点 |
| [`react-vanilla/`](./react-vanilla/README.md) | 純 React + TS（Vite / CRA） | Next.js なし | SSR なしのため SEO 別途 |
| [`expo-rn/`](./expo-rn/README.md) | Expo / React Native | モバイル特化 | React Doctor は RN 診断に対応、E2E は Maestro / Detox 使用 |
| [`node-cli/`](./node-cli/README.md) | Node CLI / Library | UI なし、Static + Unit 中心 | Playwright 不要 |
| [`supabase-rls/`](./supabase-rls/README.md)（addon） | Supabase + RLS | 上記 profile に追加適用 | 単独 profile ではない、組み合わせ前提 |

## 選び方フロー

```
1. UI を持つ？
   ├─ Yes: Web か モバイルか？
   │      ├─ Web: Next.js を使う？
   │      │       ├─ Yes → react-nextjs
   │      │       └─ No  → react-vanilla
   │      └─ モバイル → expo-rn
   └─ No → node-cli

2. Supabase + RLS を使う？
   ├─ Yes → 上で選んだ profile に supabase-rls を追加
   └─ No  → 上で選んだ profile のみ
```

## 組み合わせパターン例

| 組み合わせ | 使うところ |
|---|---|
| `react-nextjs` | Next.js + 自前 API |
| `react-nextjs+supabase-rls` | Next.js + Supabase（最も多い構成） |
| `react-vanilla` | SPA + 自前 API |
| `react-vanilla+supabase-rls` | SPA + Supabase |
| `expo-rn` | モバイル + 自前 API |
| `expo-rn+supabase-rls` | モバイル + Supabase |
| `node-cli` | CLI ツール / ライブラリ |
| `node-cli+supabase-rls` | サーバー側スクリプト + Supabase |

Phase 2 の CLI 実装で `--profile react-nextjs+supabase-rls` 形式を予定。

## Phase 0 ステータス

本ディレクトリは Phase 0 では **README のみ配布**。実体ファイル（profile-specific な scripts / hook / 設定）は以下のフェーズで提供:

| Phase | 内容 |
|---|---|
| Phase 0（現状） | profile README のみ |
| Phase 1 | dogfooding で profile の精度を上げる（README 改訂） |
| Phase 2 | profile-specific な実体ファイルを CLI で配布（`npx ai-check-template init --profile X`） |
| Phase 3 | 多 profile / 多プロジェクトでの横展開 |

利用者は現状 README を読んで手動で自プロジェクトを構成する。Phase 2 以降は CLI 統合される。

## 各 profile に共通する構造

| セクション | 内容 |
|---|---|
| 目的 | 誰向け・何を解決するか |
| 対象スタック | フレームワーク・ライブラリ・バージョン |
| 推奨ツール | 必須 / 推奨 / 任意のテーブル |
| ai:check カスタマイズ案 | `package.scripts.fragment.json` の差分。security gate は `ai:check:secure` として分離 |
| .claude / scripts カスタマイズ案 | hook / scripts の差分 |
| 注意事項 | profile 固有の落とし穴 |
| 隣接 profile | 他 profile への参照 |
| 隣接思想 | philosophy への相互リンク |
| 出典 | Notion / 公式 docs |

## 新規 profile の追加

新しいスタック（例: rust-cli, python-fastapi）への対応は新規 SPEC で行う。本 SPEC（SPEC-0005）は 5 profile に限定。

## 隣接する思想

- [`../docs/philosophy/test-pyramid.md`](../docs/philosophy/test-pyramid.md) — 各 profile で責務分割の応用が異なる
- [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) — 形名参同（profile 別の「名」定義）
- [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) — QA 技法
- [`../docs/philosophy/given-when-then.md`](../docs/philosophy/given-when-then.md) — GWT

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）
- Notion ページ: `7c531b165bab4b7ea2dce1782469ac52` — Supabase Testing 戦略
