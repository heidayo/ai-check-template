# SPEC-0047: Release Readiness Onboarding Sync

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0047 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0009, SPEC-0037, SPEC-0046 |
| 権限レベル | platform |

## 背景・目的

GPT と Claude Code の事前評価では、`ai-check-template` の思想・CLI・CI・Reviewability は十分に揃っている一方、初見ユーザー向け導線、release / foundation 表記、SAGE 非依存性の見せ方、自己検証コマンドの見せ方、Claude Code 向け運用文書の現状同期に改善余地があると整理された。

この SPEC では、機能追加よりもリリース前の外向け導線と内部/配布文書の整合性を優先し、Codex と Claude Code の担当境界を明確にしたうえで README / docs / tests / Claude 文書を同期する。

## 対象ユーザー

- GitHub repository top page から初めて `ai-check-template` を読む利用者
- `npx -y ai-check-template init` を既存プロジェクトで試す利用者
- Claude Code / Codex / Cursor 等で AI 生成コードの検証ループを導入したい開発者
- 本リポを SAGE standard lane で保守する maintainer
- Claude Code と Codex を分担運用する開発者

## スコープ（含む）

- README の冒頭と Quick start を、最初に試す 1 本の導線へ整理する
- `Released`, `GitHub Actions integration foundation`, npm package version `0.2.0` の関係を読み手が誤解しない表記へ整理する
- 利用者は SAGE 不要であることを README / Claude 関連文書で明示する
- `ai-check.sh` は薄い entrypoint であり、実体は npm scripts / profile resolver にあることを説明する
- ルート repository の自己検証コマンドを `make validate` として明示するか、必要なら `ai:check` alias を追加する
- `formal-name-match.md` に、形名参同で防げること / 防げないことを明示する
- CLI fixture project で `init -> doctor -> update -> doctor --strict` に近い導入検証を追加または強化する
- Claude Code 側の内部運用文書を、現行 roadmap / CLI 実装に追従させる
- Codex 担当範囲と Claude Code 担当範囲を TASK の File Scope で分離する

## スコープ外（明示的に除外）

- CLI の新機能追加や option surface の拡張は行わない
- npm package version bump / npm publish / GitHub release / tag 作成は行わない
- GitHub Marketplace listing は行わない
- SAGE governance 本体（`sage/`）は変更しない
- Claude Code が README / public docs / tests を直接編集する運用にはしない
- Codex が Claude Code 固有ファイル（`CLAUDE.md`, `.claude/`）を直接編集する運用にはしない
- 外部 production project dogfooding の実施はこの SPEC では扱わない

## 要件

### 機能要件
- [FR-01] README の最初の導入手順は、推奨 profile の dry-run を起点にした 1 本の default path として読めること
- [FR-02] 手動コピー、複数 profile、hosted workflow / Composite Action は Quick start 直後ではなく詳細セクションへ分離すること
- [FR-03] v0.1.0 / v0.2.0 / v0.3.0 の release state と npm package version の違いを明示すること
- [FR-04] `ai-check.sh` / `ai-check-fast.sh` / `ai-check-secure.sh` は薄い委譲ラッパーであり、実体は target project の npm scripts と CLI profile resolver にあることを説明すること
- [FR-05] ルート repository の検証入口は `make validate` であること、または `package.json` scripts に同等の `ai:check` alias が存在すること
- [FR-06] `formal-name-match.md` は「型・lint・テストが通っても意味的正しさや網羅性は保証しない」などの限界を明示すること
- [FR-07] CLI tests は fixture project に対する install / doctor / update / strict doctor 系の導入検証を含むこと
- [FR-08] Claude Code 側文書は現行 roadmap / CLI docs を一次情報源として参照し、古い Phase 表記を固定値として残さないこと

### 非機能要件
- [NFR-01] 初見ユーザーが README 冒頭から 30 秒以内に価値と最初のコマンドを把握できる構成にする
- [NFR-02] docs は二重管理を避け、状態の一次情報源を `docs/roadmap.md` / `docs/cli.md` / README に寄せる
- [NFR-03] 既存 CLI behavior と package surface を壊さない
- [NFR-04] Codex と Claude Code の File Scope は重複させない
- [NFR-05] 日本語 primary README と英語 README の内容差分は意図した範囲に留める
- [NFR-06] Claude Code 向け文書の追記内容は抽象論にせず、`CLAUDE.md` 冒頭へ「本ファイルは本リポ maintainer 向けで、利用者は SAGE 不要」と明記する
- [NFR-07] `.claude/rules/ai-check-template.md` は古い Phase 表の代わりに `docs/roadmap.md` / `docs/cli.md` を source of truth とする運用ルールを明記する

### セキュリティ要件
- [SEC-01] README / docs / Claude 文書に secret, token, credential, private URL を追加しない
- [SEC-02] redaction / AI に渡す診断ログの注意は弱めず、必要なら README から参照しやすくする
- [SEC-03] GitHub Actions の permissions / pinning guidance を弱めない

