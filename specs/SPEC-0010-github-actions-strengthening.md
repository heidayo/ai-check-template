# SPEC-0010: GitHub Actions strengthening

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0010 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0002, SPEC-0009 |
| 権限レベル | platform |

## 背景・目的

SPEC-0002 で配布用 GitHub Actions examples は作成済みだが、本リポ自身の CI はまだ存在しない。また、v0.1.0 の拡張スコープとして「本リポ CI + reusable workflow 雛形」を含める方針が決まっている。

本 SPEC では、依存インストールなしで動く `make validate` と GitHub Actions workflow を追加し、リポジトリ自身の品質ゲートを機械化する。あわせて `package-templates/ci-examples/github-actions/` に reusable workflow の雛形と caller example を追加し、直接コピー型 workflow と reusable workflow 型の両方を選べるようにする。

## 対象ユーザー

- 本リポの maintainer（PR で最低限の構造・構文チェックを自動化したい）
- `ai-check-template` 利用者（GitHub Actions の direct workflow と reusable workflow のどちらを採用するか判断したい）
- v0.1.0 リリース前に配布物の YAML 破損を防ぎたい reviewer

## スコープ（含む）

- `Makefile` を追加し、`make validate` で本リポの構造チェックを実行できるようにする
- `.github/workflows/validate.yml` を追加し、PR / main push で `make validate` を実行する
- `package-templates/ci-examples/github-actions/ai-quality-reusable.yml` を追加する
- `package-templates/ci-examples/github-actions/ai-quality-call.yml` を追加する
- `package-templates/ci-examples/README.md` を更新し、direct workflow / reusable workflow の使い分けを説明する
- `package-templates/README.md` の構造図に reusable workflow examples を追加する
- `README.md` / `README-ja.md` の CI templates 説明を更新する
- `docs/roadmap.md` の v0.1.0 deliverables で SPEC-0009 完了と SPEC-0010 完了を反映する

## スコープ外（明示的に除外）

- npm package 化、CLI、`package.json` 追加
- GitHub Marketplace Composite Action
- npm publish / release workflow
- GitLab CI / CircleCI / Bitbucket Pipelines examples
- profile-specific CI の分岐生成
- `package-templates/scripts/ai-check*.sh` の挙動変更
- `.sage/`, `sage/`, `templates/`, `CLAUDE.md` の変更

## File Scope

