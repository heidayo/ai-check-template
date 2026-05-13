# SPEC-0002: package-templates/ci-examples/ の整備と計画ドキュメント補正

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0002 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001（philosophy docs が `formal-name-match.md` / `test-pyramid.md` を提供している前提で YAML が参照する） |
| 権限レベル | platform |

## 背景・目的

`ai-check-template` Phase 0 計画から **CI 統合（GitHub Actions YAML 等）が完全に抜け落ちていた**ことが判明した。Notion 主体文書 Doc #2（無料で作る AI エージェント開発診断フロー）には CI 統合 YAML の節があり、過去の議論でも `package-templates/github-actions/ai-check.yml` を含む構造案が出ていたが、SPEC-0001 起票時に scope 外として明示も含まずに漏らした。

「AI 内部ループ（Edit hook = fast）+ PR Gate（CI = full）のハイブリッド」と決定した以上、PR Gate を実体化する CI 設定の例が必要。本 SPEC でこの抜けを補正する。

**汎用ファースト原則**を維持するため、特定 CI ツール（GitHub Actions のみ）に縛らず、`ci-examples/` という抽象化したディレクトリで例を提供する。GitLab CI / CircleCI 等は将来の SPEC で追加可能とする。

合わせて、計画ドキュメント 3 ファイル（`README.md` / `package-templates/README.md` / `.claude/rules/ai-check-template.md`）から CI 統合言及が抜けていた問題も同 SPEC で補正する（計画と実装の整合）。

## 対象ユーザー

- 本パッケージを利用して AI 駆動開発の品質ループを構築するエンジニア
- 特に **PR Gate を CI 上で動かしたい**ケース（pull_request / push トリガーで `ai:check` を強制したい）
- GitHub Actions を使うプロジェクトを最初の対象とし、他 CI 環境はテンプレを参考に移植する

## スコープ（含む）

- `package-templates/ci-examples/` ディレクトリを新規作成
- `package-templates/ci-examples/README.md` を作成（ディレクトリの目的・カスタマイズ指針・なぜ「example」扱いか）
- `package-templates/ci-examples/github-actions/ai-check.yml` を作成（full check 用 workflow）
- `package-templates/ci-examples/github-actions/ai-check-fast.yml` を作成（fast check 用 workflow）
- `package-templates/README.md` を更新し、想定構造に `ci-examples/` を追加
- ルート `README.md` を更新し、「提供するもの（予定）」§2 テストフローテンプレートに CI 統合例を追加
- `.claude/rules/ai-check-template.md` を更新し、配布物リスト・「提供するもの」セクションに `ci-examples/` を追加

## スコープ外（明示的に除外）

- GitLab CI / CircleCI / Bitbucket Pipelines / Jenkins 等の YAML — 将来の別 SPEC（GitHub Actions が安定してから追加）
- profile-specific な YAML（`profiles/react-nextjs/ci.yml` 等）— `profiles/` を扱う別 SPEC で対応
- 本リポ自身の CI 設定（`.github/workflows/` 配下）— 「リポ運用」と「配布物」を混同しないため別 SPEC
- `ai-check.sh` / `ai-check-fast.sh` の実体 — `scripts/` を扱う別 SPEC で対応（YAML 内では `pnpm ai:check` をコマンドとして呼ぶ前提のみ）
- `package.scripts.fragment.json` の実体 — 別 SPEC（YAML 内ではコメントで言及）
- React Doctor / Knip / Semgrep / oxlint 等の個別ツール固有設定 — 「tools 解説」の別 SPEC で対応
- gakuten 固有の workflow 整理 — 本リポのスコープ外
- npm publish 用の workflow（`release.yml`）— Phase 2 で扱う

## File Scope（SPEC レベル）

