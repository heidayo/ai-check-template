# ai-check-template

**AI が生成したコードを、そのまま信じない。**

`ai-check-template` は、AI が書いたコードを**検証・修正・安全にマージする**ためのテンプレート集です。

> 「AI が実装しました」

から、

> 「AI が実装し、検査を通過し、リスクが可視化され、人間が証拠付きで受け入れた」

への移行を支援します。

> English version: [`README-en.md`](./README-en.md)

---

## What is this? / これは何?

AI 駆動開発のためのテンプレート集。以下を提供:

- AI 生成コード向けの**テスト設計思想**（Test Pyramid / Given-When-Then / QA 技法 / 形名参同）
- 実装前に成功基準を AI に宣言させる **AI プロンプト雛形**
- `ai:check` **実行スタック**（npm scripts / Claude Code hooks / シェルエントリポイント）
- Semgrep ベースの診断を分離する **`ai:check:secure` security gate**
- 同じ `ai:check` を PR で走らせる **GitHub Actions テンプレと hosted workflow foundation**
- PR 証跡、設計説明、トレードオフ分析、人間の理解度確認のための **Reviewability テンプレート**
- 主要スタック向け**プロファイル**（Next.js / vanilla React / Expo / Node CLI / Supabase + RLS）
- 安全な初期導入のための stable npm **CLI**

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
| **テスト設計** | [`test-design-template.md`](./package-templates/docs/test-design-template.md) は要件を AC / Test Matrix / 検証コマンドへ落とすテンプレート |
| **AI プロンプト雛形** | `decision-table` / `state-transition` / `boundary-value` / `rls-permission` / `plan-first` / [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) |
| **Reviewability** | [PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md)、[AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md)、[design explanation](./package-templates/prompts/design-explanation.md)、[tradeoff analysis](./package-templates/prompts/tradeoff-analysis.md)、[self-understanding check](./package-templates/prompts/self-understanding-check.md)、[review training](./package-templates/prompts/review-training.md) |
| **実行スタック** | `scripts/ai-check.sh`、`scripts/ai-check-fast.sh`、`scripts/ai-check-secure.sh`、`.claude/settings.hook-fragment.json`、`.claude/rules/test-rules.md`、`package.scripts.fragment.json` |
| **CI 統合** | GitHub Actions `ai-check.yml`（フル）、`ai-check-fast.yml`（PR の fast ループ）、reusable workflow examples、hosted workflow / Composite Action guide の [`docs/github-actions.md`](./docs/github-actions.md) |
| **Examples** | [`examples/nextjs-basic`](./examples/nextjs-basic/) は AI 生成コードの Before / After を示す runnable example |
| **プロファイル** | `react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli` / `supabase-rls` |
| **CLI** | [`docs/cli.md`](./docs/cli.md) は `ai-check-template@0.2.0` CLI、`init` command、read-only `doctor` command、guarded `update` command、install state（`.ai-check-template.json`）、profile-aware package script migrations、profile docs migration、support script defaults、`pnpm` / `npm` / `yarn` / `bun` の package manager detection と Claude hook / review template / CI workflow command rendering、optional `--install-deps` npm dev dependency install、exact-managed workflow cleanup、advisory profile / missing-script diagnostics warnings、stale managed CI diagnostics、`doctor --strict`、`--profile`、`--package-manager`、`--ci`、`--claude-hooks`、`--review-templates`、`--dry-run`、`--overwrite` を説明 |
| **プロジェクト docs** | [`docs/usage-model.md`](./docs/usage-model.md)、[`docs/vision.md`](./docs/vision.md)、[`docs/roadmap.md`](./docs/roadmap.md)、Phase 1 dogfooding プロトコル、[`初回 dogfooding report`](./docs/phase-1-initial-dogfooding-report.md) |

## Where This Fits / どこに効くか

`ai-check-template` は post-implementation verification stack です。AI にコードを書かせるためのものではなく、AI が生成したコードを実装後に検証・修正・安全に受け入れるための基盤です。

使いどころは 5 つです。AI 編集直後の **Local loop**、診断結果から修正する **Repair loop**、重要導線を守る **E2E loop**、PR で同じ検証を強制する **CI gate**、設計・リスク・追加テスト・理解度を人間が受け入れる **Review gate**。Review gate は CLI の `--review-templates` で導入するか、[`package-templates/.github/`](./package-templates/.github/) と [`package-templates/worksheet/`](./package-templates/worksheet/) から手動コピーできます。詳細は [`docs/usage-model.md`](./docs/usage-model.md) を参照。

Security check は意図的に分離しています。`ai:check` は機能品質、`ai:check:secure` は Semgrep ベースの security evidence として扱います。

## Quick start / 最短手順

