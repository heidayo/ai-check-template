# TASK-0023: CLAUDE.md に SAGE 必須 10 セクション + Error Context Template 追加

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0023 |
| SPEC-ID | SPEC-0007 |
| PLAN-ID | PLAN-0007 |
| ステータス | Done |

sage-managed: true
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 50m |

## 責務

`CLAUDE.md` に SAGE 必須 10 セクション + Error Context Template を追記する。auto-injected SAGE ブロックは unchanged で保持する。

## 入力

- SPEC-0007 §実装メモ §CLAUDE.md 新規セクションの推奨構造
- `sage/governance.md`（原則 / lifecycle / 役割分離 / Quality Gate 等の出典）
- `.claude/rules/ai-check-template.md`（本リポ固有原則 / 言語規約）
- `.claude/rules/sage-governance-rules.md`（言語規約・traceability）

## 出力

更新後の `CLAUDE.md`。構造:
1. H1 タイトル
2. 10 必須セクション + Error Context Template
3. auto-injected SAGE ブロック（既存、unchanged）

各セクション 10-30 行程度、合計 +100..+250 行。

## File Scope

- 変更: `CLAUDE.md`
- 作成/削除: なし

**変更禁止**: 上記以外。SAGE 内部物。auto-injected ブロックの内容。

## 禁止事項

PLAN-0007 §Forbidden Shortcuts 継承 + 固有:
- auto-injected ブロックの内容変更（コメントアウト境界 `<!-- === SAGE Development System (auto-injected) === -->` から `<!-- === End SAGE === -->` までは触らない）
- セクション順序の入れ替え（読みやすさのため上から下に推奨順序で配置）
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- secret / token の含有
- 危険コマンドの実行可能形（説明テキストで参照は許容）
- TODO / FIXME を残す

## 完了条件

- [ ] 10 セクション全て CLAUDE.md に存在（`for s in "Project Overview" "Instruction Priority" "SAGE Lifecycle Protocol" "Forbidden Shortcuts" "Error Resolution Protocol" "Agent Constraints" "File Scope Rules" "Traceability Requirements" "Quality Gate Checklist" "Language Rules"; do grep -q "$s" CLAUDE.md || exit 1; done && echo OK`）
- [ ] Error Context Template が存在（`grep -q "Error Context Template" CLAUDE.md`）
- [ ] auto-injected ブロック保持（`grep -q "<!-- === SAGE Development System (auto-injected) === -->" CLAUDE.md && grep -q "<!-- === End SAGE ===" CLAUDE.md`）
- [ ] auto-injected ブロックの内容が unchanged（`git diff HEAD -- CLAUDE.md` で auto-injected 内の追加・削除がない）
- [ ] gakuten 固有語不在
- [ ] 差分 +100..+300 行（`git diff --stat HEAD -- CLAUDE.md`）

## Done Definition
SPEC-0007 AC-01, AC-02, AC-03, AC-09, AC-10 の CLAUDE.md 部分。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0007（Gate 1/2/3/4） |
| テスト種別 | structural + sage-validate |
| カバレッジ | N/A |
| commit-msg hook | TASK-0023 |
| Error Resolution | SPEC-0007 |
| failures/anti-patterns | PLAN-0007 |
| 採用メトリクス | PLAN-0007 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1: `git checkout HEAD -- CLAUDE.md` |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
