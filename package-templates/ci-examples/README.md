# CI Examples

`package-templates` から配布する CI 統合の **example**。本パッケージは特定の CI ツールに縛られないため、各 CI 環境向けの YAML / 設定ファイルを「例」として提供し、利用者は自プロジェクトの CI に合わせてカスタマイズする。

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## ディレクトリ構成

```
ci-examples/
├── README.md                   # このファイル
└── github-actions/
    ├── ai-check.yml            # full check（push / PR 全体）
    └── ai-check-fast.yml       # fast check（PR のみ、軽量）
```

将来の追加候補（別 SPEC で対応）:
- `gitlab-ci/` — GitLab CI 用
- `circleci/` — CircleCI 用
- `bitbucket-pipelines/` — Bitbucket Pipelines 用

GitHub Actions が最初の対象である理由は、Notion Doc #2 の出典 YAML が GitHub Actions であること、および OSS / 個人開発を含む採用率が高いため。

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

`actions/setup-node` の `cache:` キーも対応する PM 名に変更する。

### 2. Node version

デフォルトは `22`。プロジェクトの `.nvmrc` / `engines.node` に合わせて調整。LTS（偶数 major）を推奨。

### 3. 任意ツールの有効化

`pnpm ai:check` の中身（`package.json` scripts）でツールを有効化する。本 YAML 自体は `pnpm ai:check` を呼ぶだけなので、ツール選定は利用者の責任。代表的な構成:

- React / Next.js: TypeScript + ESLint(oxlint) + React Doctor + Knip + Playwright + Semgrep
- Node CLI: TypeScript + ESLint + Vitest + Knip + Semgrep
- Pure React: TypeScript + ESLint + React Doctor + Knip + Playwright

### 4. timeout 調整

- `ai-check.yml`: default 30 分。E2E が長い場合は伸ばす
- `ai-check-fast.yml`: default 10 分。fast の意義を保つため上げない（上げる場合はそもそも fast でない）

### 5. third-party action の version pin

セキュリティ要件が厳しい組織では、major version pin（`@v5`）ではなく SHA pin（`@<commit-sha>`）に変更する。Dependabot 等で自動更新する運用が必要。

## なぜ「example」扱いか

CI ツールごとに syntax が異なるため、本パッケージは **CI 統合を強制しない**。各 CI 向けの YAML / 設定は「出発点としての example」と位置付け、利用者は自プロジェクトの CI に合わせてカスタマイズする。

これは本パッケージの**汎用ファースト原則**に基づく。特定 CI（GitHub Actions 等）に強く依存した設計を全利用者に強制せず、思想（形名参同 / 責務分割 / ハイブリッドループ）の方を共有する。

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）の「## CIに入れるなら」節
- 一次資料: GitHub Actions 公式 docs（actions/checkout, actions/setup-node, pnpm/action-setup 等）
