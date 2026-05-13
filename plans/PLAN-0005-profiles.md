# PLAN-0005: profiles/ 実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0005 |
| SPEC-ID   | SPEC-0005 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra（配布物の追加：profiles/ 6 ファイル）

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package-templates/profiles/` | **新規作成**（6 ファイル） |
| その他 `package-templates/` | 影響なし |
| SAGE 内部物 | 変更禁止 |

## 実装方針

### 採用案: 3 TASK 構成

| TASK | 責務 | File Scope | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0019 | 5 profile README（react-nextjs / react-vanilla / expo-rn / node-cli / supabase-rls） | `package-templates/profiles/*/README.md` | none | Yes |
| TASK-0020 | profiles/README.md（インデックス） | `package-templates/profiles/README.md` | none | Yes |
| TASK-0021 | AC 機械検証 + トーン整合手動レビュー | 検証のみ | TASK-0019, TASK-0020 | No |

### 依存グラフ
```
TASK-0019  ─┐
TASK-0020  ─┼─→ TASK-0021
```

### 不採用案
- 1 TASK で 6 ファイル → Big Bang Prompt
- 6 TASK（1 ファイル 1 TASK）→ 過剰分割、5 profile は同パターンなので 1 TASK でまとめる方が効率的かつ整合性も担保しやすい

## タスク分解

| TASK-ID | 責務 | 見積 | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0019 | 5 profile README | 75m | none | Yes |
| TASK-0020 | profiles/README.md | 25m | none | Yes |
| TASK-0021 | 検証 | 20m | TASK-0019, TASK-0020 | No |

合計: 並列で 75m + 20m = 95m。

## リスク

SPEC-0005 のリスク 4 件を継承 + PLAN 固有:
- リスク5: 5 profile を 1 TASK で書くとトーン不揃いリスク → 軽減策: 共通テンプレ構造を TASK 指示文に強制引用

## 必要な検証

- [x] structural test: AC-01..AC-04
- [x] functional verify: AC-05..AC-07
- [x] security scan: AC-09, AC-10 (Gate 3)
- [x] architecture: AC-11 (Gate 4)
- [ ] unit / integration / e2e: N/A
- [x] 整合手動 review

## CLAUDE.md / .claude/rules/ 連携
SPEC-0005 を継承。

## Forbidden Shortcuts
SPEC-0005 を継承 + PLAN 固有:
- 5 profile を別々の場所に分散
- profile README で他 profile への相互リンク忘れ

## Quality Gate マッピング
SPEC-0005 を継承。

## Error Resolution
SPEC-0005 を継承。

## Knowledge Management
SPEC-0005 を継承。

## 採用メトリクス
SPEC-0005 を継承 + PLAN レベル:

| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0019..0021 全 Done |
| Gate 通過率 | Gate 1, 2, 3, 4 全 pass |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 全完了 → PLAN Completed | TASK-0019..0021 Done |
| PLAN Completed → SPEC Approved | PLAN Completed |
| Phase 0 サブ成果物 4/7 → **7/7（完了）** | SPEC-0005 Approved |
| Phase 0 → Phase 1 dogfooding 開始 | Phase 0 全 7 完了 |

## ロールバック
SPEC-0005 を継承。

## 関連ID
- SPEC: SPEC-0005
- TASK: TASK-0019..0021
