# ai-check-template プロジェクトルール

このファイルは本リポ固有のルール。SAGE 標準ルール（`specs-rules.md`, `plans-rules.md`, `tasks-rules.md`, `src-rules.md`, `sage-governance-rules.md`）は SAGE が管理するので編集しない。

## リポジトリの目的

AI 駆動開発のための **テストフローテンプレート** と **テスト設計思想** を npm パッケージとして配布する。gakuten など特定プロジェクト固有のテストフローを設計するのではなく、**AI 開発全般で再利用可能な汎用パッケージ** を作る。

## 配布物と SAGE 内部物の分離（最重要）

| 区分 | 場所 | 扱い |
|---|---|---|
| **配布物**（npm publish 対象） | `package.json` の `files` フィールドを一次情報源とする。本ファイルでは固定リストを持たない（更新漏れで実態と乖離するため）。`CLAUDE.md` / `tests/` は内部開発用で含めない | git で管理（一部のみ npm 同梱） |
| **SAGE 内部物**（local-only） | `.sage/`, `sage/`, `scripts/sage-*.sh`, `specs/_template.md`, `plans/_template.md`, `tasks/_template.md`, `templates/hooks/`, `templates/sage/`, `templates/settings/`, `.claude/rules/*-rules.md`, `.claude/skills/sage-*/`, `docs/claude-collaboration-brief.md`, `docs/codex-delegation-packet.md`, `AGENTS.md` | `.gitignore` で除外 |
| **作業成果物**（コミット） | `specs/SPEC-XXXX.md`, `plans/PLAN-XXXX.md`, `tasks/TASK-XXXX.md` | git で管理 |

### 命名衝突への注意
- SAGE は `templates/` に hook テンプレート等を置く
- 本リポの配布テンプレートは **必ず `package-templates/` に置く**（`templates/` ではない）
- これにより `npx ai-check-template init` で配布する内容と SAGE 内部物が混ざらない

## リリース状況

リリース状況と各バージョンのスコープは [`docs/roadmap.md`](../../docs/roadmap.md) を一次情報源とする。本ファイルでは固定の Phase 表を持たない（過去に未着手のままの記述が残り続けて roadmap と乖離したため、参照型に切り替えた）。

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
抽象論で固めずに、gakuten + 他プロジェクトの dogfooding で検証する。設計と dogfooding を行き来して洗練する。

### 3. SAGE 横並びコンパニオン
- パッケージは SAGE 非依存で動作する（SAGE が無くても `npx init` できる）
- SAGE 検出時は `specs/_template.md` に「テスト観点」「DB/RLS 観点」「権限別」セクションを追記する共存モードを提供
- SAGE を置き換えない、競合しない

## 配布物の構成（概観）

配布物の master 一覧と詳細は次の一次情報源に集約する。本ファイルでは固定のファイル列挙を持たない（更新漏れで実体と乖離するため）。

- リリース別スコープ: [`docs/roadmap.md`](../../docs/roadmap.md)
- CLI surface（`init` / `doctor` / `update` と option / state file）: [`docs/cli.md`](../../docs/cli.md)
- profile 別の詳細: [`package-templates/profiles/`](../../package-templates/profiles/)
- 配布される `.claude/` の中身と使い方: [`package-templates/.claude/README.md`](../../package-templates/.claude/README.md)
- philosophy / prompts / scripts / CI examples: [`package-templates/`](../../package-templates/) 配下を参照

本リポ開発の意思決定で「現在の配布物に何が含まれるか」を確認したい場合は、上記 docs を見る。本ファイルを fixed-list として更新しない。

## 言語規約

- ドキュメント（思想・プロンプト雛形・README）: **日本語が原則**
- コード識別子（CLI フラグ、関数名、ファイル名、設定キー）: **英語**
- 配布テンプレート内のコメント: 日本語 OK（利用者向け）

## SAGE との関係

- **利用者は SAGE 不要**。`ai-check-template` を配布物として利用する側のプロジェクトでは SAGE のインストール・SPEC/PLAN/TASK 運用は不要。CLI（`npx -y ai-check-template init`）または手動コピーのみで完結する（[`README.md`](../../README.md) / [`docs/cli.md`](../../docs/cli.md)）。
- 本リポ内部の開発のみ SAGE を使う（dogfooding）。SPEC → PLAN → TASK ルールに従って作業する。
- 配布物（`package-templates/`）は SAGE 非依存で動作するよう保つ。`package-templates/.claude/` の hook / rule にも SAGE 前提の文言を含めない。
- SAGE 検出時は `specs/_template.md` に「テスト観点」「DB/RLS 観点」「権限別」セクションを追記する共存モードを提供する。SAGE を置き換えない、競合しない。
