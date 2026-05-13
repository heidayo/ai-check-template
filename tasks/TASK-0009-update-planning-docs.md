# TASK-0009: 計画ドキュメント 3 ファイル更新（ci-examples 追加）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0009 |
| SPEC-ID   | SPEC-0002 |
| PLAN-ID   | PLAN-0002 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0006, TASK-0007, TASK-0008 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 30m |

## 責務

3 つの計画ドキュメント（`README.md` / `package-templates/README.md` / `.claude/rules/ai-check-template.md`）に `ci-examples/` への言及を追加し、Phase 0 のサブ成果物が 8 つになることを明示する。

3 ファイルを 1 TASK にまとめる理由: 同じ意味論の変更（「ci-examples/ をサブ成果物として追加」）を 3 ファイルに反映する作業で、別 TASK に分けると整合性リスクが上がる（PLAN-0002 §不採用案 C 参照）。

## 入力

- SPEC-0002 §背景・目的、§スコープ（含む）、§実装メモ §計画ドキュメント更新（必須）
- PLAN-0002 §実装方針
- 既存ファイルの現状内容（更新前の状態を読み込んで差分を最小化）

## 出力

更新後の 3 ファイル。各ファイルの変更内容は以下:

### 1. `package-templates/README.md`
- §「想定する構造（Phase 2 で具体化）」のコードブロックに `ci-examples/` を追加
  - 配置: `prompts/` の後、`profiles/` の前（アルファベット順を緩く維持）
  - 内訳: `github-actions/` (`ai-check.yml`, `ai-check-fast.yml`), 将来の `gitlab-ci/`, `circleci/`
- §「ステータス」の文言を必要に応じて微調整（既存「Phase 0 — 骨格設計中」は維持）

### 2. ルート `README.md`
- §「提供するもの（予定）」§2 テストフローテンプレート に「CI 統合例（GitHub Actions YAML）」を追加
  - 既存の `ai:check` / `ai:check:fast` 統合 npm script の言及の直後に挿入
- §「使い方（予定）」は変更しない（CLI 仕様は Phase 2 で確定）

### 3. `.claude/rules/ai-check-template.md`
- §「配布物と SAGE 内部物の分離」の表に `package-templates/ci-examples/` を明示
- §「提供するもの（Phase 2 で具体化）」§テストフローテンプレ に `ci-examples/github-actions/ai-check.yml`, `ai-check-fast.yml` を追加
- §「主体文書（Notion）— 設計の根拠」§2 に Doc #2 の「CI YAML 節」を本 SPEC で利用したことを補記

## File Scope（変更許可範囲）

- 作成: なし
- 変更:
  - `README.md`
  - `package-templates/README.md`
  - `.claude/rules/ai-check-template.md`
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル（`ci-examples/` 配下の YAML / README）
- 上記 3 ファイル以外のすべてのファイル
- 各 3 ファイル内で、CI 統合以外の文言を改変（既存の他セクションは触らない）
- SAGE 内部物全般
- `specs/SPEC-0002*.md` / `plans/PLAN-0002*.md`

## 禁止事項

PLAN-0002 §Forbidden Shortcuts を継承。本 TASK 固有:

- 3 ファイルで `ci-examples` の説明文に食い違いを生む（同じ意味論で書く）
- 既存のセクション順序を変更
- 既存の文言を recurrent edits でリファクタする（CI 統合追加のみが本 TASK の責務）
- ドキュメントの言語規約違反（日本語が原則）
- `Co-Authored-By` を文書内に残す
- TODO / FIXME を残す
- File Scope 外への書き込み

## 完了条件

- [ ] AC: 3 ファイルすべてが `ci-examples` を含む（`grep -l "ci-examples" README.md package-templates/README.md .claude/rules/ai-check-template.md | wc -l` で 3 を得る）
- [ ] AC: `package-templates/README.md` の構造図 Markdown コードブロックに `ci-examples/` が含まれる（`awk '/```/{f=!f;next}f' package-templates/README.md | grep -q "ci-examples"`）
- [ ] AC: ルート `README.md` の「提供するもの（予定）」セクションに CI 言及（`sed -n '/提供するもの/,/連携/p' README.md | grep -qiE "CI|GitHub Actions|ci-examples"`）
- [ ] AC: `.claude/rules/ai-check-template.md` の「配布物と SAGE 内部物の分離」表に `ci-examples` 言及（`grep -A 5 "配布物と SAGE 内部物" .claude/rules/ai-check-template.md | grep -q "ci-examples"` または同等の確認）
- [ ] AC: 3 ファイルで gakuten 固有語が**新規追加**されていない（既存にあった場合は触らない方針、`git diff HEAD -- <3 files> | grep -iE "gakuten|学生転職|apps/web|web_ipo|academy|internships" | grep "^+" | grep -v "^+++"` が空）
- [ ] AC: 3 ファイルの行数が極端に増減していない（各ファイル: 差分が +5..+30 行程度。`git diff --stat HEAD -- README.md package-templates/README.md .claude/rules/ai-check-template.md` で確認）

## Done Definition（ラウンド単位）

参照: SPEC-0002 受け入れ条件 AC-09（3 計画ドキュメントに `ci-examples` 言及）が本 TASK の主目的。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0002 および PLAN-0002 から以下を継承する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0002 §Quality Gate マッピング | Gate 1 / 2（計画と実装の整合性） |
| テスト種別 | PLAN-0002 §必要な検証 | structural test + 計画整合 verify |
| カバレッジ閾値 | SPEC-0002 §非機能要件 NFR-04 | N/A |
| commit-msg hook | SPEC-0002 §契約 | 各 commit に TASK-0009 を含める |
| Error Resolution | SPEC-0002 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0002 §Knowledge Management | 計画 vs 実装乖離アンチパターン解消の本丸 |
| 採用メトリクス | PLAN-0002 §採用メトリクス | TASK 完了 + AC-09 pass |
| 段階移行 | PLAN-0002 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0002 §ロールバック手順 | Level 2: 3 ファイル一括復元 `git checkout HEAD -- README.md package-templates/README.md .claude/rules/ai-check-template.md` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
