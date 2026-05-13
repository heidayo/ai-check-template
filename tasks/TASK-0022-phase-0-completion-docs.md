# TASK-0022: Phase 0 完了反映の 3 ファイル更新 + AC 検証

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0022 |
| SPEC-ID | SPEC-0006 |
| PLAN-ID | PLAN-0006 |
| ステータス | Done |
| 担当 | Implementation + Test |
| 並列可否 | No（単発） |
| 依存 | none |
| 見積 | 20m |

## 責務

`README.md` / `package-templates/README.md` / `.claude/rules/ai-check-template.md` の Phase 0 ステータスを「完了」に更新し、SPEC-0006 AC-01..AC-06 を機械検証する。

## 入力

- SPEC-0006 §実装メモ §変更箇所（具体）

## 出力

- 3 ファイルそれぞれで Phase 0 行が「進行中」から「完了」相当に更新
- AC 全 pass

## File Scope

- 変更: `README.md`, `package-templates/README.md`, `.claude/rules/ai-check-template.md`
- 作成/削除: なし

**変更禁止**: 上記 3 ファイル以外、SAGE 内部物、他 SPEC/PLAN/TASK 成果物

## 禁止事項

PLAN-0006 §Forbidden Shortcuts 継承 + 固有:
- 3 ファイル以外の改変
- Phase 1 を「進行中」と虚偽記載
- gakuten 等固有語の新規追加
- 該当行以外の編集（他セクション、他 Phase の行）
- 「絶対完了」「100% perfect」等過剰保証

## 完了条件

- [ ] AC-01: 3 ファイルすべて存在（git diff で確認）
- [ ] AC-02: Phase 0 行に「完了」または「Completed」または「✅」。表形式（`| 0 |`）/ 本文形式（`Phase 0`）両方許容（`grep -E "(Phase 0|^\| 0 )" README.md package-templates/README.md .claude/rules/ai-check-template.md | grep "完了" | cut -d: -f1 | sort -u | wc -l` が 3）
- [ ] AC-03: 各 Phase 0 行から「進行中」が消えている
- [ ] AC-04: 差分に新規 gakuten 固有語なし（`git diff HEAD -- <files> | grep "^+" | grep -v "^+++" | grep -iE "gakuten|学生転職|apps/web|web_ipo|academy|internships"` が空）
- [ ] AC-05: 差分行数が +1..+15 各ファイル（`git diff --stat HEAD -- <files>`）
- [ ] AC-06: `git diff --name-only HEAD` の結果が 3 ファイルのみ

## Done Definition
SPEC-0006 AC-01..AC-06 全 pass。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0006（Gate 1/2/4） |
| テスト種別 | structural + grep + diff |
| カバレッジ | N/A |
| commit-msg hook | TASK-0022 |
| Error Resolution | SPEC-0006 |
| failures/anti-patterns | PLAN-0006 |
| 採用メトリクス | PLAN-0006 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1: 該当ファイル個別復元 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
