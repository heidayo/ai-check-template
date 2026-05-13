# PLAN-0003: ai:check 実行スタック実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0003 |
| SPEC-ID   | SPEC-0003 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller / usecase / domain / infrastructure / frontend / test
- [x] infra（package 配布物の追加：scripts/ + .claude/ + package.scripts.fragment.json）

純配布物追加のみ。実行コード・テストコード・ビジネスロジックなし。

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package-templates/scripts/` | **新規作成**（3 ファイル） |
| `package-templates/.claude/` | **新規作成**（3 ファイル） |
| `package-templates/package.scripts.fragment.json` | **新規作成**（1 ファイル） |
| `package-templates/{docs/philosophy, ci-examples}/` | **影響なし**（参照のみ） |
| 本リポ自身の `.claude/settings.json`, `scripts/`, `package.json` | **変更禁止** |
| SAGE 内部物 | **変更禁止** |

## 実装方針

### 全体方針

SPEC-0003 のスコープ 7 ファイルを **4 つの論理 TASK** で実装する。1 TASK = 1 ディレクトリ（または 1 単独ファイル）= 1 責務単位として File Scope を絞る。

### 採用案: 4 TASK 構成

| TASK | 責務 | File Scope | 依存 | 並列可否 |
|---|---|---|---|---|
| TASK-0011 | `scripts/` 配下 3 ファイル作成（ai-check.sh + ai-check-fast.sh + README.md） | `package-templates/scripts/{ai-check.sh, ai-check-fast.sh, README.md}` | none | Yes |
| TASK-0012 | `.claude/` 配下 3 ファイル作成（rules/test-rules.md + settings.hook-fragment.json + README.md） | `package-templates/.claude/{rules/test-rules.md, settings.hook-fragment.json, README.md}` | none | Yes |
| TASK-0013 | `package.scripts.fragment.json` 作成 | `package-templates/package.scripts.fragment.json` | none | Yes |
| TASK-0014 | AC-01..AC-14 機械検証 + 整合手動レビュー | 検証のみ（書き込みなし） | TASK-0011..0013 | No（最終） |

### 依存グラフ

```
TASK-0011  ─┐
TASK-0012  ─┼─→ TASK-0014
TASK-0013  ─┘
```

### 不採用案

| 案 | 内容 | 不採用理由 |
|---|---|---|
| 案 B | 1 TASK で全 7 ファイル | Big Bang Prompt anti-pattern |
| 案 C | 7 TASK（1 ファイル = 1 TASK） | 過剰分割。同ディレクトリ内ファイルは整合性が必要で、まとめた方が良い |
| 案 D | hook と scripts を 1 TASK | 別ディレクトリで概念も別。混ぜると File Scope が広がる |

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0011 | scripts/ 配下 3 ファイル作成 | Implementation | 40m | none | Yes |
| TASK-0012 | .claude/ 配下 3 ファイル作成 | Implementation | 50m | none | Yes |
| TASK-0013 | package.scripts.fragment.json 作成 | Implementation | 15m | none | Yes |
| TASK-0014 | AC 機械検証 + 整合レビュー | Test / Review | 25m | TASK-0011..0013 | No |

合計見積: 並列実行で 50m + 25m = 約 1h15m。

## リスク

SPEC-0003 のリスク 5 件を継承。PLAN 固有:

- **リスク6（PLAN 固有）**: 並列実装中に hook 設定と scripts のコマンドが食い違う（TASK-0011 と TASK-0012 の独立性が裏目） → 軽減策: SPEC-0003 §推奨実装骨格を各 TASK に引用させ、コマンド文字列を統一
- **リスク7（PLAN 固有）**: README で他ディレクトリへの参照リンクが壊れる → 軽減策: TASK-0014 の手動レビューで相互リンク確認

## 必要な検証

- [x] structural test: AC-01..AC-04, AC-09, AC-10
- [x] syntax check: AC-02 (`bash -n`), AC-03 (`jq empty`)
- [x] functional verify: AC-05..AC-08
- [x] security scan: AC-11, AC-12 (Gate 3)
- [x] architecture boundary: AC-13 (Gate 4)
- [ ] unit / integration / e2e: **N/A**（実行コードなし）
- [x] 整合手動 review: hook command と scripts コマンドの一致

## CLAUDE.md / .claude/rules/ 連携

SPEC-0003 のセクションを継承。

## Forbidden Shortcuts

SPEC-0003 のセクションを継承 + PLAN 固有:
- TASK-0011..0013 を 1 セッションで「ついでに」実装しない（並列性を活かす、または明確に順次）
- TASK-0014 完了前に SPEC-0003 を Approved に変更しない

## Quality Gate マッピング

SPEC-0003 のマッピングを継承。

| Gate | 対応 TASK |
|---|---|
| Gate 1: Structural | 各 TASK / TASK-0014 |
| Gate 2: Functional | TASK-0014 |
| Gate 3: Security | TASK-0014 |
| Gate 4: Architecture | 各 TASK / TASK-0014 |
| Gate 5: Release | N/A |

## Error Resolution

SPEC-0003 のセクションを継承。

## Knowledge Management

SPEC-0003 のセクションを継承。PLAN 固有:

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| 並列 TASK で hook と scripts のコマンド不一致 | `sage/failures.md` | 検証者（TASK-0014）+ オーナー |
| README 相互リンク切れ 3 回累積 | `sage/anti-patterns.md` 昇格候補 | オーナー |

## 採用メトリクス

SPEC-0003 から継承 + PLAN レベル:

| メトリクス | 合格基準 |
|---|---|
| TASK 完了率 | TASK-0011..0014 全 Done |
| Gate 通過率 | Gate 1, 2, 3, 4 全 pass |
| 並列実行効率 | 並列で 1h15m 以内 |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| PLAN Draft → Active | 95+ 採点 |
| TASK 全完了 → PLAN Completed | TASK-0011..0014 全 Done + AC pass |
| PLAN Completed → SPEC-0003 Approved | PLAN Completed |
| Phase 0 サブ成果物 2/7 → 5/7 | SPEC-0003 Approved |

## ロールバック手順

SPEC-0003 のセクションを継承:

| Level | 手順 |
|---|---|
| Level 1 | 単一 TASK ファイルのみ復元 |
| Level 2 | `package-templates/scripts/ package-templates/.claude/ package-templates/package.scripts.fragment.json` 一括復元 |
| Level 3 | SPEC-0003 を Draft に戻し再起票 |

## 関連ID

- SPEC-ID: SPEC-0003
- 依存 SPEC: SPEC-0001, SPEC-0002
- TASK-ID: TASK-0011, TASK-0012, TASK-0013, TASK-0014
