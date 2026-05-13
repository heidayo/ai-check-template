# PLAN-0002: package-templates/ci-examples/ 整備実行計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0002 |
| SPEC-ID   | SPEC-0002 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [x] infra（package 配布物の構造整備。`ci-examples/` を新規追加し、利用者の CI 統合を支援）
- [ ] test

**該当レイヤなし項目の理由**: 純設定ファイル + ドキュメントのみ。実行コード・テストコード・ビジネスロジックを含まない。

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package-templates/ci-examples/` | **新規作成**（ディレクトリ + 3 ファイル: README + 2 YAML） |
| `package-templates/README.md` | **既存更新**（想定構造に `ci-examples/` 追加） |
| ルート `README.md` | **既存更新**（提供物リストに CI 統合例を追加） |
| `.claude/rules/ai-check-template.md` | **既存更新**（配布物リスト + 提供物セクションに追加） |
| `package-templates/docs/philosophy/` | **影響なし**（SPEC-0001 確定済、参照のみ） |
| 既存ソースコード | **影響なし**（実行コードが存在しない） |
| `CLAUDE.md` / `AGENTS.md` / `sage/` / `.sage/` / `templates/hooks/` | **変更禁止**（SAGE 内部物） |
| 本リポ自身の `.github/workflows/` | **対象外**（配布物 vs リポ運用の分離） |

## 実装方針

### 全体方針

SPEC-0002 のスコープ通り、3 つの新規ファイル + 3 つの既存ファイル更新を独立 TASK として実装する。Big Bang Prompt（SAGE anti-pattern）を避けるため、1 ファイル = 1 TASK とし、最後に整合性検証 TASK を置く。

新規ファイルは互いに独立しており並列実装可能。既存ファイル更新は内容の整合が必要なので 1 TASK にまとめる（3 ファイルの「ci-examples 追加」変更は同じ意味論で、別々に書くと不整合リスクが上がる）。

### 採用案: 並列 5 TASK 構成

| TASK | 責務 | 依存 | 並列可否 |
|---|---|---|---|
| TASK-0006 | `ci-examples/github-actions/ai-check.yml` 作成（full check） | none | Yes |
| TASK-0007 | `ci-examples/github-actions/ai-check-fast.yml` 作成（fast check） | none | Yes |
| TASK-0008 | `ci-examples/README.md` 作成 | none | Yes |
| TASK-0009 | 計画ドキュメント 3 ファイル更新（`README.md` / `package-templates/README.md` / `.claude/rules/ai-check-template.md`） | none | Yes |
| TASK-0010 | AC-01..AC-10 機械検証 + 計画ドキュメント整合手動レビュー | TASK-0006..0009 | No（最終） |

### 依存グラフ

```
TASK-0006  ─┐
TASK-0007  ─┼─→ TASK-0010
TASK-0008  ─┤
TASK-0009  ─┘
```

TASK-0006..0009 は完全独立で並列実行可能。TASK-0010 は前 4 つすべての完了を待つ。

### 不採用案

| 案 | 内容 | 不採用理由 |
|---|---|---|
| 案 B | 1 TASK で全 6 ファイル一括（3 新規 + 3 更新） | Big Bang Prompt anti-pattern。1 TASK が複数責務 |
| 案 C | 各計画ドキュメント更新を別 TASK（3 TASK に分割） | 同じ意味論の変更を分散させると整合性が崩れやすい。1 TASK にまとめる方が安全 |
| 案 D | YAML 2 つを 1 TASK にまとめる | full と fast は独立した workflow で並列実装可能。分けた方が File Scope が綺麗 |
| 案 E | 計画ドキュメント更新を別 SPEC | SPEC-0002 のスコープに既に明示。別 SPEC 化は overhead 増 |

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0006 | `ai-check.yml` 作成（full check workflow） | Implementation | 30m | none | Yes |
| TASK-0007 | `ai-check-fast.yml` 作成（fast check workflow） | Implementation | 20m | none | Yes |
| TASK-0008 | `ci-examples/README.md` 作成（目的・カスタマイズ指針） | Implementation | 30m | none | Yes |
| TASK-0009 | 計画ドキュメント 3 ファイル更新（CI 統合言及追加） | Implementation | 30m | none | Yes |
| TASK-0010 | SPEC-0002 AC-01..AC-10 機械検証 + 整合手動レビュー | Test / Review | 20m | TASK-0006..0009 | No |

合計見積: 並列実行で 30m（最長 TASK）+ 20m = 約 50m。逐次実行なら約 2h10m。

## リスク

SPEC-0002 のリスク 5 件を継承。PLAN 固有のリスクを追加。

- リスク1（SPEC 継承）: GitHub Actions が将来 v6 等になり syntax が変わる
- リスク2（SPEC 継承）: pnpm 以外を使うプロジェクトで動かない
- リスク3（SPEC 継承）: `pnpm ai:check` が存在しないと CI が即 fail
- リスク4（SPEC 継承）: 計画 vs 実装の乖離アンチパターンが繰り返される
- リスク5（SPEC 継承）: GitHub Actions に縛られた設計が他 CI へ移植困難
- **リスク6（PLAN 固有）**: TASK-0006..0009 を並列実装中、TASK-0008（README）と TASK-0009（計画ドキュメント）で説明文に乖離 → 軽減策: 各 TASK 指示文に SPEC-0002 §背景・目的の引用を必須化
- **リスク7（PLAN 固有）**: TASK-0010 で AC が複数失敗するとロールバック範囲が広がる → 軽減策: 各 TASK の完了条件に該当 AC subset を含める
- **リスク8（PLAN 固有）**: 並列実行中の File Scope 違反 → 軽減策: 各 TASK の File Scope を 1 ファイル（または論理的に 1 セット）に限定。SAGE `check-file-scope` hook で検出

## 必要な検証

- [x] **structural test**: SPEC-0002 AC-01..AC-04, AC-07, AC-10（ファイル存在・YAML 構文・H1 タイトル・gakuten 固有語不在・ディレクトリ配置）
- [ ] unit test: **N/A** — 実行コードが存在しない
- [ ] integration test: **N/A** — 同上
- [ ] e2e test: **N/A** — 同上（GitHub Actions 実走は本 SPEC のスコープ外。dogfooding 時に実プロジェクトで verify）
- [x] **architecture boundary check**: SPEC-0002 Properties INV-01..INV-04（配布物分離、secret 不在、CI 不問の独立性）→ Gate 4
- [x] **security scan**: SEC-01 / AC-06 で機械検証（secret 直書き不在）→ Gate 3
- [x] **functional verify**: AC-05, AC-08（YAML が `pnpm ai:check` / `pnpm ai:check:fast` を呼ぶ）
- [x] **計画整合 verify**: AC-09（3 計画ドキュメントに `ci-examples` 言及あり）

## CLAUDE.md / .claude/rules/ 連携

SPEC-0002 のセクションを継承。実装エージェントは `.claude/rules/ai-check-template.md` の汎用ファースト原則・言語規約に従う。本 PLAN は CLAUDE.md への追記なし。

## Forbidden Shortcuts

SPEC-0002 のセクションを継承。PLAN 固有の禁止事項:

- TASK-0006..0009 を 1 つの巨大プロンプトで一括実装しない（4 TASK は独立）
- TASK-0010 完了前に SPEC-0002 を Approved に変更しない
- 並列実行中に他 TASK のファイルを参照しない
- 計画ドキュメント更新（TASK-0009）で CI 統合以外の文言を改変しない

## Quality Gate マッピング

SPEC-0002 のマッピングを継承。

| Gate | 対応 TASK | 検証コマンド |
|---|---|---|
| Gate 1: Structural | 各 TASK / TASK-0010 | `ls`, `head`, `grep`, `wc` |
| Gate 2: Functional | TASK-0010 | `grep` で `pnpm ai:check` 呼び出し / `ci-examples` 言及 |
| Gate 3: Security | TASK-0010 | `grep -iE` で secret パターン不在 |
| Gate 4: Architecture | 各 TASK / TASK-0010 | `find` で `ci-examples/` が正しい配置 |
| Gate 5: Release | N/A | Phase 0 では対象外 |

## Error Resolution

SPEC-0002 のセクションを継承 + PLAN 固有:

- TASK-0006..0009 のいずれかが失敗 → 該当 TASK のみ rollback、再実装、他 TASK は影響なし
- TASK-0010 失敗 → 失敗 AC を特定し SPEC-0002 Error Resolution 表に従う
- 連続 3 回同じ TASK が失敗 → `same_fail_abort_threshold: 3` で human escalation

## Knowledge Management

SPEC-0002 のセクションを継承。PLAN レベルの追加:

| シナリオ | 記録先 | 責任者 | タイミング |
|---|---|---|---|
| TASK-0009（計画ドキュメント更新）で予期せぬ箇所を改変 | `sage/failures.md` | 実装エージェント（自動検出） + オーナー（承認） | 検出時 |
| YAML が複数の dogfooding プロジェクトで動かない | `sage/failures.md` → 3 回累積で `sage/anti-patterns.md` 昇格候補 | リポオーナー | Phase 1 中 |

## 採用メトリクス（合格基準）

SPEC-0002 から継承 + PLAN レベル:

| メトリクス | 合格基準 | 計測方法 |
|---|---|---|
| TASK 完了率 | TASK-0006..0010 全 Done | `ls tasks/TASK-{0006..0010}*.md` + ステータス確認 |
| Gate 通過率 | Gate 1, 2, 3, 4 全 pass | TASK-0010 で AC-01..AC-10 全 pass |
| 並列実行効率 | 並列実行時 50m 以内で完了 | RUN-ID の開始/完了時刻 |
| dogfooding 採用率（Phase 1） | 50%+ | 手動カウント |

## 段階移行（昇格条件）

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Draft → PLAN Active | 本 PLAN が `/sage-evaluate` で 95+ 採点 | `bash scripts/sage-validate.sh` + 自己採点 |
| PLAN Active → TASK 並列実行開始 | TASK-0006..0010 すべて Pending 状態で起票済 | `ls tasks/TASK-{0006..0010}*.md \| wc -l` で 5 を得る |
| TASK 全完了 → PLAN Completed | TASK-0006..0010 全 Done + TASK-0010 で AC 全 pass | `grep -l "ステータス.*Done" tasks/TASK-{0006..0010}*.md \| wc -l` で 5 を得る |
| PLAN Completed → SPEC-0002 Approved | PLAN-0002 status: Completed + SPEC-0002 AC 全 pass | `grep "ステータス" specs/SPEC-0002*.md` で Approved |
| Phase 0 サブ成果物 1/7 → 2/7 | SPEC-0002 Approved | サブ成果物カウント |

## ロールバック手順

SPEC-0002 のセクションを継承 + PLAN 固有:

| 失敗レベル | ロールバック手順 |
|---|---|
| Level 1: 単一 TASK 失敗 | 該当 TASK のファイルのみ `git checkout HEAD -- <file>` で復元、TASK 再実行 |
| Level 2: 複数 TASK 失敗 / TASK-0010 で複数 AC 失敗 | `git checkout HEAD -- package-templates/ci-examples/ README.md package-templates/README.md .claude/rules/ai-check-template.md` で復元、PLAN を再評価 |
| Level 3: PLAN レベルの方針誤り | PLAN-0002 を Deprecated、SPEC-0002 を Draft に戻し、新規 PLAN として再起票 |

## 関連ID

- SPEC-ID: SPEC-0002
- 依存 SPEC: SPEC-0001（philosophy docs が存在）
- TASK-ID: TASK-0006, TASK-0007, TASK-0008, TASK-0009, TASK-0010