**書き込み許可:**
- `package-templates/ci-examples/README.md`（新規）
- `package-templates/ci-examples/github-actions/ai-check.yml`（新規）
- `package-templates/ci-examples/github-actions/ai-check-fast.yml`（新規）
- `package-templates/README.md`（既存更新）
- `README.md`（既存更新）
- `.claude/rules/ai-check-template.md`（既存更新）

**読み込みのみ:**
- `package-templates/docs/philosophy/test-pyramid.md`（YAML コメントで参照する思想ドキュメント）
- `package-templates/docs/philosophy/formal-name-match.md`（同上）
- Notion Doc #2（出典）

**変更禁止:**
- `CLAUDE.md` / `AGENTS.md` / `sage/` / `.sage/` / `templates/hooks/` 等 SAGE 内部物
- `specs/_template.md` / `plans/_template.md` / `tasks/_template.md`
- 既存 `specs/SPEC-0001*.md` / `plans/PLAN-0001*.md` / `tasks/TASK-000{1..5}*.md`（承認済成果物）
- `package-templates/docs/philosophy/*.md`（SPEC-0001 で確定済）

## CLAUDE.md / .claude/rules/ 連携

実装エージェントは `.claude/rules/ai-check-template.md` に従う（既存ルール）。本 SPEC は CLAUDE.md への追記なし。

| ルール | 出典 | 実装時の遵守事項 |
|---|---|---|
| 汎用ファースト | ai-check-template.md §設計原則1 | YAML に gakuten / 特定企業固有の判断を含めない。例として React 系の `pnpm` 系コマンドを使うが、コメントで「他 PM / 他言語に差し替え可」と注記 |
| 言語規約 | ai-check-template.md §言語規約 | YAML のコメントは日本語可、YAML キー・GitHub Actions の `uses`/`with` 等は英語 |
| 配布物と SAGE 内部物の分離 | ai-check-template.md §配布物と SAGE 内部物の分離 | `package-templates/ci-examples/` のみ書き込み。`templates/` や `.github/` には書かない |
| 主体文書 | ai-check-template.md §主体文書 | Doc #2 の CI YAML 節を出典として README で明示 |

## Forbidden Shortcuts（禁止事項）

- YAML に gakuten / 学生転職 / apps/web / web_ipo / academy / internships を含める
- `Co-Authored-By` 等を YAML コメントに残してコミット（クレジットは commit message のみ）
- TODO / FIXME / XXX をコミット
- File Scope 外のファイル変更
- 本リポ自身の `.github/workflows/` を生成する（混同回避）
- `actions/checkout@v4` 以下の古い version の使用（最新 v5 を使う、ただし stable な範囲で）
- secret / token / API key を YAML に直書き
- `--no-verify` / `--force` 等 SAGE hook bypass
- 計画ドキュメント 3 ファイルの更新で、CI 統合以外の文言を改変（scope 漏れを防ぐ）

## 要件

### 機能要件
- [FR-01] `package-templates/ci-examples/github-actions/ai-check.yml` が存在し、有効な GitHub Actions YAML
- [FR-02] `package-templates/ci-examples/github-actions/ai-check-fast.yml` が存在し、有効な GitHub Actions YAML
- [FR-03] `package-templates/ci-examples/README.md` が存在し、目的・カスタマイズ指針・「example」扱いの理由を記載
- [FR-04] `ai-check.yml` は `pnpm ai:check` を呼ぶ統合構成（個別ツール直接呼び出しではなく、user 定義の統合スクリプトに委譲）
- [FR-05] `ai-check-fast.yml` は `pnpm ai:check:fast` を呼ぶ
- [FR-06] 両 YAML はパッケージマネージャ・Node version をコメントで「差し替え可」と明示
- [FR-07] 3 つの計画ドキュメントに `ci-examples/` への言及が追加されている

