# PLAN-0001: package-templates/docs/philosophy/ の整備実行計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0001 |
| SPEC-ID   | SPEC-0001 |
| ステータス | Completed |
| 作成日    | 2026-05-13 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [x] infra（package 配布物の構造整備。本リポは npm パッケージとして配布される予定で、`package-templates/` 配下は配布物のインフラに相当）
- [ ] test

**該当レイヤなし項目の理由**: 本 PLAN は純ドキュメント作成のみで、実行コード・テストコード・ビジネスロジックを含まない。controller/usecase/domain/infrastructure/frontend/test は変更対象外。

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package-templates/docs/philosophy/` | **新規作成**（ディレクトリ + 4 ファイル） |
| `package-templates/` 配下既存ファイル | `README.md` のみ存在、変更なし |
| `package-templates/` 配下他ディレクトリ（`docs/tools/`, `prompts/`, `profiles/`, `scripts/` 等） | 影響なし（別 SPEC で扱う） |
| 既存ソースコード | **影響なし**（実行コードが存在しない） |
| `CLAUDE.md` / `AGENTS.md` / `sage/` / `.sage/` / `templates/hooks/` | **変更禁止**（SAGE 内部物） |
| 配布物（将来 npm publish 時） | 4 ファイルが含まれる |

## 実装方針

### 全体方針

SPEC-0001 のスコープ通り、4 ファイル（`formal-name-match.md` / `test-pyramid.md` / `given-when-then.md` / `qa-techniques.md`）を独立 TASK として並列実装する。Big Bang Prompt（SAGE anti-pattern）を避けるため、1 ファイル = 1 TASK とし、最後に整合性検証 TASK を置く。

### 採用案: 並列 5 TASK 構成

| TASK | 責務 | 依存 | 並列可否 | File Scope |
|---|---|---|---|---|
| TASK-0001 | `formal-name-match.md` 作成 | none | Yes | `package-templates/docs/philosophy/formal-name-match.md` のみ |
| TASK-0002 | `test-pyramid.md` 作成 | none | Yes | `package-templates/docs/philosophy/test-pyramid.md` のみ |
| TASK-0003 | `given-when-then.md` 作成 | none | Yes | `package-templates/docs/philosophy/given-when-then.md` のみ |
| TASK-0004 | `qa-techniques.md` 作成 | none | Yes | `package-templates/docs/philosophy/qa-techniques.md` のみ |
| TASK-0005 | AC 機械検証 + 用語整合手動レビュー | TASK-0001..0004 全完了 | No（最終） | 検証スクリプト追加なし（コマンド実行のみ） |

### 依存グラフ

```
TASK-0001  ─┐
TASK-0002  ─┼─→ TASK-0005
TASK-0003  ─┤
TASK-0004  ─┘
```

TASK-0001..0004 は完全独立で並列実行可能。TASK-0005 は前 4 つすべての完了を待つ。

### 不採用案

| 案 | 内容 | 不採用理由 |
|---|---|---|
| 案 B | 1 TASK で全 4 ファイル一括作成 | Big Bang Prompt anti-pattern（`sage/anti-patterns.md` 参照）。1 TASK が複数責務を持つことを SAGE で禁止 |
| 案 C | 各ファイルをさらに sub-task に分割（H1 → H2 → 出典等） | 各 doc は 150-500 行で 1 TASK に収まる。further split は overengineering でレビューコスト増 |
| 案 D | scaffold TASK（4 空ファイル）+ content TASK（4 件）+ verify TASK の 9 TASK 構成 | scaffold と content の分離はメリット薄。AI エージェントは 1 TASK 内で完結可能 |

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0001 | `formal-name-match.md` 作成（概念定義・対応表・AI 駆動開発適用例・出典） | Implementation | 45m | none | Yes |
| TASK-0002 | `test-pyramid.md` 作成（各層定義・責務分割表・よくある失敗・出典） | Implementation | 60m | none | Yes |
| TASK-0003 | `given-when-then.md` 作成（GWT 構文・AI 指示パターン・受け入れ条件・出典） | Implementation | 45m | none | Yes |
| TASK-0004 | `qa-techniques.md` 作成（6 技法定義 + AI 指示例・出典） | Implementation | 75m | none | Yes |
| TASK-0005 | SPEC-0001 AC-01..AC-08 機械検証 + 4 文書間用語整合手動レビュー | Test / Review | 30m | TASK-0001..0004 | No |

合計見積: 並列実行で 75m（最長 TASK）+ 30m = 約 1h45m。逐次実行なら約 4h15m。

## リスク

SPEC-0001 のリスク 5 件を継承。PLAN 固有のリスクを追加。

- リスク1（SPEC-0001 継承）: ドキュメントが Phase 1 dogfooding を経ず確定すると現実と乖離する
- リスク2（SPEC-0001 継承）: 4 文書間の用語整合は機械検証できない範囲が残る
- リスク3（SPEC-0001 継承）: 4 文書のスコープが重複する
- リスク4（SPEC-0001 継承）: 実装エージェントが gakuten 固有判断を混入する
- リスク5（SPEC-0001 継承）: 主体 Notion 文書が変更される
- **リスク6（PLAN 固有）**: TASK-0001..0004 を並列実行する場合、共通用語の定義揺れが発生 → 軽減策: 各 TASK 指示文に「形名参同」「責務分割」等共通用語の SPEC-0001 §背景・目的からの引用を必須化
- **リスク7（PLAN 固有）**: TASK-0005 で AC が複数失敗するとロールバック範囲が広がる → 軽減策: 各 TASK の完了条件に該当 AC subset を含め、TASK 単位で部分検証
- **リスク8（PLAN 固有）**: 並列実行中の同一ファイルへの競合書き込み → 軽減策: TASK 毎に File Scope を 1 ファイルに限定（独立性確保）。SAGE `check-file-scope` hook で検出

## 必要な検証

- [x] **structural test**: SPEC-0001 AC-01..AC-08（ファイル存在・H1 タイトル・出典セクション・行数・gakuten 固有語不在・用語存在）
- [ ] unit test: **N/A** — 実行コードが存在しないため
- [ ] integration test: **N/A** — 同上
- [ ] e2e test: **N/A** — 同上
- [x] **architecture boundary check**: SPEC-0001 Properties INV-01..INV-03（配布物と SAGE 内部物の分離、File Scope 遵守）→ Gate 4
- [ ] security scan: **N/A** — SEC-01 該当なし（実行コード・認可境界・秘密情報なし）
- [x] **手動 review**: TASK-0005 で 4 文書間の用語意味整合（grep では検出できない semantic 整合）

## CLAUDE.md / .claude/rules/ 連携

SPEC-0001 のセクションを継承（`.claude/rules/ai-check-template.md` への参照を実装エージェントに徹底）。本 PLAN は CLAUDE.md への追記を行わず、ai-check-template.md ルールを参照させるのみ。

## Forbidden Shortcuts

SPEC-0001 のセクションを継承。追加で PLAN 固有の禁止事項:

- TASK-0001..0004 を 1 つの session で一括実装しない（並列性を活かすため別 session または別 worktree で実行）
- TASK-0005 完了前に SPEC-0001 を Approved に変更しない
- 並列実行中に他 TASK のファイルを参照しない（独立性確保のため）

## Quality Gate マッピング

SPEC-0001 のマッピングを継承。

| Gate | 対応 TASK | 検証コマンド |
|---|---|---|
| Gate 1: Structural | 各 TASK 完了時 / TASK-0005 | `ls`, `head`, `wc -l`（AC-01, AC-02, AC-06, AC-07） |
| Gate 2: Functional | TASK-0005 | `grep`（AC-03, AC-05, AC-08） |
| Gate 3: Security | N/A | - |
| Gate 4: Architecture | 各 TASK 完了時 / TASK-0005 | `grep -ri` で gakuten 固有語不在検証（AC-04） + INV-03 File Scope 遵守 |
| Gate 5: Release | Phase 0 では対象外 | - |

## Error Resolution

SPEC-0001 のセクションを継承 + PLAN 固有の対応:

- TASK-0001..0004 のいずれかが失敗 → 該当 TASK のみ rollback、再実装、他 TASK は影響なし
- TASK-0005 失敗 → 失敗 AC を特定し SPEC-0001 Error Resolution 表に従う
- 連続 3 回同じ TASK が失敗 → `same_fail_abort_threshold: 3`（`.sage/config.yaml`）で human escalation

## Knowledge Management

SPEC-0001 のセクションを継承。PLAN レベルの追加:

| シナリオ | 記録先 | 責任者 | タイミング |
|---|---|---|---|
| TASK-0001..0004 で gakuten 固有語混入 3 回累積 | `sage/failures.md` → `sage/anti-patterns.md` 昇格候補 | リポオーナー | failures.md レビュー時 |
| TASK 並列実行で File Scope 違反発生 | `sage/failures.md` | 実装エージェント（自動 hook 検出）+ オーナー（承認） | hook block 時 |

## 採用メトリクス（合格基準）

SPEC-0001 から継承 + PLAN レベル:

| メトリクス | 合格基準 | 計測方法 |
|---|---|---|
| TASK 完了率 | TASK-0001..0005 全 Done | `ls tasks/TASK-{0001..0005}*.md` + ステータス確認 |
| Gate 通過率 | Gate 1, 2, 4 全 pass | TASK-0005 で AC-01..AC-08 全 pass |
| 並列実行効率 | 並列実行時 75m 以内（最長 TASK + 検証）で完了 | RUN-ID の開始/完了時刻 |
| dogfooding 採用率（Phase 1） | 50%+ | 手動カウント |

## 段階移行（昇格条件）

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Draft → PLAN Active | 本 PLAN が `/sage-evaluate` で 95+ 採点 | `bash scripts/sage-validate.sh && self-score` |
| PLAN Active → TASK 並列実行開始 | TASK-0001..0005 すべて Pending 状態で起票済 | `ls tasks/TASK-{0001..0005}*.md \| wc -l` で 5 を得る |
| TASK 全完了 → PLAN Completed | TASK-0001..0005 全 Done + TASK-0005 で AC 全 pass | `grep -l "ステータス.*Done" tasks/TASK-{0001..0005}*.md \| wc -l` で 5 を得る |
| PLAN Completed → SPEC-0001 Approved | PLAN-0001 status: Completed + SPEC-0001 AC 全 pass | `grep "ステータス" specs/SPEC-0001*.md` で Approved を得る |
| Phase 0 完了 → Phase 1 開始 | SPEC-0001 Approved + 4 ファイル存在 | `ls package-templates/docs/philosophy/*.md \| wc -l` で 4 を得る |

## ロールバック手順

SPEC-0001 のセクションを継承 + PLAN 固有:

| 失敗レベル | ロールバック手順 |
|---|---|
| Level 1: 単一 TASK 失敗 | 該当 TASK のファイルのみ `git checkout HEAD -- <file>` で復元、TASK 再実行 |
| Level 2: 複数 TASK 失敗 / TASK-0005 で複数 AC 失敗 | `git checkout HEAD -- package-templates/docs/philosophy/` で 4 ファイル一括復元、PLAN を再評価 |
| Level 3: PLAN レベルの方針誤り（dogfooding で全面乖離） | PLAN-0001 を Deprecated、SPEC-0001 を Draft に戻し、新規 PLAN として再起票 |

## 関連ID

- SPEC-ID: SPEC-0001
- TASK-ID: TASK-0001, TASK-0002, TASK-0003, TASK-0004, TASK-0005
