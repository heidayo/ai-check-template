# ai-check-template（日本語版）

**AI が生成したコードを、そのまま信じない。**

`ai-check-template` は、AI が書いたコードを**検証・修正・安全にマージする**ためのテンプレート集です。

> 「AI が実装しました」

から、

> 「AI が実装し、検査を通過し、リスクが可視化され、人間が証拠付きで受け入れた」

への移行を支援します。

> English version: [`README.md`](./README.md)

---

## What is this? / これは何?

AI 駆動開発のためのテンプレート集。以下を提供:

- AI 生成コード向けの**テスト設計思想**（Test Pyramid / Given-When-Then / QA 技法 / 形名参同）
- 実装前に成功基準を AI に宣言させる **AI プロンプト雛形**
- `ai:check` **実行スタック**（npm scripts / Claude Code hooks / シェルエントリポイント）
- 同じ `ai:check` を PR で走らせる **GitHub Actions テンプレ**
- 主要スタック向け**プロファイル**（Next.js / vanilla React / Expo / Node CLI / Supabase + RLS）

必要な部分をコピーして自プロジェクトに合わせ、検証可能なループを得る。特定の LLM・フレームワーク・ベンダーに依存しない設計。

## Why? / なぜ?

AI コーディングツール（Claude Code / Codex / Cursor 等）は実装を速くするが、**検証を速くはしない**。

実務で AI 生成コードはよく以下に陥る:

- 目視チェックは通るが、型 / lint / E2E で落ちる
- 動いて見えるが、認可 / RLS / レート制限を無視している
- 未使用 export / 不要コード / 意図しないスコープ拡散が残る
- 「完了しました」と自己申告するが、実際は部分完了

本リポは**形名参同**（事前宣言した成功基準と実測値の照合）を中核に据える。AI に自己採点させない。

## Core loop / 中核ループ

```
要件
   ↓
受け入れ条件（Given-When-Then）
   ↓
テスト設計（QA 技法: 同値分割 / 境界値 / デシジョンテーブル / 状態遷移 / RLS 権限）
   ↓
AI 実装
   ↓
品質チェック（typecheck → lint → unit → diagnostics → E2E smoke）
   ↓
修正（AI が同一セッションで自動修正）
   ↓
再チェック
   ↓
人間の受け入れ判断（証拠付き）
```

各ステップに対応するテンプレ・プロンプトを配布します。

## What you get / 提供物

| レイヤ | 内容 |
|---|---|
| **思想ドキュメント** | [`formal-name-match.md`](./package-templates/docs/philosophy/formal-name-match.md)（形名参同）、[`test-pyramid.md`](./package-templates/docs/philosophy/test-pyramid.md)（責務分割）、[`given-when-then.md`](./package-templates/docs/philosophy/given-when-then.md)（GWT）、[`qa-techniques.md`](./package-templates/docs/philosophy/qa-techniques.md)（QA 技法） |
| **AI プロンプト雛形** | `decision-table` / `state-transition` / `boundary-value` / `rls-permission` / `plan-first` |
| **実行スタック** | `scripts/ai-check.sh`、`scripts/ai-check-fast.sh`、`.claude/settings.hook-fragment.json`、`.claude/rules/test-rules.md`、`package.scripts.fragment.json` |
| **CI テンプレ** | GitHub Actions `ai-check.yml`（フル）+ `ai-check-fast.yml`（PR の fast ループ） |
| **プロファイル** | `react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli` / `supabase-rls` |
| **プロジェクト docs** | [`docs/vision.md`](./docs/vision.md)、[`docs/roadmap.md`](./docs/roadmap.md)、Phase 1 dogfooding プロトコル |

## Quick start / 最短手順

> v0.1.0 は「コピー＆カスタマイズ」型。CLI（`npx ai-check-template init`）は v0.2.0 で提供予定。

```bash
# 1. リポをクローン
git clone https://github.com/heidayo/ai-check-template.git

# 2. スタックに合う profile を確認
cat ai-check-template/package-templates/profiles/react-nextjs/README.md

# 3. 必要なファイルを自プロジェクトにコピー
cp -r ai-check-template/package-templates/scripts ./scripts
cp -r ai-check-template/package-templates/.claude ./.claude
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check.yml .github/workflows/
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check-fast.yml .github/workflows/

# 4. scripts fragment を package.json にマージ
cat ai-check-template/package-templates/package.scripts.fragment.json
# 出力の "ai:check" / "ai:check:fast" を自プロジェクトの package.json の scripts に追加

# 5. ループを回す
pnpm ai:check
```

詳細は [`docs/roadmap.md`](./docs/roadmap.md) と各 profile の README（[`package-templates/profiles/`](./package-templates/profiles/)）を参照。

## Supported profiles / 対応プロファイル

| Profile | 対象スタック | 注意点 |
|---|---|---|
| [`react-nextjs`](./package-templates/profiles/react-nextjs/) | Next.js App Router + TypeScript | フル toolchain（RD / Knip / Playwright / Semgrep） |
| [`react-vanilla`](./package-templates/profiles/react-vanilla/) | 純 React + TypeScript（Vite / CRA） | Next.js 固有の React Doctor 診断は対象外 |
| [`expo-rn`](./package-templates/profiles/expo-rn/) | Expo / React Native | React Doctor 非対応。E2E は Maestro / Detox |
| [`node-cli`](./package-templates/profiles/node-cli/) | Node CLI / Library | UI / E2E なし、Static + Unit 中心 |
| [`supabase-rls`](./package-templates/profiles/supabase-rls/) | Supabase + RLS（addon） | 他 profile と組み合わせ（例: `react-nextjs+supabase-rls`） |

## Roadmap

| バージョン | テーマ | 状態 |
|---|---|---|
| **v0.1.0** | 手動コピーで使うテンプレ集 | 進行中（本 PR シリーズ） |
| **v0.2.0** | CLI scaffolding（`npx ai-check-template init`） | 計画中 |
| **v0.3.0+** | Reusable workflow + Composite Action（GitHub Marketplace） | 計画中 |

詳細: [`docs/roadmap.md`](./docs/roadmap.md)。

## Contributing / 貢献

貢献を歓迎します。PR フロー / レーン選択は [`CONTRIBUTING.md`](./CONTRIBUTING.md)、コミュニティ規範は [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)、脆弱性報告は [`SECURITY.md`](./SECURITY.md) を参照。

Issue / PR テンプレートは [`.github/`](./.github/) 配下。

## License

[Apache-2.0](./LICENSE)

---

> 本リポ自身も [SAGE Development System](https://github.com/heidayo/sage-ai-template)（Spec → Plan → Task → Execute → Verify）で開発しています。利用者は SAGE インストール不要（テンプレを使う側は SAGE 非依存）。SAGE 共存は opt-in。詳細は [`CONTRIBUTING.md`](./CONTRIBUTING.md) を参照。
