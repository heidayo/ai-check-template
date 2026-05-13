# TASK-0007: ai-check-fast.yml 作成（fast check workflow）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0007 |
| SPEC-ID   | SPEC-0002 |
| PLAN-ID   | PLAN-0002 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0006, TASK-0008, TASK-0009 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 20m |

## 責務

`package-templates/ci-examples/github-actions/ai-check-fast.yml` を新規作成し、PR トリガーで `pnpm ai:check:fast` を実行する GitHub Actions workflow を提供する。

## 入力

- SPEC-0002 §背景・目的、§実装メモ §推奨 YAML 骨格（`ai-check-fast.yml`）
- PLAN-0002 §実装方針
- Notion 主体文書 Doc #2（参照日 2026-05-13）
- philosophy ドキュメント [`formal-name-match.md`](../package-templates/docs/philosophy/formal-name-match.md) §段階的導入（Phase A: fast loop の位置付け）

## 出力

- 新規ファイル: `package-templates/ci-examples/github-actions/ai-check-fast.yml`
- 構成:
  - `name: AI Check (Fast)`
  - `on: pull_request`（push は対象外、PR のみで fast feedback）
  - `jobs.ai-check-fast`: ubuntu-latest, timeout 10 分（fast なので短く）
  - steps: checkout → pnpm setup → node setup（cache: pnpm）→ install → `pnpm ai:check:fast`
  - コメントで「Edit hook（fast）と CI（fast）を同期させる思想」を明示
- 行数: 20-60 行（コメント含む、`ai-check.yml` より短く）

## File Scope（変更許可範囲）

- 作成: `package-templates/ci-examples/github-actions/ai-check-fast.yml`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル
- `package-templates/ci-examples/github-actions/` 以外の全ディレクトリ
- 本リポ自身の `.github/workflows/`
- SAGE 内部物全般

## 禁止事項

PLAN-0002 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等固有語の使用
- secret 直書き
- `ai-check.yml` の内容をコピペしてそのまま「fast」と改名（fast は responsibility が異なる：static + unit のみ）
- push トリガーを有効化する（fast は PR のみ、push は full の `ai-check.yml` が担当）
- timeout を 10 分以上に設定（fast の意義が失われる）
- TODO / FIXME を残す
- File Scope 外への書き込み

## 完了条件

- [ ] AC: `ls package-templates/ci-examples/github-actions/ai-check-fast.yml` が成功
- [ ] AC: ファイルが `name:` キーで始まる行を持つ
- [ ] AC: `jobs:` セクションが存在
- [ ] AC: `pnpm ai:check:fast` を呼ぶ（`grep -q "pnpm ai:check:fast" package-templates/ci-examples/github-actions/ai-check-fast.yml`）
- [ ] AC: `on: pull_request` を持つ（`grep -q "pull_request" package-templates/ci-examples/github-actions/ai-check-fast.yml`）
- [ ] AC: timeout が 10 分以下（`grep -q "timeout-minutes: \(10\|[1-9]\)" package-templates/ci-examples/github-actions/ai-check-fast.yml`）
- [ ] AC: secret 直書きが存在しない
- [ ] AC: gakuten 固有語が含まれない
- [ ] AC: ファイル行数が範囲内（`L=$(wc -l < package-templates/ci-examples/github-actions/ai-check-fast.yml); test $L -ge 20 -a $L -le 80`）

## Done Definition（ラウンド単位）

参照: SPEC-0002 受け入れ条件 AC-01..AC-10 のうち本 TASK 対象は AC-01（部分）, AC-02, AC-03, AC-08, AC-06, AC-07, AC-10（部分）。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0002 および PLAN-0002 から以下を継承する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0002 §Quality Gate マッピング | Gate 1 / 2 / 3 / 4 |
| テスト種別 | PLAN-0002 §必要な検証 | structural test + security scan |
| カバレッジ閾値 | SPEC-0002 §非機能要件 NFR-04 | N/A |
| commit-msg hook | SPEC-0002 §契約 | 各 commit に TASK-0007 を含める |
| Error Resolution | SPEC-0002 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0002 §Knowledge Management | YAML 構文エラー累積で anti-pattern 昇格 |
| 採用メトリクス | PLAN-0002 §採用メトリクス | TASK 完了 + 該当 AC 全 pass |
| 段階移行 | PLAN-0002 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0002 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/ci-examples/github-actions/ai-check-fast.yml` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: TBD / architecture: TBD |