### 非機能要件
- [NFR-01] YAML 1 ファイル 30-100 行程度（コメント含む。読了 5 分以内）
- [NFR-02] README 100-300 行程度
- [NFR-03] テスト種別: structural test（YAML 構文・ファイル存在・grep 検証）+ syntax validation（GitHub Actions YAML schema チェックは外部依存のため optional）
- [NFR-04] カバレッジ閾値: N/A — 本 SPEC は設定ファイル + ドキュメント。代替指標として「FR-01..FR-07 を満たすファイル数」を計測

### セキュリティ要件
- [SEC-01] YAML に secret / token / API key を直書きしない（grep で機械検証）
- [SEC-02] GitHub Actions の third-party action は `uses` で SHA pin せず major version pin（`@v5`）に留めるが、利用者へのカスタマイズ指針として SHA pin の選択肢を README で言及する

### 運用要件
- [OPS-01] 本 SPEC 完了後、Phase 0 のサブ成果物 1/7 から 2/7 に進む（philosophy + ci-examples）
- [OPS-02] dogfooding で「実プロジェクトで使えない」「YAML が動かない」フィードバックが得られた場合、Phase 1 中に SPEC 修正で対応

## Quality Gate マッピング

| Gate | 対応 AC | 検証コマンド |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03, AC-04, AC-07 | `ls`, `head`, `grep`, `wc -l`, YAML 構文簡易検証 |
| Gate 2: Functional | AC-05, AC-08, AC-09 | `grep`（pnpm ai:check / pnpm ai:check:fast 呼び出し、計画ドキュメント更新） |
| Gate 3: Security | AC-06 | `grep -iE` で secret / token / api[-_]?key パターン不在を確認 |
| Gate 4: Architecture | AC-10 | `find` で `ci-examples/` が `package-templates/` 配下にのみ存在することを確認 |
| Gate 5: Release | N/A | Phase 0 では対象外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系（存在・構造検証）
- [ ] AC-01: 4 ファイルすべて存在
  - `ls package-templates/ci-examples/README.md`
  - `ls package-templates/ci-examples/github-actions/ai-check.yml`
  - `ls package-templates/ci-examples/github-actions/ai-check-fast.yml`
  - すべて成功
- [ ] AC-02: 2 つの YAML が `name:` キーを持つ（`grep -c "^name:" package-templates/ci-examples/github-actions/*.yml` が 2 を返す）
- [ ] AC-03: 2 つの YAML が `jobs:` キーを持つ（`grep -c "^jobs:" package-templates/ci-examples/github-actions/*.yml` が 2 を返す）
- [ ] AC-04: ci-examples README に `# CI Examples` または同等 H1 が存在（`head -1 package-templates/ci-examples/README.md | grep -q "^# "`）

### 機能検証
- [ ] AC-05: `ai-check.yml` が `pnpm ai:check` を呼ぶ（`grep -q "pnpm ai:check" package-templates/ci-examples/github-actions/ai-check.yml`、ただし `ai:check:fast` とは区別）
- [ ] AC-08: `ai-check-fast.yml` が `pnpm ai:check:fast` を呼ぶ（`grep -q "pnpm ai:check:fast" package-templates/ci-examples/github-actions/ai-check-fast.yml`）
- [ ] AC-09: 計画ドキュメント 3 ファイルすべてに `ci-examples` が登場（`grep -l "ci-examples" README.md package-templates/README.md .claude/rules/ai-check-template.md | wc -l` が 3 を返す）

