# expo-rn profile

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定。実体ファイルは Phase 2 で配布）

## 目的

Expo / React Native 環境の typical stack 向け profile。モバイル特有の制約（Native 連携、E2E ツールの違い、React Doctor の非対応）を考慮した品質ループを構築する。

## 対象スタック

| カテゴリ | 想定 |
|---|---|
| Framework | Expo SDK 50+ または素の React Native 0.73+ |
| Language | TypeScript |
| Navigation | React Navigation / Expo Router |
| Package Manager | pnpm / npm / yarn |
| Node version | 22 LTS |
| Native | iOS / Android（必要に応じて） |
| E2E | Maestro / Detox（Playwright は使わない） |

## 推奨ツール

| ツール | 必須/推奨/任意 | 用途 | 備考 |
|---|---|---|---|
| TypeScript | 必須 | 型チェック | |
| ESLint / oxlint | 必須 | lint | |
| **React Doctor** | **非対応** | — | React Doctor は **モバイル非対応**。代替なし（純 React コンポーネントのみ別途部分検査可） |
| Knip | 推奨 | 未使用検出 | |
| Jest / Vitest | 必須 | Unit / Integration | Jest が React Native コミュニティでは主流 |
| **Maestro** | 推奨 | E2E（モバイル UI） | Playwright の代替。YAML ベースで AI 出力と相性◯ |
| **Detox** | 任意 | E2E（より高度） | iOS / Android シミュレータ統合 |
| Semgrep | 推奨 | セキュリティ | |

## ai:check / ai:check:fast カスタマイズ案

```json
{
  "scripts": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test && pnpm test:e2e:smoke",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit"
  }
}
```

- `test:e2e:smoke`: Maestro で `maestro test .maestro/smoke.yaml` 等
- React Doctor 関連の script は **入れない**

## .claude / scripts カスタマイズ案

- `.claude/rules/test-rules.md`: Playwright Locator 優先順位の代わりに **Maestro / Detox の selector ルール**を記述
  - Maestro: `id:my-button` / `text:Submit` の優先順位
  - Detox: `by.id` > `by.label` > `by.text`
- hook fragment は基本構造そのまま（コマンドは `pnpm ai:check` / `pnpm ai:check:fast`）

## 注意事項

- **React Doctor 非対応**: 本 profile の最大の特徴。診断スコアによる判定は使えない。代替として静的解析 + 手動レビューに依存
- **Native module の test 困難**: モック化必須。test:unit でカバーできない範囲は Maestro / 手動確認
- **iOS / Android 差異**: 両 OS で動かして確認。CI で両 OS を sharding するコストを考慮
- **Expo Go 制限**: 一部 Native 機能は Expo Go では動かないため、開発ビルド / プロダクションビルドでのテストが必要
- **キャッシュ問題**: Metro / Babel のキャッシュで「直したつもりが反映されない」事故あり。CI では cache クリアを明示

## 隣接 profile

- [`../react-vanilla/README.md`](../react-vanilla/README.md) — Web の純 React
- [`../react-nextjs/README.md`](../react-nextjs/README.md) — Web の Next.js
- [`../node-cli/README.md`](../node-cli/README.md) — サーバー側ロジック

## 隣接思想

- [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) — モバイルでは E2E 層のコスト構造が異なる
- [`../../docs/philosophy/formal-name-match.md`](../../docs/philosophy/formal-name-match.md) — 形名参同（React Doctor を使わない場合は他の「形」で代替）
- [`../../docs/philosophy/qa-techniques.md`](../../docs/philosophy/qa-techniques.md) — QA 技法
- [`../../docs/philosophy/given-when-then.md`](../../docs/philosophy/given-when-then.md) — GWT（Maestro / Detox にそのまま使える）

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）
- Maestro 公式 docs
- Detox 公式 docs