**書き込み許可:**
- `Makefile`（新規）
- `.github/workflows/validate.yml`（新規）
- `package-templates/ci-examples/github-actions/ai-check.yml`（更新）
- `package-templates/ci-examples/github-actions/ai-check-fast.yml`（更新）
- `package-templates/ci-examples/github-actions/ai-quality-reusable.yml`（新規）
- `package-templates/ci-examples/github-actions/ai-quality-call.yml`（新規）
- `package-templates/ci-examples/README.md`（更新）
- `package-templates/README.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `specs/SPEC-0010-github-actions-strengthening.md`（新規）
- `plans/PLAN-0010-github-actions-strengthening.md`（新規）
- `tasks/TASK-0034-repo-validation-workflow.md`（新規）
- `tasks/TASK-0035-reusable-workflow-examples.md`（新規）
- `tasks/TASK-0036-ci-docs-roadmap.md`（新規）
- `tasks/TASK-0037-verify-github-actions-strengthening.md`（新規）

**変更禁止:**
- `package-templates/scripts/ai-check.sh`
- `package-templates/scripts/ai-check-fast.sh`
- `package-templates/package.scripts.fragment.json`
- `package-templates/docs/philosophy/**`
- `CLAUDE.md`
- `.sage/**`, `sage/**`, `templates/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

| ルール | 実装時の遵守事項 |
|---|---|
| SAGE lifecycle | SPEC/PLAN/TASK 作成後に実装し、TASK File Scope のみ編集する |
| 汎用ファースト | workflow examples に特定プロジェクト固有名を含めない |
| 配布物と運用物の分離 | 本リポ CI は `.github/workflows/`; 利用者向け examples は `package-templates/ci-examples/` に分離する |
| 言語規約 | 外部向け README は英語 Primary + 日本語版、workflow comments は英語で記述する |

## Forbidden Shortcuts

- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- secret / token / API key の直書き
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等の固有語混入
- Marketplace Action を今回の SPEC に含める
- 本リポ CI で Node package install を前提にする
- `Makefile` から gitignored SAGE scripts の存在を必須にする

## 要件

### 機能要件

- [FR-01] `make validate` がローカルで実行でき、JSON / YAML / shell syntax / 配布物構造を検証する
- [FR-02] `.github/workflows/validate.yml` が PR / main push で `make validate` を実行する
- [FR-03] direct workflow examples が `permissions: contents: read` を持つ
- [FR-04] reusable workflow example が `workflow_call` を提供し、package manager / Node version / install command / check command を入力で変更できる
- [FR-05] caller example が reusable workflow example の使い方を示す
- [FR-06] CI examples README が direct workflow と reusable workflow の使い分けを説明する
- [FR-07] root README / README-ja / package-templates README / roadmap が新しい CI examples と矛盾しない

### 非機能要件

- [NFR-01] `make validate` は依存インストールなしで実行できる
- [NFR-02] YAML validation は標準的な runner にある Ruby YAML parser を使う。Ruby がない場合は明示的に skip する
- [NFR-03] 新規 YAML は各 30-140 行
- [NFR-04] `package-templates/ci-examples/README.md` は 100-250 行
- [NFR-05] workflow examples は direct copy しやすいコメント量に抑える

### セキュリティ要件

- [SEC-01] workflow / Makefile / docs に secret 直書きパターンを含めない
- [SEC-02] GitHub Actions は最小権限 `permissions: contents: read` を設定する
- [SEC-03] third-party action は major version pin とし、SHA pin は README で高セキュリティ環境向け選択肢として説明する

### 運用要件

- [OPS-01] PR #5 以降で CI が最低限の構造破損を検出できる
- [OPS-02] v0.1.0 deliverables の進捗が roadmap に反映される
- [OPS-03] `make validate` は maintainer が PR template の checklist で使える

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-04, AC-05, AC-06, AC-07 | `test -f`, `grep`, `wc -l`, Ruby YAML parse |
| Gate 2: Functional | AC-03, AC-08, AC-09, AC-10 | `make validate`, workflow grep |
| Gate 3: Security | AC-11, AC-12 | secret grep, permissions grep |
| Gate 4: Architecture | AC-13 | `git status --short`, path grep |
| Gate 5: Release | N/A | v0.1.0 tag は SPEC-0014 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: 新規 4 ファイルが存在する（`Makefile`, `.github/workflows/validate.yml`, `package-templates/ci-examples/github-actions/ai-quality-reusable.yml`, `package-templates/ci-examples/github-actions/ai-quality-call.yml`）
- [x] AC-02: `make validate` が exit code 0 で完了する
- [x] AC-03: `.github/workflows/validate.yml` が `make validate` を呼ぶ
- [x] AC-04: reusable workflow に `workflow_call` と inputs `package-manager`, `node-version`, `check-command` がある
- [x] AC-05: caller example が `uses: ./.github/workflows/ai-quality-reusable.yml` を含む
- [x] AC-06: `package-templates/ci-examples/README.md` が `ai-quality-reusable.yml` と `ai-quality-call.yml` を説明する
- [x] AC-07: YAML 構文検証が pass する（`ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f) }' .github/workflows/*.yml package-templates/ci-examples/github-actions/*.yml`）

### 機能検証

- [x] AC-08: reusable workflow が `pnpm`, `npm`, `yarn`, `bun` の install path を持つ
- [x] AC-09: `README.md` と `README-ja.md` が reusable workflow に言及する
- [x] AC-10: `docs/roadmap.md` が SPEC-0009 と SPEC-0010 を完了扱いにする

### 異常系

- [x] AC-11: secret 直書きパターンがない（`grep -riE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" Makefile .github/workflows package-templates/ci-examples README.md README-ja.md docs/roadmap.md package-templates/README.md` が空）
- [x] AC-12: 5 つの workflow YAML が `permissions:` と `contents: read` を含む
- [x] AC-13: 変更ファイルが File Scope 内のみで、`package-templates/scripts/` と SAGE protected files に変更がない

## 異常系

- 想定エラー1: GitHub Actions YAML が壊れる → AC-07 と `make validate` で検出する
- 想定エラー2: `make validate` が SAGE local-only scripts に依存する → `Makefile` では SAGE validation を存在時のみ実行する
- 想定エラー3: reusable workflow と direct workflow の使い分けが README で曖昧 → AC-06 で README に明記する
- 想定エラー4: Marketplace Action まで scope が広がる → スコープ外と Forbidden Shortcuts で明示する
- 境界ケース1: Ruby が利用できない contributor 環境 → `make validate` は YAML syntax check を skip し、CI runner では Ruby で検証する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 欠落ファイルを File Scope 内に作成 |
| AC-02 | `make validate` の失敗箇所を修正し再実行 |
| AC-03 | `.github/workflows/validate.yml` に `run: make validate` を追加 |
| AC-04 | reusable workflow の `on.workflow_call.inputs` を補完 |
| AC-05 | caller example の `uses` を修正 |
| AC-06 | CI examples README に該当ファイルの説明を追加 |
| AC-07 | Ruby parser のエラー行を修正 |
| AC-08 | 不足 package manager の conditional step を追加 |
| AC-09 | root README / README-ja の CI templates 行を更新 |
| AC-10 | roadmap deliverables を更新 |
| AC-11 | secret 直書き表現を削除 |
| AC-12 | workflow permissions を追加 |
| AC-13 | File Scope 外の変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| YAML parser と GitHub Actions schema の差異で CI だけ失敗 | `sage/failures.md` | maintainer |
| `make validate` が contributor 環境で使いにくい | `sage/failures.md`、SPEC-0010 follow-up | maintainer |
| reusable workflow の入力不足が dogfooding で判明 | `docs/phase-1-feedback-template.md` → follow-up SPEC | maintainer |

## 契約

- API: なし
- DB: なし
- イベント: GitHub Actions `pull_request`, `push`, `workflow_call`
- CLI: `make validate`
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: YAML syntax は pass するが GitHub Actions schema として無効 → 軽減策: 最小構成に保ち、PR CI で実動作を確認する
- リスク2: reusable workflow が direct workflow より複雑に見える → 軽減策: README に direct workflow 推奨条件と reusable workflow 推奨条件を分けて書く
- リスク3: `make validate` が将来 Node package 化後に不足する → 軽減策: v0.2.0 以降に package test を追加する余地を残す

## 実装メモ

- 本リポ CI は Node install をしない。Markdown / YAML / JSON / shell syntax の破損検出に集中する
- YAML syntax は Ruby `YAML.load_file` で検証する
- `scripts/sage-validate.sh` は gitignored なので必須にしない。存在する local maintainer 環境では追加で実行する
- reusable workflow は `package-templates/ci-examples/github-actions/` 配下の example として扱い、実際の `.github/workflows/` には配置しない

## Properties

### Invariants

- [INV-01] (Gate 4) 本リポ運用 workflow と配布用 workflow examples は別ディレクトリに分離される
- [INV-02] (Gate 3) workflow examples は secret 直書きパターンを含まない
- [INV-03] (Gate 4) package scripts と shell scripts の挙動は本 SPEC では変更しない

### Pre-conditions

- [PRE-01] (Gate 2) contributor / CI runner は `make` と `bash` を実行できる
- [PRE-02] (Gate 2) YAML syntax check は Ruby が存在する環境で実行される

### Post-conditions

- [POST-01] (Gate 2) `make validate` が本リポの最低限の構造破損を検出する
- [POST-02] (Gate 2) 利用者は direct workflow と reusable workflow example のどちらかを選べる

### Assumptions

- [ASM-01] (Gate 横断) GitHub-hosted Ubuntu runner には `make`, `bash`, `python3`, `ruby` がある
- [ASM-02] (Gate 横断) Composite Action / Marketplace 化は v0.3.0+ で扱う

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| repo CI | `.github/workflows/validate.yml` が存在し `make validate` を呼ぶ |
| local validation | `make validate` が pass |
| reusable workflow | `workflow_call` example + caller example が存在 |
| docs alignment | README / README-ja / package-templates README / ci-examples README / roadmap が一致 |
| side effects | File Scope 外の変更なし |

## 関連ID

- PLAN-ID: PLAN-0010
- TASK-ID: TASK-0034, TASK-0035, TASK-0036, TASK-0037
