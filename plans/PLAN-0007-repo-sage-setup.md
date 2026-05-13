# PLAN-0007: 本リポ SAGE 環境整備 実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0007 |
| SPEC-ID   | SPEC-0007 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra（本リポ自身の SAGE 設定整備）

## 影響範囲

| 対象 | 影響 |
|---|---|
| `CLAUDE.md` | **更新**（10 必須セクション追記、auto-injected ブロック保持） |
| `.sage/config.yaml` | **更新**（project_checks コメントアウト + Phase 2 メモ） |
| 配布物 / SAGE 管理ファイル | 変更禁止 |

## 実装方針

### 採用案: 3 TASK 構成

| TASK | 責務 | File Scope | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0023 | CLAUDE.md に 10 必須セクション + Error Context Template 追加 | `CLAUDE.md` | none | Yes |
| TASK-0024 | `.sage/config.yaml` project_checks コメントアウト + Phase 2 メモ | `.sage/config.yaml` | none | Yes |
| TASK-0025 | AC 検証（sage-validate.sh 含む） | 検証のみ | TASK-0023, TASK-0024 | No |

### 依存グラフ
```
TASK-0023  ─┐
TASK-0024  ─┴─→ TASK-0025
```

### 不採用案
- 1 TASK で 2 ファイル → Big Bang。CLAUDE.md と config.yaml は責務が違うので分離
- 2 TASK（impl + verify を分けずに inline）→ verify を独立 TASK にしないと AC 漏れリスク

## タスク分解

| TASK-ID | 責務 | 見積 | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0023 | CLAUDE.md 更新 | 50m | none | Yes |
| TASK-0024 | .sage/config.yaml 更新 | 15m | none | Yes |
| TASK-0025 | AC 検証 | 20m | TASK-0023, TASK-0024 | No |

合計: 並列で 50m + 20m = 70m。

## リスク

SPEC-0007 のリスク 4 件を継承 + PLAN 固有:
- リスク5: TASK-0023 で auto-injected ブロックを誤って改変 → 軽減策: SPEC-0007 INV-02 を AC で機械検証（AC-03）

## 必要な検証

- [x] structural test: AC-01..AC-05
- [x] functional verify: AC-06, AC-07（sage-validate.sh 実行）
- [x] security: AC-08
- [x] architecture: AC-09
- [ ] unit / integration / e2e: N/A
- [x] sage-validate.sh: 本 PLAN の中心的検証

## CLAUDE.md / .claude/rules/ 連携

SPEC-0007 を継承。本 PLAN は CLAUDE.md を更新する（user explicit instruction）。

## Forbidden Shortcuts

SPEC-0007 を継承 + PLAN 固有:
- TASK-0023 で auto-injected ブロックの位置を変更（位置不変、内容不変）
- TASK-0024 で active な Go コマンドを 1 つでも残す

## Quality Gate マッピング
SPEC-0007 を継承。

## Error Resolution
SPEC-0007 を継承。

## Knowledge Management
SPEC-0007 を継承。

## 採用メトリクス
| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0023..0025 全 Done |
| sage-validate ERRORs | 0 |
| 副作用 | 2 ファイル以外 unchanged |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 全完了 → PLAN Completed | TASK-0023..0025 Done + sage-validate pass |
| PLAN Completed → SPEC Approved | PLAN Completed |
| 本リポ SAGE 環境整備完了 | SPEC-0007 Approved |

## ロールバック
SPEC-0007 を継承。

## 関連ID
- SPEC: SPEC-0007
- TASK: TASK-0023, TASK-0024, TASK-0025