> v0.1.0 は「コピー＆カスタマイズ」型としてリリース済み。詳細は [`docs/releases/v0.1.0.md`](./docs/releases/v0.1.0.md)。v0.2.0 は stable CLI package `ai-check-template@0.2.0` としてリリース済みです。詳細は [`docs/releases/v0.2.0.md`](./docs/releases/v0.2.0.md)、alpha 履歴は [`docs/releases/v0.2.0-alpha.0.md`](./docs/releases/v0.2.0-alpha.0.md)、CLI 詳細は [`docs/cli.md`](./docs/cli.md) を参照。v0.3.0 は GitHub Actions integration foundation としてリリース済みです。詳細は [`docs/releases/v0.3.0.md`](./docs/releases/v0.3.0.md) と [`docs/github-actions.md`](./docs/github-actions.md) を参照。今後の publish 前も repository validation で `npm pack` readiness check と `npm publish --dry-run --tag latest` preflight を実行します。

```bash
# 1. リポをクローン
git clone https://github.com/heidayo/ai-check-template.git

# 2. npm から stable CLI init を dry-run
npx -y ai-check-template init --target . --profile react-nextjs --dry-run
npx -y ai-check-template init --target . --profile node-cli --package-manager npm --ci none --dry-run
npx -y ai-check-template doctor --target . --ci none
npx -y ai-check-template update --target . --dry-run

# 3. スタックに合う profile を確認
cat ai-check-template/package-templates/profiles/react-nextjs/README.md

# 4. 必要なファイルを自プロジェクトにコピー
cp -r ai-check-template/package-templates/scripts ./scripts
cp -r ai-check-template/package-templates/.claude ./.claude
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check.yml .github/workflows/
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check-fast.yml .github/workflows/
# 任意: Review gate 用 manual-copy templates
cp ai-check-template/package-templates/.github/PULL_REQUEST_TEMPLATE.md .github/
cp -r ai-check-template/package-templates/worksheet ./worksheet
# clone 済み source CLI で導入する場合: node ai-check-template/bin/ai-check-template.mjs init --target . --review-templates --yes
# reusable workflow 方式にしたい場合は ai-quality-reusable.yml + ai-quality-call.yml をコピー
# hosted reusable workflow / Composite Action は docs/github-actions.md を参照

# 5. scripts fragment を package.json にマージ
cat ai-check-template/package-templates/package.scripts.fragment.json
# 出力の "ai:check" / "ai:check:fast" を自プロジェクトの package.json の scripts に追加

# 6. ループを回す
pnpm ai:check
pnpm ai:check:secure
```

実行できる Before / After の例は [`examples/nextjs-basic`](./examples/nextjs-basic/) を参照。自分のタスクを実装前に整理する場合は [`test-design-template.md`](./package-templates/docs/test-design-template.md) から始め、`ai:check` や CI の diagnostic が失敗したら [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) を使います。人間の受け入れ前には [reviewability PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md) と [AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md) を使います。

詳細は [`docs/roadmap.md`](./docs/roadmap.md) と各 profile の README（[`package-templates/profiles/`](./package-templates/profiles/)）を参照。

## Supported profiles / 対応プロファイル

| Profile | 対象スタック | 注意点 |
|---|---|---|
| [`react-nextjs`](./package-templates/profiles/react-nextjs/) | Next.js App Router + TypeScript | フル toolchain（RD / Knip / Playwright / Semgrep） |
| [`react-vanilla`](./package-templates/profiles/react-vanilla/) | 純 React + TypeScript（Vite / CRA） | Next.js 固有の React Doctor 診断は対象外 |
| [`expo-rn`](./package-templates/profiles/expo-rn/) | Expo / React Native | React Doctor は RN 診断に対応。E2E は Maestro / Detox |
| [`node-cli`](./package-templates/profiles/node-cli/) | Node CLI / Library | UI / E2E なし、Static + Unit 中心 |
| [`supabase-rls`](./package-templates/profiles/supabase-rls/) | Supabase + RLS（addon） | 他 profile と組み合わせ（例: `react-nextjs+supabase-rls`） |

## Roadmap

| バージョン | テーマ | 状態 |
|---|---|---|
| **v0.1.0** | 手動コピーで使うテンプレ集 | Released（[notes](./docs/releases/v0.1.0.md)） |
| **v0.2.0** | CLI scaffolding（`npx ai-check-template init`） | Released（[notes](./docs/releases/v0.2.0.md)、[alpha notes](./docs/releases/v0.2.0-alpha.0.md)、[CLI docs](./docs/cli.md)） |
| **v0.3.0** | Hosted reusable workflow + Composite Action（[GitHub Actions guide](./docs/github-actions.md)）、GitHub Marketplace は後続 | Released（[notes](./docs/releases/v0.3.0.md)） |

詳細: [`docs/roadmap.md`](./docs/roadmap.md)。

## Contributing / 貢献

貢献を歓迎します。PR フロー / レーン選択は [`CONTRIBUTING.md`](./CONTRIBUTING.md)、コミュニティ規範は [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)、脆弱性報告は [`SECURITY.md`](./SECURITY.md) を参照。

Issue / PR テンプレートは [`.github/`](./.github/) 配下。

## License

[Apache-2.0](./LICENSE)

---

> 本リポ自身も [SAGE Development System](https://github.com/heidayo/sage-ai-template)（Spec → Plan → Task → Execute → Verify）で開発しています。利用者は SAGE インストール不要（テンプレを使う側は SAGE 非依存）。SAGE 共存は opt-in。詳細は [`CONTRIBUTING.md`](./CONTRIBUTING.md) を参照。
