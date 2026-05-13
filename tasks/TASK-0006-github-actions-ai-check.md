# TASK-0006: ai-check.yml 作成（full check workflow）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0006 |
| SPEC-ID   | SPEC-0002 |
| PLAN-ID   | PLAN-0002 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0007, TASK-0008, TASK-0009 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

`package-templates/ci-examples/github-actions/ai-check.yml` を新規作成し、PR/push トリガーで `pnpm ai:check` を実行する GitHub Actions workflow を提供する。

## 入力

- SPEC-0002 §背景・目的、§実装メモ §推奨 YAML 骨格（`ai-check.yml`）
- PLAN-0002 §実装方針
- Notion 主体文書 Doc #2（無料で作る AI エージェント開発診断フロー、ページ ID: `c3e549660ca44005a20c4f6fdb54c8d5`）の「## CIに入れるなら」節
- 言語規約: `.claude/rules/ai-check-template.md`（YAML キーは英語、コメントは日本語可）

## 出力

- 新規ファイル: `package-templates/ci-examples/github-actions/ai-check.yml`
- 構成:
  - `name: AI Check`
  - `on: pull_request` + `on: push: branches: [main]`
  - `jobs.ai-check`: ubuntu-latest, timeout 30 分
  - steps: checkout → pnpm setup → node setup（cache: pnpm）→ install → `pnpm ai:check`
  - コメントで「パッケージマネージャ・Node version の差し替え可」を明示
  - 任意の artifact upload セクション（コメントアウトで提示）
- 行数: 30-80 行（コメント含む）

## File Scope（変更許可範囲）

- 作成: `package-templates/ci-examples/github-actions/ai-check.yml`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル（`ai-check-fast.yml` / `ci-examples/README.md` / 計画ドキュメント）
- `package-templates/ci-examples/github-actions/` 以外の全ディレクトリ
- 本リポ自身の `.github/workflows/`（配布物とリポ運用の分離）
- SAGE 内部物全般
- `specs/SPEC-0002*.md` / `plans/PLAN-0002*.md`

## 禁止事項

PLAN-0002 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等固有語の使用
- secret / token / API key の YAML 直書き（`${{ secrets.NAME }}` 参照のみ許容）
- 古い GitHub Actions version（`actions/checkout@v3` 以下）の使用
- 本リポ自身用の workflow として書く（必ず**配布される example** として書く、ファイル冒頭コメントで明示）
- `Co-Authored-By` 等のクレジットを YAML コメントに残す
- TODO / FIXME を残す
- File Scope 外への書き込み

## 完了条件

- [ ] AC: `ls package-templates/ci-examples/github-actions/ai-check.yml` が成功
- [ ] AC: ファイルが `name:` キーで始まる行を持つ（`grep -q "^name:" package-templates/ci-examples/github-actions/ai-check.yml`）
- [ ] AC: `jobs:` セクションが存在（`grep -q "^jobs:" package-templates/ci-examples/github-actions/ai-check.yml`）
- [ ] AC: `pnpm ai:check`（fast でない方）を呼ぶ（`grep -E "pnpm ai:check($|[^:])" package-templates/ci-examples/github-actions/ai-check.yml` が match）
- [ ] AC: secret 直書きが存在しない（`grep -iE "(api[-_]?key|secret|token|password)\s*[:=]\s*['\"]" package-templates/ci-examples/github-actions/ai-check.yml` が空、`${{ secrets.* }}` は除外）
- [ ] AC: gakuten 固有語が含まれない（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/ci-examples/github-actions/ai-check.yml` が空）
- [ ] AC: ファイル行数が範囲内（`L=$(wc -l < package-templates/ci-examples/github-actions/ai-check.yml); test $L -ge 30 -a $L -le 100`）
- [ ] AC: `actions/checkout@v` を使用（v4 以上推奨、`grep -q "actions/checkout@v" file`）

## Done Definition（ラウンド単位）

参照: SPEC-0002 受け入れ条件 AC-01..AC-10 のうち本 TASK 対象は AC-01（部分）, AC-02, AC-03, AC-05, AC-06, AC-07, AC-10（部分）（`ai-check.yml` 単体）。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0002 および PLAN-0002 から以下を継承する。本 TASK 内に再記述しないが、実装時に必ず参照すること。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0002 §Quality Gate マッピング | 完了条件 AC が Gate 1 / Gate 2 / Gate 3 / Gate 4 に対応 |
| テスト種別 | PLAN-0002 §必要な検証 | structural test + security scan のみ。Unit / Integration / E2E は N/A |
| カバレッジ閾値 | SPEC-0002 §非機能要件 NFR-04 | N/A。代替指標は FR-01..FR-07 充足 |
| commit-msg hook | SPEC-0002 §契約 | 各 commit に TASK-0006 を含める |
| Error Resolution | SPEC-0002 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0002 §Knowledge Management | YAML 構文エラー 3 回累積で anti-pattern 昇格候補 |
| 採用メトリクス | PLAN-0002 §採用メトリクス | TASK 完了 + 該当 AC 全 pass |
| 段階移行 | PLAN-0002 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0002 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/ci-examples/github-actions/ai-check.yml` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: TBD / architecture: TBD |
