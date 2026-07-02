# ai-check-template

**AI が生成したコードを、そのまま信じない。**

`ai-check-template` は、AI が書いたコードを**検証・修正・安全にマージする**ためのテンプレート集です。

一言でいうと、**AI コーディング後の品質保証テンプレート**です。利用者は SAGE インストール不要で、既存プロジェクトに CLI または手動コピーで導入できます。

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
- `ai-check-template run` による **PASS / FAIL / SKIPPED + timing + redacted output** の構造化 evidence
- AC / Test Matrix を JSON / YAML で固定する **structured test design template**
- secret scan / dependency audit / supply-chain / Semgrep を分離する **`ai:check:secure` security gate**
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
| **テスト設計** | [`test-design-template.md`](./package-templates/docs/test-design-template.md) は要件を AC / Test Matrix / 検証コマンドへ落とすテンプレート。[`ac-test-matrix.schema.json`](./package-templates/docs/ac-test-matrix.schema.json)、JSON / YAML example、`ai-check-template expect` で機械可読化できる |
| **AI プロンプト雛形** | `decision-table` / `state-transition` / `boundary-value` / `rls-permission` / `plan-first` / [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) |
| **Reviewability** | [PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md)、[AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md)、[design explanation](./package-templates/prompts/design-explanation.md)、[tradeoff analysis](./package-templates/prompts/tradeoff-analysis.md)、[self-understanding check](./package-templates/prompts/self-understanding-check.md)、[review training](./package-templates/prompts/review-training.md) |
| **実行スタック** | `scripts/ai-check.sh`、`scripts/ai-check-fast.sh`、`scripts/ai-check-secure.sh`、`.claude/settings.hook-fragment.json`、`.claude/rules/test-rules.md`、`package.scripts.fragment.json` |
| **CI 統合** | GitHub Actions `ai-check.yml`（フル）、`ai-check-fast.yml`（PR の fast ループ）、reusable workflow examples、hosted workflow / Composite Action guide の [`docs/github-actions.md`](./docs/github-actions.md) |
| **Examples** | [`examples/nextjs-basic`](./examples/nextjs-basic/) は AI 生成コードの Before / After を示す runnable example |
| **プロファイル** | `react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli` / `supabase-rls` |
| **CLI** | [`docs/cli.md`](./docs/cli.md) は `ai-check-template` CLI、`init` / `doctor` / `update` / repository-current の `run` / `expect`、install state（`.ai-check-template.json`）、profile-aware package script migrations、profile docs migration、support script defaults、package manager detection、Claude hook / review template / CI workflow command rendering、optional `--install-deps`、exact-managed workflow cleanup、diagnostics warnings、`doctor --strict`、`--dry-run`、`--overwrite` を説明 |
| **プロジェクト docs** | [`docs/usage-model.md`](./docs/usage-model.md)、[`docs/vision.md`](./docs/vision.md)、[`docs/roadmap.md`](./docs/roadmap.md)、Phase 1 dogfooding プロトコル、[`初回 dogfooding report`](./docs/phase-1-initial-dogfooding-report.md) |

## Where This Fits / どこに効くか

`ai-check-template` は post-implementation verification stack です。AI にコードを書かせるためのものではなく、AI が生成したコードを実装後に検証・修正・安全に受け入れるための基盤です。

使いどころは 5 つです。AI 編集直後の **Local loop**、診断結果から修正する **Repair loop**、重要導線を守る **E2E loop**、PR で同じ検証を強制する **CI gate**、設計・リスク・追加テスト・理解度を人間が受け入れる **Review gate**。Review gate は CLI の `--review-templates` で導入するか、[`package-templates/.github/`](./package-templates/.github/) と [`package-templates/worksheet/`](./package-templates/worksheet/) から手動コピーできます。初見では [`docs/usage-model.md`](./docs/usage-model.md) の1枚絵と [`package-templates/prompts/README.md`](./package-templates/prompts/README.md) の prompt flow から見るのが最短です。

Security check は意図的に分離しています。`ai:check` は機能品質、`ai:check:secure` は secret scan / dependency audit / supply-chain check / Semgrep SAST の security evidence として扱います。

## Quick start / 最短手順

まずは既存プロジェクトの root で dry-run します。ファイルは書き換えません。

```bash
npx -y ai-check-template init --target . --profile react-nextjs --dry-run
```

問題なければ `--yes` を付けて適用し、`doctor` で導入状態を確認します。

```bash
npx -y ai-check-template init --target . --profile react-nextjs --yes
npx -y ai-check-template doctor --target .
npx -y ai-check-template update --target . --dry-run
```