### 異常系（混入・欠落検出）
- [ ] AC-06: secret / token / API key パターンが YAML / README に存在しない（`grep -iE "(api[-_]?key|secret|token|password)\s*[:=]\s*['\"]" package-templates/ci-examples/` が空、ただし `${{ secrets.* }}` 形式の正当な参照は許容）
- [ ] AC-07: gakuten 固有語の混入なし。2 つの基準を満たす:
  - (a) `package-templates/ci-examples/` 配下のファイルに完全に含まれない（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/ci-examples/` が空）
  - (b) 既存計画ドキュメント 3 ファイル（`README.md` / `package-templates/README.md` / `.claude/rules/ai-check-template.md`）への**今回の編集差分に新規追加**されない（`git diff HEAD -- README.md package-templates/README.md .claude/rules/ai-check-template.md | grep "^+" | grep -v "^+++" | grep -iE "gakuten|学生転職|apps/web|web_ipo|academy|internships"` が空）。既存の「gakuten 等を dogfooding 対象とする」言及は許容

### 配置検証（アーキテクチャ）
- [ ] AC-10: `ci-examples` ディレクトリが `package-templates/` 配下にのみ存在（`find . -type d -name "ci-examples" -not -path "./node_modules/*" -not -path "./.git/*"` の結果が `./package-templates/ci-examples` のみ）

## 異常系

- 想定エラー1: YAML が GitHub Actions schema に違反する → 軽減策: 一次資料（Doc #2）の YAML を出発点に書き、actionlint 等の外部ツールで手動検証（Phase 1 で `ci-examples/` 配下に actionlint 統合を別 SPEC で検討）
- 想定エラー2: secret が YAML に紛れる → AC-06 で機械検出
- 想定エラー3: gakuten 固有語が混入 → AC-07 で機械検出
- 想定エラー4: 計画ドキュメント 3 ファイルの更新漏れ → AC-09 で機械検出
- 想定エラー5: `ci-examples/` が `templates/` 配下に作られる（命名衝突） → AC-10 で機械検出
- 境界ケース1: 既存の `package-templates/README.md` の構造表記が崩れる（Markdown コードブロックの整合） → 想定エラー4 と同様、AC-09 で部分検出
- 境界ケース2: 計画ドキュメントの「Phase 0 のサブ成果物」数が更新されない（7 → 8 への変更漏れ） → 手動レビュー（PLAN で明示）

## Error Resolution 手順

| 失敗 AC | エラー内容 | 復旧手順 |
|---|---|---|
| AC-01 | ファイル欠落 | 不足ファイルを `mkdir -p` + Write で作成 |
| AC-02 | `name:` キー欠落 | YAML 先頭に `name: AI Check` 等を追加 |
| AC-03 | `jobs:` キー欠落 | YAML に `jobs:` セクションを追加 |
| AC-04 | README の H1 欠落 | README 先頭に `# CI Examples` を追加 |
| AC-05 | `pnpm ai:check` 呼び出し欠落 | `ai-check.yml` のステップに `run: pnpm ai:check` を追加 |
| AC-06 | secret 直書き混入 | 該当箇所を `${{ secrets.NAME }}` に置換、または削除 |
| AC-07 | gakuten 固有語混入 | `grep -ri` で位置特定 → 該当箇所を汎用語に置換 |
| AC-08 | `pnpm ai:check:fast` 呼び出し欠落 | `ai-check-fast.yml` のステップに `run: pnpm ai:check:fast` を追加 |
| AC-09 | 計画ドキュメント未更新 | 不足ファイルに `ci-examples` セクションを追記 |
| AC-10 | `ci-examples` が誤った場所 | 誤配置を `git mv` で `package-templates/ci-examples/` に移動 |

連続 3 回同じ AC が失敗した場合は `same_fail_abort` で human escalation。

## Knowledge Management

### sage/failures.md / sage/anti-patterns.md 連携

| シナリオ | 記録先 | 責任者 | タイミング |
|---|---|---|---|
| YAML が actionlint 等で構文エラー | `sage/failures.md` | 実装エージェント（自動）+ オーナー（承認） | Verify 失敗時 |
| 計画ドキュメントと配布物の不整合再発（CI 漏れと同類） | `sage/failures.md` | リポオーナー（人間） | 発見時 |
| 同様の「計画 vs 実装」乖離パターンが 3 回累積 | `sage/anti-patterns.md` 昇格候補 | リポオーナー | failures.md レビュー時 |
| dogfooding で YAML が壊れている報告 | `sage/failures.md` | リポオーナー | dogfooding feedback 受領時 |

