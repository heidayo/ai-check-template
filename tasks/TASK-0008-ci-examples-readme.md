# TASK-0008: ci-examples/README.md 作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0008 |
| SPEC-ID   | SPEC-0002 |
| PLAN-ID   | PLAN-0002 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0006, TASK-0007, TASK-0009 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

`package-templates/ci-examples/README.md` を新規作成し、`ci-examples/` ディレクトリの目的・カスタマイズ指針・「example」扱いの理由を記載する。

## 入力

- SPEC-0002 §背景・目的、§対象ユーザー、§スコープ（含む）
- PLAN-0002 §実装方針
- philosophy ドキュメント
  - [`formal-name-match.md`](../package-templates/docs/philosophy/formal-name-match.md) — 形名参同（CI 統合の思想的根拠）
  - [`test-pyramid.md`](../package-templates/docs/philosophy/test-pyramid.md) — Static / Unit / Integration / E2E / DB-RLS / Monitoring の責務分割（CI 統合の各段階）

## 出力

- 新規ファイル: `package-templates/ci-examples/README.md`
- 構成（推奨順序）:
  1. H1: `# CI Examples`
  2. ディレクトリ目的（package-templates から配布する CI 統合例。利用者は自プロジェクトに合った CI 設定を選択・カスタマイズする）
  3. `## ディレクトリ構成`（`github-actions/` の説明、将来 GitLab CI / CircleCI 追加予定）
  4. `## 思想`（AI 内部ループ（fast）+ PR Gate（full）のハイブリッド、philosophy への参照）
  5. `## カスタマイズ指針`（パッケージマネージャ・Node version・任意ツール有効化）
  6. `## なぜ「example」扱いか`（CI ツール非依存性・汎用ファースト原則）
  7. `## 出典`（Doc #2 の CI YAML 節を出典として明示）
- 行数: 60-200 行

## File Scope（変更許可範囲）

- 作成: `package-templates/ci-examples/README.md`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル
- `package-templates/ci-examples/` 配下の YAML（TASK-0006, TASK-0007 担当）
- 計画ドキュメント（TASK-0009 担当）
- SAGE 内部物全般

## 禁止事項

PLAN-0002 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等固有語の使用
- `github-actions/` 以外の CI ツールを「対応済」と書く（実際に YAML がないため誇大表記回避）
- philosophy ドキュメントの内容をコピペで再記述（参照リンクで誘導）
- 「絶対に動く」「100% 安全」等の過剰な保証表現
- TODO / FIXME を残す
- File Scope 外への書き込み

## 完了条件

- [ ] AC: `ls package-templates/ci-examples/README.md` が成功
- [ ] AC: ファイル冒頭が `# CI Examples` で始まる（`head -1 package-templates/ci-examples/README.md | grep -q "^# CI Examples"`）
- [ ] AC: `## 思想` セクションが存在（`grep -q "^## 思想" package-templates/ci-examples/README.md`）
- [ ] AC: `## カスタマイズ指針` セクションが存在（`grep -q "^## カスタマイズ指針" package-templates/ci-examples/README.md`）
- [ ] AC: 「example」扱いの理由が言及されている（`grep -qE "example|汎用|CI ツール" package-templates/ci-examples/README.md`）
- [ ] AC: 出典として Doc #2 への参照（`grep -qE "c3e549660ca44005a20c4f6fdb54c8d5|Doc #2|AI エージェント開発診断" package-templates/ci-examples/README.md`）
- [ ] AC: gakuten 固有語が含まれない
- [ ] AC: secret / token パターンが含まれない
- [ ] AC: ファイル行数が範囲内（`L=$(wc -l < package-templates/ci-examples/README.md); test $L -ge 50 -a $L -le 250`）

## Done Definition（ラウンド単位）

参照: SPEC-0002 受け入れ条件 AC-01..AC-10 のうち本 TASK 対象は AC-01（部分）, AC-04, AC-06, AC-07, AC-10（部分）。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0002 および PLAN-0002 から以下を継承する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0002 §Quality Gate マッピング | Gate 1 / 4（README は文書、Functional は限定的） |
| テスト種別 | PLAN-0002 §必要な検証 | structural test |
| カバレッジ閾値 | SPEC-0002 §非機能要件 NFR-04 | N/A |
| commit-msg hook | SPEC-0002 §契約 | 各 commit に TASK-0008 を含める |
| Error Resolution | SPEC-0002 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0002 §Knowledge Management | 計画 vs 実装乖離アンチパターンへの寄与 |
| 採用メトリクス | PLAN-0002 §採用メトリクス | TASK 完了 + 該当 AC 全 pass |
| 段階移行 | PLAN-0002 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0002 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/ci-examples/README.md` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
