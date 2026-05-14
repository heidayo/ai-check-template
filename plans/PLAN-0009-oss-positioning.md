# PLAN-0009: OSS positioning 実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0009 |
| SPEC-ID   | SPEC-0009 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra（OSS 公開向けドキュメント・ガバナンス整備）

## 影響範囲

| 対象 | 影響 |
|---|---|
| `README.md` | **全面刷新**（英語 Primary） |
| `README-ja.md` | **新規作成**（日本語版） |
| `docs/vision.md` / `docs/roadmap.md` | 新規作成 |
| `.github/ISSUE_TEMPLATE/` 配下 | 新規作成（4 ファイル） |
| `.github/PULL_REQUEST_TEMPLATE.md` | 新規作成 |
| `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `SECURITY.md` | 新規作成 |
| 配布物・SAGE 管理ファイル | 変更禁止 |

## 実装方針

### 採用案: 5 TASK 構成

| TASK | 責務 | 主要ファイル | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0029 | README.md 刷新 + README-ja.md | `README.md`, `README-ja.md` | none | Yes |
| TASK-0030 | vision + roadmap | `docs/vision.md`, `docs/roadmap.md` | none | Yes |
| TASK-0031 | Issue / PR テンプレート | `.github/ISSUE_TEMPLATE/*.md`, `.github/PULL_REQUEST_TEMPLATE.md` | none | Yes |
| TASK-0032 | ガバナンス文書 | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` | none | Yes |
| TASK-0033 | AC 検証 + 整合手動レビュー | 検証のみ | TASK-0029..0032 | No |

### 依存グラフ
```
TASK-0029  ─┐
TASK-0030  ─┤
TASK-0031  ─┼─→ TASK-0033
TASK-0032  ─┘
```

### 不採用案
- 1 TASK で 12 ファイル → Big Bang
- 12 TASK（1 ファイル 1 TASK）→ 過剰分割、同種ファイル群を 1 TASK でまとめる方が整合性確保しやすい

## タスク分解

| TASK-ID | 責務 | 見積 | 依存 | 並列 |
|---|---|---|---|---|
| TASK-0029 | README × 2 | 80m | none | Yes |
| TASK-0030 | vision + roadmap | 50m | none | Yes |
| TASK-0031 | Issue + PR テンプレ | 45m | none | Yes |
| TASK-0032 | ガバナンス 3 ファイル | 60m | none | Yes |
| TASK-0033 | AC 検証 | 20m | TASK-0029..0032 | No |

合計: 並列で 80m + 20m = 100m。

## リスク

SPEC-0009 のリスク 5 件を継承。PLAN 固有:
- リスク6: 並列実装で各 TASK 間の文言・トーン不揃い → 軽減策: SPEC-0009 §実装メモ §README.md 推奨構造 を全 TASK 指示文に引用

## 必要な検証

- [x] structural test: AC-01..AC-06
- [x] functional verify: AC-07..AC-10
- [x] security: AC-11, AC-12 (Gate 3)
- [x] architecture: AC-13 (Gate 4)
- [x] unit / integration / e2e: N/A

## CLAUDE.md / .claude/rules/ 連携
SPEC-0009 を継承。

## Forbidden Shortcuts
SPEC-0009 を継承 + PLAN 固有:
- 4 TASK を 1 セッションで「ついで」実装しない（並列性を意識）
- TASK-0033 完了前に SPEC-0009 を Approved に変更しない

## Quality Gate マッピング
SPEC-0009 を継承。

## Error Resolution
SPEC-0009 を継承。

## Knowledge Management
SPEC-0009 を継承。

## 採用メトリクス
SPEC-0009 を継承 + PLAN レベル:

| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0029..0033 全 Done |
| Gate 通過率 | Gate 1, 2, 3, 4 全 pass |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 全完了 → PLAN Completed | TASK-0029..0033 Done |
| PLAN Completed → SPEC Approved | PLAN Completed |
| OSS positioning 完了 | SPEC-0009 Approved |

## ロールバック
SPEC-0009 を継承。

## 関連ID
- SPEC: SPEC-0009
- TASK: TASK-0029..0033
