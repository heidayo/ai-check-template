# PLAN-0006: Phase 0 完了の計画ドキュメント反映 実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0006 |
| SPEC-ID   | SPEC-0006 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra（計画ドキュメント 3 ファイルのステータス反映）

## 影響範囲

| 対象 | 影響 |
|---|---|
| `README.md` | **更新**（Phase 表 1 行） |
| `package-templates/README.md` | **更新**（ステータス文 1 段落） |
| `.claude/rules/ai-check-template.md` | **更新**（Phase 表 1 行） |
| その他 | 変更禁止 |

## 実装方針

3 ファイルすべて意味論が同じ（Phase 0 = 完了）。1 TASK でまとめて変更し、TASK 完了条件で AC-01..AC-06 を一括検証する。

### 採用案: 1 TASK 構成

| TASK | 責務 | File Scope | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0022 | 3 ファイル更新 + AC 検証 | 3 ファイル | none | No |

検証は同じ TASK で実行（小規模なため verify TASK を分けない）。

### 不採用案
- 3 TASK（1 ファイル 1 TASK）→ 過剰分割。同じ意味論の変更は 1 TASK が SAGE 推奨
- Verify TASK 分離 → 検証は 3 ファイルの grep で完結、規模相応

## タスク分解

| TASK-ID | 責務 | 見積 | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0022 | 3 ファイル更新 + 検証 | 20m | none | No（単発） |

## リスク

SPEC-0006 のリスク 3 件を継承。

## 必要な検証

- [x] structural test: AC-01..AC-04
- [x] functional verify: AC-05
- [x] architecture: AC-06
- [ ] unit / integration / e2e: N/A
- [ ] security scan: N/A（SEC-01 該当なし）

## CLAUDE.md / .claude/rules/ 連携
SPEC-0006 を継承。

## Forbidden Shortcuts
SPEC-0006 を継承。

## Quality Gate マッピング
SPEC-0006 を継承。

## Error Resolution
SPEC-0006 を継承。

## Knowledge Management
SPEC-0006 を継承。

## 採用メトリクス
| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0022 Done |
| Gate 通過率 | Gate 1, 2, 4 全 pass |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 完了 → PLAN Completed | TASK-0022 Done + AC pass |
| PLAN Completed → SPEC Approved | PLAN Completed |
| Phase 0 クロージャ完了 | SPEC-0006 Approved |

## ロールバック
SPEC-0006 を継承。

## 関連ID
- SPEC: SPEC-0006
- TASK: TASK-0022