### 運用要件
- [OPS-01] `node --test tests/cli/*.test.mjs` が pass する
- [OPS-02] `make validate` が pass する
- [OPS-03] `bash scripts/sage-validate.sh` が pass する
- [OPS-04] `git diff --check` が pass する
- [OPS-05] Claude Code 担当TASKは Claude Code が実装し、Codex 担当TASKは Codex が実装する
- [OPS-06] エラー発生時は TASK-ID と RUN-ID を該当 TASK の実行ログに記録し、既知パターンを `sage/anti-patterns.md` で確認する
- [OPS-07] 新規失敗パターンは発見した担当Agentが同一セッションで `sage/failures.md` へ FAIL-XXXX 形式で記録し、同種3回で `sage/anti-patterns.md` 昇格候補にする
- [OPS-08] commit する場合は commit-msg hook に従い、commit message に TASK-ID を含める

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: README Quick start の最初のコードブロックが推奨 dry-run コマンドを中心にした一本道になっている
- [x] AC-02: README / docs が `ai-check-template@0.2.0` と v0.3.0 GitHub Actions integration release の違いを明記している
- [x] AC-03: README または usage docs が「利用者は SAGE 不要」を上部で明示している
- [x] AC-04: `package-templates/scripts/` または README/docs が `ai-check*.sh` の責務を npm scripts への薄い委譲として説明している
- [x] AC-05: root repository の自己検証入口が README / docs / package scripts のいずれかで `make validate` または `ai:check` として明示されている
- [x] AC-06: `formal-name-match.md` に形名参同の限界と補完策が明記されている
- [x] AC-07: CLI tests に fixture project 導入検証が追加または強化され、`node --test tests/cli/*.test.mjs` が pass する
- [x] AC-08: `.claude/rules/ai-check-template.md` と `package-templates/.claude/README.md` の古い Phase / Draft 表記が現行状態または roadmap 参照に更新されている
- [x] AC-09: `make validate` が pass する
- [x] AC-10: `bash scripts/sage-validate.sh` が pass する
- [x] AC-11: `git diff --check` が pass する
- [x] AC-12: Codex 担当TASKと Claude Code 担当TASKの File Scope が重複していない
- [x] AC-13: `rg "Phase 1.*未着手|Phase 2.*未着手|Phase 3.*未着手|Draft v0.1" .claude/rules/ai-check-template.md package-templates/.claude` が、意図せず残った古い状態表記を検出しない
- [x] AC-14: `node -e "const p=require('./package.json'); if ((p.files||[]).includes('CLAUDE.md')) process.exit(1)"` が pass し、root `CLAUDE.md` が npm package files に含まれていないことを確認できる
- [x] AC-15: `rg "TODO|FIXME" README.md README-en.md docs package-templates/.claude package-templates/docs/philosophy/formal-name-match.md` が新規 unfinished marker を検出しない

## 異常系

- 想定エラー1: README と `docs/roadmap.md` の release state が再び乖離する → roadmap / cli docs を一次情報源とし、Claude 文書は固定表を持たず参照に寄せる
- 想定エラー2: `ai-check.sh` の薄さが「実装不足」と読まれる → shell entrypoint と npm scripts / profile resolver の責任分界を明記する
- 想定エラー3: Claude Code 側TASKが README/docs/tests に触る → TASK File Scope と担当Agentで禁止する
- 想定エラー4: Codex 側TASKが `CLAUDE.md` / `.claude/` に触る → TASK File Scope と Codex-only boundary で禁止する
- 境界ケース1: `make validate` と `ai:check` のどちらを root の正規検証名にするか判断が分かれる → 既存CI互換を優先し、少なくとも docs 上で `make validate` を正規入口として説明する

## 契約

- API: なし
- DB: なし
- イベント: なし
- Package contract: `package.json` の npm `files` に `CLAUDE.md` は含めない前提を維持する。配布対象は `bin/`, `src/`, `package-templates/`, `docs/cli.md`, `README*.md`, `LICENSE`。

## リスク

- リスク1: README を短くしすぎて既存情報が見つけにくくなる → 軽減策: 詳細 docs へのリンクを整理し、情報削除ではなく階層化で対応する
- リスク2: Claude 文書が public docs より先に固定表記を持つと再乖離する → 軽減策: Claude 文書は roadmap / cli docs 参照を基本にする
- リスク3: fixture test が重くなりすぎる → 軽減策: 実 dependency install や Next.js build ではなく CLI fixture lifecycle に限定する
- リスク4: `ai:check` alias 追加が既存 validation と二重化する → 軽減策: 追加する場合は `make validate` への薄い alias に留める

## 検証メトリクスと昇格条件

