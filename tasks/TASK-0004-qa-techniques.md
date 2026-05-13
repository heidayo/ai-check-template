# TASK-0004: qa-techniques.md 作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0004 |
| SPEC-ID   | SPEC-0001 |
| PLAN-ID   | PLAN-0001 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes（TASK-0001, TASK-0002, TASK-0003 と並列実行可能） |
| 依存TASK  | none |
| 見積     | 75m |

## 責務

`package-templates/docs/philosophy/qa-techniques.md` を新規作成し、QA 技法 6 種（同値分割・境界値分析・デシジョンテーブル・状態遷移テスト・エラー推測・チェックリストベースドテスト）の汎用ドキュメントを記述する。

## 入力

- SPEC-0001 §背景・目的、§スコープ（含む）
- PLAN-0001 §実装方針
- Notion 主体文書 Doc #3（AI 駆動開発時代に押さえる QA 技法、ページ ID: `dc8774cd03c8490688b066c2b0179cac`）の全 6 技法セクション
- 言語規約: `.claude/rules/ai-check-template.md`

## 出力

- 新規ファイル: `package-templates/docs/philosophy/qa-techniques.md`
- 構成（推奨順序）:
  1. H1: `# QA 技法`
  2. `> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）`
  3. `## 概念定義`（QA 技法が AI 駆動開発で効く理由：観点設計の土台、AI 指示の具体化）
  4. `## 1. 同値分割`（定義・例・AI 指示プロンプト例）
  5. `## 2. 境界値分析`（同上）
  6. `## 3. デシジョンテーブル`（同上、表記法含む）
  7. `## 4. 状態遷移テスト`（同上、遷移表 + 不正遷移の検証）
  8. `## 5. エラー推測`（同上、過去障害知見の取り込み）
  9. `## 6. チェックリストベースドテスト`（同上、例: 二重送信・戻る操作・通信失敗）
  10. `## AI へのテスト依頼の型`（悪い依頼 / 少し良い依頼 / さらに良い依頼の段階）
  11. `## 隣接する思想との関係`（`formal-name-match.md`, `test-pyramid.md`, `given-when-then.md` への相互リンク）
  12. `## 出典`（Notion Doc #3 のページ ID、参照日時 2026-05-13）
- 行数: 200-500 行（6 技法を扱うため他より厚め）

## File Scope（変更許可範囲）

- 作成: `package-templates/docs/philosophy/qa-techniques.md`
- 変更: なし
- 削除: なし

**変更禁止**:
- 他の TASK の対象ファイル
- `package-templates/docs/philosophy/` 以外の全ディレクトリ
- SAGE 内部物全般

## 禁止事項

PLAN-0001 §Forbidden Shortcuts を継承。本 TASK 固有:

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等特定プロジェクト固有語の使用
- 例題に gakuten 固有のドメイン（「予約人数」は元記事の例だが、「item count」「user count」等に書き換える）→ 汎用化
- 他の TASK と並列実行中に共通用語の独自定義
- `Draft v0.1` 注記の省略
- TODO / FIXME を残してコミット
- File Scope 外への書き込み
- 6 技法のうちいずれかを省略（全 6 技法カバー必須）

## 完了条件

- [ ] AC: `ls package-templates/docs/philosophy/qa-techniques.md` が成功
- [ ] AC: `head -1 package-templates/docs/philosophy/qa-techniques.md` が `# QA 技法` で始まる
- [ ] AC: `grep -q "Draft v0.1" package-templates/docs/philosophy/qa-techniques.md` が成功
- [ ] AC: `grep -q "^## 出典" package-templates/docs/philosophy/qa-techniques.md` が成功
- [ ] AC: `grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/docs/philosophy/qa-techniques.md` の出力が空
- [ ] AC: `wc -l < package-templates/docs/philosophy/qa-techniques.md` が 100..600 の範囲
- [ ] AC: `grep -q "同値分割" package-templates/docs/philosophy/qa-techniques.md` が成功（SPEC-0001 AC-08）
- [ ] AC: 6 技法すべてのセクションが存在: `grep -cE "^## (1\.|2\.|3\.|4\.|5\.|6\.)" package-templates/docs/philosophy/qa-techniques.md` が 6 を返す
- [ ] AC: `grep -q "形名参同" package-templates/docs/philosophy/qa-techniques.md` が成功（SPEC-0001 AC-05）

## Done Definition（ラウンド単位）

参照: SPEC-0001 受け入れ条件 AC-01..AC-08 のうち本 TASK 対象は AC-01..AC-08（qa-techniques.md 単体に対する subset）+ 6 技法カバレッジ追加 AC。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0001 および PLAN-0001 から以下を継承する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0001 §Quality Gate マッピング | 完了条件 AC が Gate 1 / Gate 2 / Gate 4 に対応 |
| テスト種別 | PLAN-0001 §必要な検証 | structural test のみ。unit / integration / e2e は N/A |
| カバレッジ閾値 | SPEC-0001 §非機能要件 NFR-04 | N/A。代替指標として「QA 技法 6 種」のカバー |
| commit-msg hook | SPEC-0001 §契約 | 各 commit に TASK-0004 を含める |
| Error Resolution | SPEC-0001 §Error Resolution 手順 | 完了条件失敗時の復旧手順 |
| failures.md / anti-patterns.md 連携 | PLAN-0001 §Knowledge Management | 固有語混入 3 回累積 → failures.md → anti-patterns.md 昇格候補 |
| 採用メトリクス | PLAN-0001 §採用メトリクス | TASK 完了 + 該当 AC 全 pass |
| 段階移行 | PLAN-0001 §段階移行 | Pending → In Progress → Review → Done |
| ロールバック手順 | PLAN-0001 §ロールバック手順 | Level 1: `git checkout HEAD -- package-templates/docs/philosophy/qa-techniques.md` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