### sage/anti-patterns.md 参照（実装時の回避）

- **Big Bang Prompt**: 3 つの YAML / README を 1 つのプロンプトで一括生成しない。1 ファイル = 1 TASK で分割
- **Silent Scope Expansion**: File Scope 外（`.github/workflows/` 等）への変更を含めない
- **計画と実装の乖離**: 本 SPEC 自体が計画漏れの補正。今後は SPEC 起票時に「計画ドキュメント整合」をチェックリスト化

## 契約

- API: なし
- DB: なし
- イベント: GitHub Actions の `on: pull_request` / `on: push` トリガーを定義（外部システムとの暗黙の契約）
- commit-msg hook: TASK-ID を含める

## リスク

- リスク1: GitHub Actions が将来 v6 等になり syntax が変わる → 軽減策: README で「`uses: actions/checkout@v5` は本 SPEC 作成時点。最新は GitHub Docs を参照」と明示
- リスク2: pnpm 以外を使うプロジェクトで動かない → 軽減策: YAML コメントで「`actions/setup-node` の `cache:` キーと `pnpm/action-setup` を npm / yarn / bun に差し替え可」と明示。代替例を README に記載
- リスク3: `pnpm ai:check` が存在しないと CI が即 fail する → 軽減策: `scripts/` SPEC（別 SPEC）と密接。本 SPEC 単独では「コマンドの存在は前提」と明示
- リスク4: 計画 vs 実装の乖離アンチパターンが繰り返される → 軽減策: 本 SPEC のクロージャ時に「計画ドキュメント整合チェックリスト」を新規 SPEC 候補として記録
- リスク5: GitHub Actions に縛られた設計が、他 CI へ移植困難 → 軽減策: YAML は「`pnpm ai:check` を呼ぶだけ」の薄い構成にし、本質的なロジックは `package.scripts.fragment.json` に集約

## 採用メトリクス（合格基準）

| メトリクス | 合格基準 | 計測方法 |
|---|---|---|
| ファイル存在 | 4 ファイル全存在 | AC-01 |
| YAML 構文 | `name:` / `jobs:` 必須キーあり | AC-02, AC-03 |
| 計画ドキュメント整合 | 3 ファイルすべて `ci-examples` 言及 | AC-09 |
| secret 不在 | YAML / README に secret 直書きなし | AC-06 |
| 配置正当性 | `ci-examples` が `package-templates/` 配下のみ | AC-10 |
| dogfooding 採用率（Phase 1） | YAML を 2 プロジェクト以上が改訂なしで採用 | 手動カウント |

採用率が 50% 未満（2 件中 1 件未満）の場合は SPEC を改訂する。

## 段階移行（昇格条件）

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Draft → Approved | AC-01..AC-10 全 pass + `/sage-evaluate` で 95+ | `bash scripts/sage-validate.sh` + 自己採点 |
| Phase 0 サブ成果物 1/7 → 2/7 | SPEC-0002 Approved | 「ci-examples ディレクトリが存在 + 計画ドキュメント更新済み」 |
| Phase 0 → Phase 1 | 全 7 サブ成果物完了 → 8 サブ成果物完了に変更 | 他 SPEC（prompts / scripts / profiles 等）も完了が前提 |

## 実装メモ（Implementation Agent向け）

### 出典 Notion ページ
- `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）の「## CIに入れるなら」節

### 推奨 YAML 骨格（`ai-check.yml`）

```yaml
name: AI Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ai-check:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Run ai:check
        run: pnpm ai:check
```

### 推奨 YAML 骨格（`ai-check-fast.yml`）

```yaml
name: AI Check (Fast)

on:
  pull_request:

jobs:
  ai-check-fast:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Run ai:check:fast
        run: pnpm ai:check:fast
