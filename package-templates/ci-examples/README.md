# CI Examples

`package-templates` から配布する CI 統合の **copy examples**。本パッケージは特定の CI ツールに縛られないため、各 CI 環境向けの YAML / 設定ファイルを「例」として提供し、利用者は自プロジェクトの CI に合わせてカスタマイズする。

> **ステータス**: v0.1 template set。v0.3.0 Released では repository root に hosted reusable workflow / Composite Action も追加済み。使い分けは [`../../docs/github-actions.md`](../../docs/github-actions.md) を参照。

## ディレクトリ構成

```
ci-examples/
├── README.md                   # このファイル
└── github-actions/
    ├── ai-check.yml            # direct workflow: full check（push / PR 全体）
    ├── ai-check-fast.yml       # direct workflow: fast check（PR のみ、軽量）
    ├── ai-quality-reusable.yml # reusable workflow 本体
    └── ai-quality-call.yml     # reusable workflow を呼ぶ caller
```

将来の追加候補（別 SPEC で対応）:
- `gitlab-ci/` — GitLab CI 用
- `circleci/` — CircleCI 用
- `bitbucket-pipelines/` — Bitbucket Pipelines 用

GitHub Actions が最初の対象である理由は、OSS / 個人開発を含む採用率が高く、PR Gate として導入しやすいため。

## どれを使うか

| 方式 | ファイル | 向いているケース |
|---|---|---|
| Direct full | `github-actions/ai-check.yml` | まず 1 つの workflow で `pnpm ai:check` を走らせたい |
| Direct fast | `github-actions/ai-check-fast.yml` | PR push ごとに軽量な `pnpm ai:check:fast` を走らせたい |
| Reusable | `github-actions/ai-quality-reusable.yml` + `ai-quality-call.yml` | install / check の共通ロジックを 1 か所に寄せたい |
| Hosted reusable workflow | `heidayo/ai-check-template/.github/workflows/ai-quality.yml@v0.3.0` | release tag に pin して、このリポ側の workflow contract を使いたい |
| Composite Action | `heidayo/ai-check-template/ai-quality@v0.3.0` | 自リポの workflow は維持しつつ setup / install / check steps を再利用したい |

最初の導入は direct workflow の copy examples が簡単。複数 workflow や複数リポで同じ品質ゲートを共有したくなったら reusable workflow に移行する。release tag に pin できる段階では hosted reusable workflow または Composite Action も選択肢になる。

## 思想

本パッケージの設計思想に基づく **AI 内部ループ（fast）+ PR Gate（full）のハイブリッド**構成。

```
[ローカル開発]                       [CI]
Claude Code Edit hook ─→ ai:check:fast ─→ ai-check-fast.yml (PR)
                            (Static + Unit)
                                ↓
                          AI 修正ループ
                                ↓
              人間が PR push
                                ↓
                          ai:check (full) ─→ ai-check.yml (PR + push main)
                            (+ Diagnostic + E2E)
```

- **fast** = Static + Unit のみ。AI の Edit ごとに走る軽量チェック
- **full** = fast + Diagnostic（React Doctor / Knip / Semgrep 等）+ E2E。PR / merge 時の重い検証

詳細な思想は以下を参照:
- [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) — 形名参同（事前宣言「名」と実測「形」の照合）
- [`../docs/philosophy/test-pyramid.md`](../docs/philosophy/test-pyramid.md) — Static / Unit / Integration / E2E / DB-RLS / Monitoring の責務分割

## カスタマイズ指針

各 YAML 内のコメントに従って以下を調整する。

### 1. パッケージマネージャ

デフォルトは `pnpm`。他の PM を使う場合は `pnpm/action-setup` を差し替え:

| PM | setup action | install command |
|---|---|---|
| pnpm | `pnpm/action-setup@v4` | `pnpm install --frozen-lockfile` |
| npm | （不要） | `npm ci` |
| yarn | （Node 24+ では Corepack） | `yarn install --frozen-lockfile` |
| bun | `oven-sh/setup-bun@v2` | `bun install --frozen-lockfile` |

