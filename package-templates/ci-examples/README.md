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

セキュリティ要件が厳しい組織では、major version pin（`@v5`）ではなく SHA pin（`@<40 桁 commit SHA> # v5`）に変更する。tag は可変で同一 tag が別 commit を指しうるため、SHA pin で内容を固定するのが supply-chain 対策の標準手法。既定のテンプレは major pin のままで、SHA pin は opt-in（強制しない）。

具体手順（SHA の調べ方 `gh api` / UI、`# vX` コメント併記、Dependabot での自動更新、`@v0.3.0` タグ pin との違い）は [`../../docs/github-actions.md`](../../docs/github-actions.md) の「SHA-pinning third-party actions」節を参照。

テンプレ内で使う third-party action の一覧（SHA pin 対象）:

| Action | 使用箇所 |
|---|---|
| `actions/checkout` | 全テンプレ |
| `actions/setup-node` | 全テンプレ |
| `pnpm/action-setup` | pnpm setup |
| `oven-sh/setup-bun` | bun setup |
| `actions/upload-artifact` | Playwright / diagnostic artifact |
| `github/codeql-action` | SARIF opt-in（`upload-sarif`） |

### 8. monorepo（paths filter / matrix / workspace）

direct workflow（`ai-check.yml` / `ai-check-fast.yml`）には monorepo 向けの **opt-in コメント雛形**が入っている。既定はリポジトリ全体で起動し、雛形をコメント解除すると対象を絞ったり複数構成に展開できる。

- **paths filter**: 変更パッケージのみで起動する。SPEC-0061 の `--workspace <pkg-dir>` で絞った対象ディレクトリを glob（例: `packages/app/**`）に指定する。`ai-check.yml` / `ai-check-fast.yml` の両方に雛形あり
  - 注意: paths filter で全 job がスキップされる PR があると、その job を required status check にしている場合に never-run で pending のままマージがブロックされる。回避策（常に成功する fallback job を required に指定する等）は雛形コメントと docs に記載
- **matrix**: 複数 Node バージョン（`matrix.node: [20, 22]` → `node-version`）や複数 workspace（`matrix.workspace: [...]` → `working-directory`）を 1 job で回す。`ai-check.yml` のみに雛形あり（fast は軽量性を保つため無し）
- **reusable workflow**: `ai-quality-reusable.yml` の `working-directory` input（§3 の inputs 表参照）で workspace ディレクトリを指定できる。複数 workspace の fan-out は caller 側の matrix で書く

詳細な有効化手順は [`../../docs/github-actions.md`](../../docs/github-actions.md) の「Monorepo: paths filter, matrix, and workspaces」節を参照。

### 9. Semgrep SARIF opt-in（Code Scanning 連携）

`ai-check.yml` には Semgrep の finding を GitHub Code Scanning（Security タブ）に載せる **opt-in コメント雛形**が入っている。既定は無効で、コメント解除で有効化する。`ai-check-fast.yml` には入れていない（fast の軽量性を保つため）。

- SARIF upload には `security-events: write` permission が必須（付与漏れで 403 fail）。SARIF を使う場合のみ追加し、それ以外は既定の `contents: read` のまま（least-privilege）
- 雛形は package script（`security:sast` = `semgrep scan --config auto`）を変えず、CI 側で `semgrep scan --sarif --output` を走らせる別経路
- 有効化手順・permission の詳細・secret を SARIF に載せない注意は [`../../docs/github-actions.md`](../../docs/github-actions.md) の「Semgrep SARIF opt-in」節を参照

## update 時の挙動（CI テンプレへのコメント雛形追加について）

本更新で CI テンプレ（`ai-check.yml` / `ai-check-fast.yml`）に上記の opt-in コメント雛形が追加された。既存利用者の `update` は次のように分岐する（CI テンプレは managed file のため）:

- **未改変の利用者**: `update` で新テンプレに自動追従する。差分はコメント雛形が増えるだけで、active な CI 挙動（トリガー・job・実行コマンド）は変わらない
- **改変済みの利用者**: `update` は `skip-modified` となり既存の改変が保護される。新しいコメント雛形を取り込みたい場合は `--diff` で確認して手動反映するか、`--force-managed`（`.bak-<version>` を残してから上書き）で明示的に upstream 化する

## なぜ「example」扱いか

CI ツールごとに syntax が異なるため、本パッケージは **CI 統合を強制しない**。各 CI 向けの YAML / 設定は「出発点としての example」と位置付け、利用者は自プロジェクトの CI に合わせてカスタマイズする。

これは本パッケージの**汎用ファースト原則**に基づく。特定 CI（GitHub Actions 等）に強く依存した設計を全利用者に強制せず、思想（形名参同 / 責務分割 / ハイブリッドループ）の方を共有する。

hosted reusable workflow / Composite Action は、この copy examples とは別の hosted contract。Marketplace listing は後続で、`@v0.3.0` exact pin を前提にした released foundation として扱う。

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）の「## CIに入れるなら」節
- 一次資料: GitHub Actions 公式 docs（actions/checkout, actions/setup-node, pnpm/action-setup 等）