```

### 計画ドキュメント更新（必須）

- `package-templates/README.md` § 想定する構造（Phase 2 で具体化）の Markdown コードブロックに `ci-examples/` を追加
- `README.md` § 提供するもの（予定）§2 テストフローテンプレートに「CI 統合例（GitHub Actions YAML）」を追加
- `.claude/rules/ai-check-template.md` § 配布物と SAGE 内部物の分離 の表 + § 提供するもの（Phase 2 で具体化）に `ci-examples/` セクションを追加

### TASK 分解の指針（PLAN で確定）

並列実行可能:
- TASK-A: `ai-check.yml` 作成
- TASK-B: `ai-check-fast.yml` 作成
- TASK-C: `ci-examples/README.md` 作成
- TASK-D: 計画ドキュメント 3 ファイル更新（独立性のためまとめる、または 3 TASK に分割）

依存:
- TASK-E（検証）: 上記 A〜D 完了後

## ロールバック手順

| 失敗レベル | ロールバック手順 |
|---|---|
| Level 1: 単一ファイル不備 | 該当ファイルのみ `git checkout HEAD -- <path>` で復元、再実装 |
| Level 2: 複数ファイル整合性破綻（YAML 内容と README が乖離等） | `git checkout HEAD -- package-templates/ci-examples/` + 計画ドキュメント復元、PLAN を再評価 |
| Level 3: SPEC レベルの方針誤り（dogfooding で YAML が動かない） | SPEC-0002 を Draft に戻し、新規 SPEC として再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 配布物 (`package-templates/`) と SAGE 内部物 (`templates/`, `.sage/`, `sage/`) は混在しない。`ci-examples/` は `package-templates/` 配下にのみ存在する
- [INV-02] (Gate 4 / 横断) YAML / README に gakuten 固有の語彙が含まれない
- [INV-03] (Gate 3) YAML に secret / token / API key が直書きされない（`${{ secrets.* }}` 形式の参照のみ許容）
- [INV-04] (Gate 4) `ci-examples/` 配下に **SAGE 内部物** (`templates/hooks/`, `sage/`, `.sage/`) を参照する設定が含まれない（配布物の SAGE 非依存性確保）。注: `.github/workflows/` は SAGE 内部物ではなく利用者プロジェクト側の配置先のため許容（YAML コメント内の usage instruction として登場する）

### Pre-conditions
- [PRE-01] (Gate 1) SPEC-0001 が Approved（philosophy docs が存在し、YAML コメント・README で参照可能）
- [PRE-02] (Gate 1) `.sage/config.yaml` の `hooks.profile` が `standard` 以上で SAGE ファイル保護 hook が有効

### Post-conditions
- [POST-01] (Gate 2) 4 ファイル（YAML×2、README×1、計画ドキュメント更新×3）が指定通りに存在
- [POST-02] (Gate 2) `ai-check.yml` および `ai-check-fast.yml` が `pnpm ai:check` / `pnpm ai:check:fast` を呼び出す
- [POST-03] (Gate 4) `ci-examples/` ディレクトリは `package-templates/` 配下にのみ存在し、他の `templates/` 系には複製されない

### Assumptions
- [ASM-01] (Gate 横断) `pnpm ai:check` / `pnpm ai:check:fast` の実体は別 SPEC（`scripts/` 系）で定義される。本 SPEC は「コマンドが呼ばれる」ことのみ規定し、コマンドの中身は規定しない
- [ASM-02] (Gate 横断) GitHub Actions を最初の CI 環境として選ぶが、他 CI（GitLab CI / CircleCI）への移植は将来の別 SPEC で扱う
- [ASM-03] (Gate 横断) 本リポ自身の `.github/workflows/` は本 SPEC の対象外。配布物 `package-templates/ci-examples/` のみが本 SPEC のスコープ

## 関連ID

- 依存元 SPEC: SPEC-0001（philosophy docs が PRE-01 を満たす）
- PLAN-ID: （計画フェーズで記入）
- TASK-ID: （分割フェーズで記入）
