# PLAN-0004: prompts/ 実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0004 |
| SPEC-ID   | SPEC-0004 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra（配布物の追加：prompts/ 5 ファイル + README）
- [ ] その他レイヤは N/A（ドキュメントのみ、実行コードなし）

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package-templates/prompts/` | **新規作成**（6 ファイル） |
| その他 `package-templates/` | 影響なし |
| SAGE 内部物 | 変更禁止 |

## 実装方針

### 採用案: 4 TASK 構成

| TASK | 責務 | File Scope | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0015 | QA 技法系 4 プロンプト（decision-table / state-transition / boundary-value / rls-permission） | `package-templates/prompts/{decision-table,state-transition,boundary-value,rls-permission}.md` | none | Yes |
| TASK-0016 | プロセス系 plan-first プロンプト | `package-templates/prompts/plan-first.md` | none | Yes |
| TASK-0017 | prompts/README.md | `package-templates/prompts/README.md` | none | Yes |
| TASK-0018 | AC-01..AC-12 機械検証 + 整合手動レビュー | 検証のみ | TASK-0015..0017 | No |

### 依存グラフ
```
TASK-0015  ─┐
TASK-0016  ─┼─→ TASK-0018
TASK-0017  ─┘
```

### 不採用案

- 1 TASK で 6 ファイル → Big Bang Prompt
- 6 TASK（1 ファイル 1 TASK）→ 過剰分割、QA 技法 4 つは同パターンなので 1 TASK 内で連続生成が効率的

## タスク分解

| TASK-ID | 責務 | 見積 | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0015 | QA 4 プロンプト | 60m | none | Yes |
| TASK-0016 | plan-first プロンプト | 25m | none | Yes |
| TASK-0017 | README | 30m | none | Yes |
| TASK-0018 | 検証 | 20m | TASK-0015..0017 | No |

合計: 並列で 60m + 20m = 80m。

## リスク

SPEC-0004 のリスク 4 件を継承 + PLAN 固有:
- リスク5: 4 QA プロンプトを 1 TASK で書く際にトーン不揃い → 軽減策: 共通テンプレ構造を TASK 指示文に引用
- リスク6: README と各プロンプトで概要文が乖離 → TASK-0018 整合レビュー

## 必要な検証
- [x] structural test: AC-01..AC-04
- [x] functional verify: AC-05..AC-07
- [x] security scan: AC-10, AC-11 (Gate 3)
- [x] architecture: AC-12 (Gate 4)
- [ ] unit / integration / e2e: N/A
- [x] 整合手動 review

## CLAUDE.md / .claude/rules/ 連携

SPEC-0004 を継承。

## Forbidden Shortcuts

SPEC-0004 を継承 + PLAN 固有:
- 4 QA プロンプトを 1 ファイルにまとめる
- README 作成を後回しにしてプロンプト本文だけ commit

## Quality Gate マッピング

SPEC-0004 を継承。

## Error Resolution

SPEC-0004 を継承。

## Knowledge Management

SPEC-0004 を継承 + PLAN 固有:

| シナリオ | 記録先 |
|---|---|
| 4 QA プロンプトでトーン不揃い | `sage/failures.md`、3 回累積で anti-patterns 昇格候補 |

## 採用メトリクス
| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0015..0018 全 Done |
| Gate 通過率 | Gate 1, 2, 3, 4 全 pass |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 全完了 → PLAN Completed | TASK-0015..0018 Done |
| PLAN Completed → SPEC Approved | PLAN Completed |
| Phase 0 サブ成果物 3/7 → 4/7 | SPEC-0004 Approved |

## ロールバック
SPEC-0004 を継承。

## 関連ID
- SPEC: SPEC-0004
- TASK: TASK-0015..0018