`actions/setup-node` の `cache:` キーも対応する PM 名に変更する。Reusable workflow を使う場合は `package-manager` input を変更する。

### 2. Node version

デフォルトは `22`。プロジェクトの `.nvmrc` / `engines.node` に合わせて調整。LTS（偶数 major）を推奨。

### 3. reusable workflow inputs

`ai-quality-reusable.yml` は以下の inputs を持つ:

| input | default | 用途 |
|---|---|---|
| `package-manager` | `pnpm` | `pnpm`, `npm`, `yarn`, `bun` の install path を選ぶ |
| `node-version` | `22` | npm / pnpm / yarn 用 Node.js version |
| `install-command` | 空 | 独自 install command を指定。空なら PM ごとの default を使う |
| `check-command` | `pnpm ai:check` | 実行する品質ゲート |
| `working-directory` | `.` | monorepo などでコマンドを実行するディレクトリ |
| `timeout-minutes` | `30` | job timeout |
| `upload-ai-check-artifacts` | `false` | `.ai-check/` を artifact upload するか |

例:

```yaml
jobs:
  ai-quality:
    uses: ./.github/workflows/ai-quality-reusable.yml
    with:
      package-manager: pnpm
      node-version: "22"
      check-command: pnpm ai:check
```

### 4. 任意ツールの有効化

`pnpm ai:check` の中身（`package.json` scripts）でツールを有効化する。本 YAML 自体は `pnpm ai:check` を呼ぶだけなので、ツール選定は利用者の責任。代表的な構成:

- React / Next.js: TypeScript + ESLint(oxlint) + React Doctor + Knip + Playwright + Semgrep
- Node CLI: TypeScript + ESLint + Vitest + Knip + Semgrep
- Pure React: TypeScript + ESLint + React Doctor + Knip + Playwright

### 5. timeout 調整

- `ai-check.yml`: default 30 分。E2E が長い場合は伸ばす
- `ai-check-fast.yml`: default 10 分。fast の意義を保つため上げない（上げる場合はそもそも fast でない）
- `ai-quality-reusable.yml`: caller 側の `timeout-minutes` input で調整

### 6. Playwright artifact

`ai:check` が Playwright を実行する場合は、CI で browser install と artifact upload を有効化する。

- browser install: `pnpm exec playwright install --with-deps chromium`
- artifacts: `playwright-report/`、`test-results/`、`trace.zip`
- prompt: [`../prompts/e2e-test-creation.md`](../prompts/e2e-test-creation.md)
- templates: [`../playwright/README.md`](../playwright/README.md)

trace / screenshot / video に private value が入る可能性がある場合は、retention days や upload 条件を project policy に合わせて調整する。

### 7. third-party action の version pin

セキュリティ要件が厳しい組織では、major version pin（`@v5`）ではなく SHA pin（`@<commit-sha>`）に変更する。Dependabot 等で自動更新する運用が必要。

## なぜ「example」扱いか

CI ツールごとに syntax が異なるため、本パッケージは **CI 統合を強制しない**。各 CI 向けの YAML / 設定は「出発点としての example」と位置付け、利用者は自プロジェクトの CI に合わせてカスタマイズする。

これは本パッケージの**汎用ファースト原則**に基づく。特定 CI（GitHub Actions 等）に強く依存した設計を全利用者に強制せず、思想（形名参同 / 責務分割 / ハイブリッドループ）の方を共有する。

hosted reusable workflow / Composite Action は、この copy examples とは別の hosted contract。Marketplace listing は後続で、`@v0.3.0` exact pin を前提にした released foundation として扱う。

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）の「## CIに入れるなら」節
- 一次資料: GitHub Actions 公式 docs（actions/checkout, actions/setup-node, pnpm/action-setup 等）