| 段階 | 合格基準 | 検証コマンド |
|---|---|---|
| Planning complete | SPEC / PLAN / TASK が作成済みで File Scope が重複しない | `bash scripts/sage-validate.sh` |
| Codex docs ready | README / docs / philosophy / script docs の AC が pass し、unfinished marker がない | `make validate-structure` + `rg "TODO|FIXME" README.md README-en.md docs package-templates/docs package-templates/scripts` |
| Codex tests ready | CLI fixture lifecycle test を含めて全 CLI tests が pass | `node --test tests/cli/*.test.mjs` |
| Claude docs ready | 古い Phase 未着手 / Draft v0.1 表記が意図せず残っていない | `rg "Phase 1.*未着手|Phase 2.*未着手|Phase 3.*未着手|Draft v0.1" .claude/rules/ai-check-template.md package-templates/.claude` |
| Review ready | 全検証と scope check が pass | `make validate` + `git diff --check` |

採用メトリクスは「初見導線の短縮」をコード実行で完全測定できないため、README 上部の構造を代替指標にする。合格基準は、README の Quick start 最初のコードブロックが推奨 dry-run command を含み、手動コピー手順は詳細セクションへ分離されていること。

## Error Resolution / Knowledge Management

エラー発生時は担当Agentが以下を実行する。

1. 該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認し、既知パターンなら該当回避策に従う。
3. 新規パターンなら `sage/failures.md` に FAIL-XXXX 形式で追記する。記録者は失敗を発見した担当Agent、タイミングは修正前の同一セッション内とする。
4. 同種失敗が3回累積した場合、Review TASK で `sage/anti-patterns.md` への昇格候補として記録する。
5. 修正は該当 TASK の File Scope 内に限定する。File Scope 外が必要な場合は TASK を改訂してから実行する。

Forbidden Shortcuts は `CLAUDE.md` と AGENTS.md の既存ルールに従う。特に TODO/FIXME の残置、`--no-verify`、`--force`、File Scope 外変更、SPEC なし実装、SAGE governance 直接変更は禁止する。

## 実装メモ（Implementation Agent向け）

- Codex は README/docs/tests/package validation のみ扱う。`CLAUDE.md` / `.claude/` は触らない。
- Claude Code は `CLAUDE.md`, `.claude/rules/ai-check-template.md`, `package-templates/.claude/*` のみ扱う。README/docs/tests は触らない。
- `package.json` の `files` は確認済み。`CLAUDE.md` は npm package に含まれていないため、root `CLAUDE.md` はリポ内部開発者向け文書として扱う。
- `package-templates/.claude/` は配布物なので、利用者が SAGE 必須と誤解しない文言を入れる。
- Claude Code が `CLAUDE.md` に追記する内容は「このファイルは本リポ maintainer 向け」「テンプレ利用者は SAGE インストール不要」「配布テンプレートの Claude hooks は `package-templates/.claude/` が source」の3点を含める。
- `.claude/rules/ai-check-template.md` の Phase / 提供物セクションは固定表で二重管理せず、現行状態は `docs/roadmap.md` と `docs/cli.md` を参照する方針へ変更する。

## Properties

### Invariants
- [INV-01] (Gate 2) README の primary onboarding path は 1 本の推奨 dry-run から始まる
- [INV-02] (Gate 2) release state の一次情報源は README / `docs/roadmap.md` / `docs/cli.md` に集約される
- [INV-03] (Gate 4) Codex 担当 File Scope と Claude Code 担当 File Scope は重複しない
- [INV-04] (Gate 3) docs / templates に secret-like value を追加しない
- [INV-05] (Gate 4) root `CLAUDE.md` は npm package contract ではなく内部開発者向け文書である

### Pre-conditions
- [PRE-01] (Gate 2) `package.json` の `files` は `CLAUDE.md` を含まない
- [PRE-02] (Gate 2) `make validate` が現行 root repository validation として存在する
- [PRE-03] (Gate 4) SAGE standard lane では SPEC / PLAN / TASK 作成後に実装する

### Post-conditions
- [POST-01] (Gate 2) 初見ユーザーは README 上部で価値、最初のコマンド、SAGE 非依存性を把握できる
- [POST-02] (Gate 2) maintainer は root repository の検証入口を迷わず実行できる
- [POST-03] (Gate 2) Claude Code 文書は現行 roadmap / CLI docs と矛盾しない
- [POST-04] (Gate 4) fixture lifecycle tests が CLI onboarding regression を検出できる
- [POST-05] (Gate 3) secret-like value と unfinished marker が新規 docs に残っていない
- [POST-06] (Gate 4) TASK-ID を含む commit message で traceability chain を維持できる

### Assumptions
- [ASM-01] (Gate 横断) v0.3.0 は npm package release ではなく GitHub Actions integration release である
- [ASM-02] (Gate 横断) GitHub Marketplace listing と外部 production dogfooding は後続作業で扱う
- [ASM-03] (Gate 横断) Claude Code と Codex は別セッションで実装し、TASK File Scope で衝突を避ける

## 関連ID

- PLAN-ID: PLAN-0047
- TASK-ID: TASK-0179, TASK-0180, TASK-0181, TASK-0182, TASK-0183

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0047-release-readiness-onboarding-sync.md"
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
