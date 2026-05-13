# ai-check-template プロジェクトルール

このファイルは本リポ固有のルール。SAGE 標準ルール（`specs-rules.md`, `plans-rules.md`, `tasks-rules.md`, `src-rules.md`, `sage-governance-rules.md`）は SAGE が管理するので編集しない。

## リポジトリの目的

AI 駆動開発のための **テストフローテンプレート** と **テスト設計思想** を npm パッケージとして配布する。gakuten など特定プロジェクト固有のテストフローを設計するのではなく、**AI 開発全般で再利用可能な汎用パッケージ** を作る。

## 配布物と SAGE 内部物の分離（最重要）

| 区分 | 場所 | 扱い |
|---|---|---|
| **配布物**（コミット、npm publish 対象） | `package-templates/`, `bin/`, `src/`, `tests/`, `README.md`, `LICENSE`, `CLAUDE.md`, `package.json` | git で管理 |
| **SAGE 内部物**（local-only） | `.sage/`, `sage/`, `scripts/sage-*.sh`, `specs/_template.md`, `plans/_template.md`, `tasks/_template.md`, `templates/hooks/`, `templates/sage/`, `templates/settings/`, `.claude/rules/*-rules.md`, `.claude/skills/sage-*/`, `docs/claude-collaboration-brief.md`, `docs/codex-delegation-packet.md`, `AGENTS.md` | `.gitignore` で除外 |
| **作業成果物**（コミット） | `specs/SPEC-XXXX.md`, `plans/PLAN-XXXX.md`, `tasks/TASK-XXXX.md` | git で管理 |

### 命名衝突への注意
- SAGE は `templates/` に hook テンプレート等を置く
- 本リポの配布テンプレートは **必ず `package-templates/` に置く**（`templates/` ではない）
- これにより `npx ai-check-template init` で配布する内容と SAGE 内部物が混ざらない

## 開発フェーズ

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | 思想 + テンプレ骨格設計 | 進行中 |
| 1 | dogfooding（gakuten 等で手動運用） | 未着手 |
| 2 | CLI / npm パッケージ化 | 未着手 |
| 3 | 複数プロジェクト横展開 | 未着手 |

## 主体文書（Notion）— 設計の根拠

本リポの内容は以下 4 文書から抽出する。**gakuten 文脈を取り除き、汎用知見として整理** すること。

1. **テストフロー再設計** — 責務分割（Static / Unit / Integration / E2E / DB-RLS / Monitoring）、Given-When-Then、テスト設計テンプレ、Playwright Locator 優先順位（`getByRole > getByLabel > getByText > getByTestId > locator`）
2. **無料で作る AI エージェント開発診断フロー** — `ai:check` 統合 script、形名参同（事前宣言した成功基準と実測値の照合）、判定基準（React Doctor 75 以上目標 / 50 未満マージ不可、Semgrep High/Critical マージ不可）、AI 内部ループ（Edit=fast / Stop=full ハイブリッド）
3. **AI 駆動開発時代に押さえる QA 技法** — 同値分割、境界値分析、デシジョンテーブル、状態遷移テスト、エラー推測、チェックリスト
4. **Supabase Testing 戦略** — pgTAP（`plan()`/`is()`/`throws_ok()`）、service_role でテストしない、InBucket で Magic Link E2E、CI 統合 YAML

## 設計原則

### 1. 汎用ファースト
gakuten 固有の判断（mobile 除外、全 app 一律、workflow 整理など）は、パッケージのプロファイル / オプションとして抽象化する。

例:
- gakuten「mobile (Expo) は React Doctor 非対応」→ パッケージ「`expo-rn` プロファイルでは React Doctor を含めない / `--exclude-rn` オプション」
- gakuten「全 app 一律で適用」→ パッケージ「monorepo 対応 + glob で対象指定」

### 2. 実証ファースト
抽象論で固めずに、gakuten + 他プロジェクトの dogfooding で検証する。Phase 0 と Phase 1 を行き来して洗練する。

### 3. SAGE 横並びコンパニオン
- パッケージは SAGE 非依存で動作する（SAGE が無くても `npx init` できる）
- SAGE 検出時は `specs/_template.md` に「テスト観点」「DB/RLS 観点」「権限別」セクションを追記する共存モードを提供
- SAGE を置き換えない、競合しない

## 提供するもの（Phase 2 で具体化）

### 思想ドキュメント (`package-templates/docs/`)
- `philosophy/formal-name-match.md` — 形名参同
- `philosophy/test-pyramid.md` — 責務分割
- `philosophy/given-when-then.md` — 受け入れ条件先行
- `philosophy/qa-techniques.md` — 同値分割・境界値・デシジョンテーブル・状態遷移・エラー推測

### テストフローテンプレ (`package-templates/`)
- `scripts/ai-check.sh` / `scripts/ai-check-fast.sh`
- `.claude/settings.hook-fragment.json` — Edit=fast / Stop=full
- `.claude/rules/test-rules.md` — Playwright Locator 優先順位
- `package.scripts.fragment.json` — `ai:check` / `ai:check:fast` の npm script

### CI 統合例 (`package-templates/ci-examples/`)
- `github-actions/ai-check.yml` — full check（push / PR 全体、`pnpm ai:check` を呼ぶ）
- `github-actions/ai-check-fast.yml` — fast check（PR のみ、`pnpm ai:check:fast` を呼ぶ）
- 将来追加: GitLab CI / CircleCI（汎用ファースト原則のため、CI ツールを強制しない）

### プロファイル (`package-templates/profiles/`)
| プロファイル | 想定 |
|---|---|
| `react-nextjs` | Next.js App Router + TypeScript |
| `react-vanilla` | 純 React + TypeScript |
| `expo-rn` | Expo / React Native（React Doctor 非対応） |
| `node-cli` | Node.js CLI |
| `supabase-rls` | Supabase + RLS 観点（pgTAP・InBucket） |

### AI プロンプト雛形 (`package-templates/prompts/`)
- `decision-table.md` — デシジョンテーブル生成プロンプト
- `state-transition.md` — 状態遷移検証プロンプト
- `boundary-value.md` — 同値分割 + 境界値プロンプト
- `rls-permission.md` — RLS 権限テストプロンプト
- `plan-first.md` — Plan 先出しプロンプト（実装前の成功基準定義）

## CLI 仕様（Phase 2 で実装）

```bash
npx ai-check-template@latest init \
  --profile react-nextjs+supabase-rls \
  --hook-mode hybrid \         # Edit=fast / Stop=full
  --with-sage \                # SAGE 検出時に specs テンプレに append
  --rd-fail-on none|warning    # React Doctor 閾値
```

## 言語規約

- ドキュメント（思想・プロンプト雛形・README）: **日本語が原則**
- コード識別子（CLI フラグ、関数名、ファイル名、設定キー）: **英語**
- 配布テンプレート内のコメント: 日本語 OK（利用者向け）

## SAGE との関係

このリポでの開発自体に SAGE を使う（dogfooding）。SAGE の SPEC → PLAN → TASK ルールに従って作業する。ただし配布物は SAGE 非依存。
