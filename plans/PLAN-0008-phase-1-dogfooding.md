# PLAN-0008: Phase 1 dogfooding 運用ルール 実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0008 |
| SPEC-ID   | SPEC-0008 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra（project doc の追加、`docs/` 配下）

## 影響範囲

| 対象 | 影響 |
|---|---|
| `docs/phase-1-dogfooding-protocol.md` | **新規作成** |
| `docs/phase-1-feedback-template.md` | **新規作成** |
| 既存 `docs/{claude-collaboration-brief,codex-delegation-packet}.md` | 影響なし（SAGE 管理、gitignored） |
| その他 | 変更禁止 |

## 実装方針

### 採用案: 3 TASK 構成

| TASK | 責務 | File Scope | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0026 | dogfooding-protocol.md 作成 | `docs/phase-1-dogfooding-protocol.md` | none | Yes |
| TASK-0027 | feedback-template.md 作成 | `docs/phase-1-feedback-template.md` | none | Yes |
| TASK-0028 | AC 検証 + 整合手動レビュー | 検証のみ | TASK-0026, TASK-0027 | No |

### 依存グラフ
```
TASK-0026  ─┐
TASK-0027  ─┴─→ TASK-0028
```

### 不採用案

- 1 TASK で 2 ファイル → Big Bang
- protocol.md 内に template を埋め込む → コピペで使いにくい

## タスク分解

| TASK-ID | 責務 | 見積 | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0026 | protocol.md 作成 | 50m | none | Yes |
| TASK-0027 | feedback-template.md 作成 | 30m | none | Yes |
| TASK-0028 | AC 検証 | 15m | TASK-0026..0027 | No |

合計: 並列で 50m + 15m = 65m。

## リスク

SPEC-0008 のリスク 5 件を継承。

## 必要な検証

- [x] structural test: AC-01..AC-04
- [x] functional verify: AC-05..AC-07
- [x] architecture: AC-08, AC-09 (Gate 4)
- [ ] security scan: N/A（SEC-01）
- [ ] unit / integration / e2e: N/A
- [x] 整合手動 review: protocol と template の相互参照

## CLAUDE.md / .claude/rules/ 連携
SPEC-0008 を継承。

## Forbidden Shortcuts
SPEC-0008 を継承。

## Quality Gate マッピング
SPEC-0008 を継承。

## Error Resolution
SPEC-0008 を継承。

## Knowledge Management
SPEC-0008 を継承。

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0026..0028 全 Done |
| Gate 通過率 | Gate 1, 2, 4 全 pass |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 全完了 → PLAN Completed | TASK-0026..0028 Done |
| PLAN Completed → SPEC Approved | PLAN Completed |
| Phase 1 開始 | SPEC-0008 Approved |

## ロールバック
SPEC-0008 を継承。

## 関連ID
- SPEC: SPEC-0008
- TASK: TASK-0026, TASK-0027, TASK-0028