`update` は各 managed ファイルを「インストール時の baseline hash / ローカル内容 / 最新テンプレート」の 3-way で判定します。未改変ファイルだけを更新し、ローカルで改変したファイルはデフォルトで保持します（`skip-modified`）。差分の確認は `--diff`、テンプレートでの上書きは `--force-managed`（上書き前に `<file>.bak-<version>` バックアップを作成。`.gitignore` への `*.bak-*` 追加を推奨）。復元は `.bak-<version>` ファイルを元のパスに戻すだけです。以前の「常に上書き」挙動が必要な場合は `npx -y ai-check-template@0.4.0` のように前バージョンに pin 留めしてください。詳細は [`docs/cli.md`](./docs/cli.md)。

導入後は target project 側の script を走らせます。

```bash
pnpm ai:check
pnpm ai:check:secure
npx -y ai-check-template run --target . --script ai:check --json
npx -y ai-check-template expect --file docs/ai-check-template/docs/ac-test-matrix.example.json --json
```

`run` / `expect` は repository-current CLI の追加機能です。次回 npm publish 前に試す場合は、この repository の checkout か `npm pack` した tarball から実行してください。

Next.js 以外は `--profile node-cli`、`--profile react-vanilla`、`--profile expo-rn`、`--profile react-nextjs+supabase-rls` などに変えます。詳しい option は [`docs/cli.md`](./docs/cli.md)、運用モデルは [`docs/usage-model.md`](./docs/usage-model.md) を参照。

## Other install paths / 他の導入方法

CLI で preview だけしたい場合:

```bash
npx -y ai-check-template init --target . --profile node-cli --package-manager npm --ci none --dry-run
npx -y ai-check-template doctor --target . --ci none
npx -y ai-check-template update --target . --dry-run
```

手動コピーで中身を確認したい場合:

```bash
git clone https://github.com/heidayo/ai-check-template.git
cat ai-check-template/package-templates/profiles/react-nextjs/README.md
cp -r ai-check-template/package-templates/scripts ./scripts
cp -r ai-check-template/package-templates/.claude ./.claude
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check.yml .github/workflows/
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check-fast.yml .github/workflows/
cp ai-check-template/package-templates/.github/PULL_REQUEST_TEMPLATE.md .github/
cp -r ai-check-template/package-templates/worksheet ./worksheet
cat ai-check-template/package-templates/package.scripts.fragment.json
```

Review gate は CLI の `--review-templates` で導入するか、[reviewability PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md) と [AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md) を手動コピーできます。hosted reusable workflow / Composite Action は [`docs/github-actions.md`](./docs/github-actions.md) を参照。

実行できる Before / After の例は [`examples/nextjs-basic`](./examples/nextjs-basic/) を参照。自分のタスクを実装前に整理する場合は [`test-design-template.md`](./package-templates/docs/test-design-template.md) から始め、`ai:check` や CI の diagnostic が失敗したら [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) を使います。

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

Release 表記の意味: v0.1.0 は manual template release、v0.2.0 は初回 npm stable CLI package、v0.3.0 は GitHub Actions integration foundation、v0.4.0 は現在の npm stable CLI package `ai-check-template@0.4.0` です。今後の publish 前も repository validation で `npm pack` readiness check と `npm publish --dry-run --tag latest` preflight を実行します。

| バージョン | テーマ | 状態 |
|---|---|---|
| **v0.1.0** | 手動コピーで使うテンプレ集 | Released（[notes](./docs/releases/v0.1.0.md)） |
| **v0.2.0** | CLI scaffolding（`npx ai-check-template init`） | Released（[notes](./docs/releases/v0.2.0.md)、[alpha notes](./docs/releases/v0.2.0-alpha.0.md)、[CLI docs](./docs/cli.md)） |
| **v0.3.0** | Hosted reusable workflow + Composite Action（[GitHub Actions guide](./docs/github-actions.md)）、GitHub Marketplace は後続 | Released（[notes](./docs/releases/v0.3.0.md)） |
| **v0.4.0** | Structured CLI evidence（`run` / `expect`）+ security gate expansion | Released（[notes](./docs/releases/v0.4.0.md)） |

詳細: [`docs/roadmap.md`](./docs/roadmap.md)。

## Contributing / 貢献

貢献を歓迎します。PR フロー / レーン選択は [`CONTRIBUTING.md`](./CONTRIBUTING.md)、コミュニティ規範は [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)、脆弱性報告は [`SECURITY.md`](./SECURITY.md) を参照。

Issue / PR テンプレートは [`.github/`](./.github/) 配下。

## License

[Apache-2.0](./LICENSE)

---

> 本リポ自身も [SAGE Development System](https://github.com/heidayo/sage-ai-template)（Spec → Plan → Task → Execute → Verify）で開発しています。利用者は SAGE インストール不要（テンプレを使う側は SAGE 非依存）。SAGE 共存は opt-in。詳細は [`CONTRIBUTING.md`](./CONTRIBUTING.md) を参照。
