# SPEC-0042: Playwright Stabilization Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0042 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0038, SPEC-0039, SPEC-0040 |
| 権限レベル | platform |

## 背景・目的

AI 駆動開発では実装速度に比べて E2E の安定化、失敗証跡の回収、テスト生成時の locator 品質の維持がボトルネックになる。既存の `react-nextjs` profile は Playwright を前提にしているが、利用者がコピーできる安定化 config、smoke test の最小例、E2E 作成プロンプト、CI artifact 指針がまだ不足している。

この SPEC では、Playwright を「AI が作った画面を確認する重いゲート」ではなく、「主要導線を限定して安定に守る E2E loop」として導入できるテンプレートを追加する。

## 対象ユーザー

- Next.js / React プロジェクトに `ai-check-template` を導入する開発者
- AI 生成 UI の主要導線だけを Playwright で守りたいチーム
- CI 上で Playwright trace / report / test-results を回収し、AI 修復ループに渡したい maintainer

## スコープ（含む）

- `package-templates/playwright/` に manual-copy 用の README、`playwright.config.ts`、smoke spec 例を追加する
- `package-templates/prompts/e2e-test-creation.md` を追加し、自然言語仕様から安定した Playwright test を作る手順を明文化する
- prompt catalog / React Next.js profile / CI examples / usage model に Playwright stabilization の導線を追加する
- package validation に新規テンプレートの存在・pack inclusion・重要文言チェックを追加する

## スコープ外（明示的に除外）

- CLI `init` / `update` が Playwright config を自動コピーする機能は追加しない
- root `.claude/` や `package-templates/.claude/` の Claude Code 専用 rule は変更しない
- Playwright Test Agents / MCP の実行統合は行わない
- Chromatic / Checkly / visual regression / synthetic monitoring の実装例は追加しない
- 実プロジェクト固有のログイン認証情報や storageState ファイルは含めない

## 要件

### 機能要件
- [FR-01] Next.js / React 向け Playwright config 例は `baseURL`、`webServer`、`trace: "on-first-retry"`、CI retry、reporter、artifact-friendly output を含む
- [FR-02] smoke spec 例は `getByRole` を優先し、`@smoke` grep 対象になる
- [FR-03] E2E 作成プロンプトは自然言語仕様、AC、対象導線、locator 優先順位、禁止事項、出力形式を含む
- [FR-04] CI example は Playwright report / test-results / traces を失敗時にも回収できる指針を含む
- [FR-05] React Next.js profile から Playwright templates と prompt へ導線がある

### 非機能要件
- [NFR-01] 汎用性: 特定プロジェクトの固有語を追加しない
- [NFR-02] 安定性: セレクタは user-facing locator 優先とし、CSS / XPath 依存を最後の手段に限定する
- [NFR-03] 導入容易性: CLI 自動コピーではなく manual-copy template として導入できる
- [NFR-04] トークン効率: MCP / UI exploration と CI CLI execution の役割分担を明記する

### セキュリティ要件
- [SEC-01] template / prompt / docs に secret、実 credential、個人情報、token-like value を含めない
- [SEC-02] storageState は生成物として扱い、template には実セッション情報を含めない
- [SEC-03] CI artifact 指針では secret を含む trace の取り扱いに注意を促す

### 運用要件
- [OPS-01] `make validate` で構造検証・CLI test・pack dry-run が通る
- [OPS-02] `git diff --check` で whitespace error がない
- [OPS-03] SAGE status と TASK status を実装完了時に更新する

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `package-templates/playwright/README.md`、`package-templates/playwright/playwright.config.ts`、`package-templates/playwright/tests/smoke.spec.ts` が存在する
- [x] AC-02: `package-templates/prompts/e2e-test-creation.md` が存在し、`getByRole > getByLabel > getByText > getByTestId > CSS/XPath` の locator 優先順位を含む
- [x] AC-03: `package-templates/ci-examples/github-actions/ai-check.yml` に Playwright artifact upload guidance が含まれる
- [x] AC-04: `package-templates/profiles/react-nextjs/README.md` と `docs/usage-model.md` から Playwright stabilization templates へ導線がある
- [x] AC-05: `package-templates/prompts/README.md` に `e2e-test-creation.md` が catalog 登録される
- [x] AC-06: `tests/cli/package.test.mjs` が pack dry-run に新規 Playwright template と prompt の inclusion を要求する
- [x] AC-07: `make validate` が pass する
- [x] AC-08: `bash scripts/sage-validate.sh` が pass する
- [x] AC-09: `git diff --check` が pass する
- [x] AC-10: 外部向け変更ファイルに特定プロジェクト固有語が含まれない
- [x] AC-11: 変更ファイルに secret-like assignment pattern が含まれない

## 異常系

- Playwright が未導入のプロジェクト: templates は manual-copy なので CLI `init` の既存挙動を壊さない
- 認証が必要な E2E: config は storageState の場所だけ示し、実 credential は含めない
- CI artifact に機密情報が混ざる可能性: README / workflow comment で trace upload 前の注意を明記する
- CSS / XPath に依存した flaky test: prompt と README で locator 優先順位を固定する

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI contract: `init` / `update` の引数・出力は変更しない
- Package contract: `package-templates/` 配下の新規 manual-copy template は npm package に含まれる

## リスク

- リスク1: Playwright config 例がすべての Next.js 構成に合わない → 軽減策: manual-copy template として、port / command / baseURL を変更する前提を README に明記
- リスク2: artifact upload が trace 内の secret を残す可能性 → 軽減策: upload guidance に注意文を入れ、実 storageState を template に含めない
- リスク3: CLI 自動コピーを期待される → 軽減策: 今回は manual-copy scope と明記し、後続 SPEC の候補に残す

## 実装メモ（Implementation Agent向け）

- `.claude/` は Codex-only boundary のため触らない
- `package-templates/playwright/` は package files に自動包含される
- smoke spec は実アプリに依存しすぎない最小例にする
- `Makefile` の structure validation に存在・重要文言チェックを追加する
- pack inclusion は `tests/cli/package.test.mjs` の dry-run test に追加する

## Properties

### Invariants
- [INV-01] (Gate 2) CLI `init` / `update` の既存挙動は変えない
- [INV-02] (Gate 2) Playwright templates は manual-copy として package に含まれる
- [INV-03] (Gate 3) 実 credential / storageState / token-like value は template に含めない
- [INV-04] (Gate 4) Locator guidance は user-facing locator を CSS / XPath より優先する

### Pre-conditions
- [PRE-01] (Gate 2) 利用者プロジェクトが Playwright を採用する場合のみ templates をコピーする
- [PRE-02] (Gate 2) CI で E2E を実行する場合は project-specific `pnpm ai:check` に `test:e2e:smoke` が含まれる

### Post-conditions
- [POST-01] (Gate 2) npm pack dry-run に Playwright templates と E2E prompt が含まれる
- [POST-02] (Gate 4) React Next.js profile から安定化 template / prompt / artifact guidance を辿れる
- [POST-03] (Gate 3) secret scan が新規ファイルに対して pass する

### Assumptions
- [ASM-01] (Gate 横断) Playwright 公式 docs の best practices / locators / trace viewer / CI guidance を一次資料とする
- [ASM-02] (Gate 横断) MCP は exploration、CLI は repeatable CI execution という役割分担を推奨する

## 関連ID

- PLAN-ID: PLAN-0042
- TASK-ID: TASK-0156, TASK-0157, TASK-0158, TASK-0159, TASK-0160

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0042-playwright-stabilization-templates.md"
  target_type: SPEC
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
