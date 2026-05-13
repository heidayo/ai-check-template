# SPEC-0007: 本リポ自身の SAGE 環境整備（CLAUDE.md + .sage/config.yaml）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0007 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | なし（SPEC-0001..0006 と独立した本リポ運用整備） |
| 権限レベル | platform |

## 背景・目的

`bash scripts/sage-validate.sh` が 11 ERRORs を出している。内訳:
- CLAUDE.md に SAGE 必須セクション 10 件が欠落（Project Overview / Instruction Priority / SAGE Lifecycle Protocol / Forbidden Shortcuts / Error Resolution Protocol / Agent Constraints / File Scope Rules / Traceability Requirements / Quality Gate Checklist / Language Rules）
- CLAUDE.md に Error Context Template が欠落

加えて `.sage/config.yaml` の `project_checks` セクションが SAGE インストール時の **Go サンプル** のまま残っており、本リポ（TypeScript / npm パッケージ想定）と乖離している。SAGE Gate が Go コマンド（`go vet`, `gofmt`, `go build`, `go test`）を走らせようとして無意味に失敗する。

本 SPEC で **本リポ自身の SAGE 環境を整備** し、開発体験を改善する。配布物（`package-templates/`）には影響しない。

## 対象ユーザー

- 本リポにコントリビュートする開発者（人間 / AI 双方）
- `bash scripts/sage-validate.sh` を pass させて SAGE Gate を機能させたい場合

## スコープ（含む）

### CLAUDE.md
- 11 必須セクションを追記（auto-injected ブロックは保持）
  - Project Overview
  - Instruction Priority
  - SAGE Lifecycle Protocol
  - Forbidden Shortcuts
  - Error Resolution Protocol（Error Context Template を含む）
  - Agent Constraints
  - File Scope Rules
  - Traceability Requirements
  - Quality Gate Checklist
  - Language Rules

### .sage/config.yaml
- `project_checks` セクションの Go サンプルをコメントアウト
- 「Phase 2 で Node 用に再有効化」とコメント
- 結果として SAGE Gate は SKIPPED 状態（FAIL ではない）

## スコープ外

- `AGENTS.md` の整備（Codex 用、本リポは Claude Code 中心、`.gitignore` 済）
- 配布物（`package-templates/`）への変更
- `sage/governance.md` 等 SAGE 管理ドキュメントの変更
- Phase 1 dogfooding 関連
- Phase 2 npm パッケージ化（実 Node 設定追加は Phase 2）
- `.claude/settings.json` の変更（SAGE 管理、gitignored）

## File Scope

**書き込み許可:**
- `CLAUDE.md`
- `.sage/config.yaml`

**変更禁止:** 上記 2 ファイル以外。SAGE 管理ファイル（`sage/`, `.claude/rules/{specs,plans,tasks,src,sage-governance}-rules.md`, `.claude/skills/sage-*/`）。配布物（`package-templates/`）。既存 SPEC/PLAN/TASK。

## CLAUDE.md / .claude/rules/ 連携

| ルール | 実装時の遵守事項 |
|---|---|
| 言語規約 | CLAUDE.md は英語 + 必要に応じ日本語（SAGE upstream に準ずる）、`.sage/config.yaml` コメントは日本語 |
| Protected files | CLAUDE.md は通常 human-only。本 SPEC は user の explicit instruction（「C+D まとめて」選択）に基づき AI 改変を許可された例外ケース |
| auto-injected 保持 | CLAUDE.md の `<!-- === SAGE Development System (auto-injected) === -->` ブロックを変更せず、その**前**に新規セクションを追加 |

## Forbidden Shortcuts

- auto-injected SAGE ブロックの削除・改変
- SAGE 管理ファイル（gitignored 含む）の変更
- 配布物（`package-templates/`）への変更
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- secret / token / API key の含有
- TODO / FIXME を残す
- `.sage/config.yaml` で Node 用 project_checks の**実体**を入れる（Phase 2 で扱う、本 SPEC ではコメントアウトのみ）

## 要件

### 機能要件
- [FR-01] `bash scripts/sage-validate.sh` の [1/9] CLAUDE.md 必須セクション検証が全 10 セクション pass
- [FR-02] `bash scripts/sage-validate.sh` の [4/9] ドキュメント整合性チェック で Error Context Template OK
- [FR-03] CLAUDE.md の auto-injected SAGE ブロックが unchanged
- [FR-04] `.sage/config.yaml` の `project_checks` が全てコメントアウトされている（active な commandがない）
- [FR-05] `.sage/config.yaml` に「Phase 2 で Node 化」のコメントが含まれる
- [FR-06] `bash scripts/sage-validate.sh` 全体の ERRORs が 0

### 非機能要件
- [NFR-01] CLAUDE.md の差分は +100..+250 行程度（10 セクション追記）
- [NFR-02] `.sage/config.yaml` の差分は -10..+10 行程度（コメントアウト中心）
- [NFR-03] テスト種別: sage-validate.sh の実行
- [NFR-04] カバレッジ閾値: N/A

### セキュリティ要件
- [SEC-01] CLAUDE.md / .sage/config.yaml に secret / token 不在
- [SEC-02] 危険コマンドの **実行可能形** が含まれない（説明テキスト内で参照されるのは許容）

### 運用要件
- [OPS-01] 本 SPEC 完了で `bash scripts/sage-validate.sh` が pass し、開発時の検証が機能する
- [OPS-02] 次回 SAGE upstream 更新時に CLAUDE.md の SAGE-managed 部分が再生成される可能性があるため、本 SPEC で追加した「SAGE 必須セクション」は upstream 由来。auto-injected ブロックとの境界に注意

## Quality Gate マッピング

| Gate | 対応 AC |
|---|---|
| Gate 1: Structural | AC-01..AC-05 |
| Gate 2: Functional | AC-06, AC-07 |
| Gate 3: Security | AC-08 |
| Gate 4: Architecture | AC-09 |

## 受け入れ条件

### 正常系
- [ ] AC-01: CLAUDE.md に 10 必須セクションすべて存在（`for s in "Project Overview" "Instruction Priority" "SAGE Lifecycle Protocol" "Forbidden Shortcuts" "Error Resolution Protocol" "Agent Constraints" "File Scope Rules" "Traceability Requirements" "Quality Gate Checklist" "Language Rules"; do grep -q "$s" CLAUDE.md || exit 1; done`）
- [ ] AC-02: CLAUDE.md に「Error Context Template」が存在（`grep -q "Error Context Template" CLAUDE.md`）
- [ ] AC-03: CLAUDE.md の auto-injected SAGE ブロックが残存（`grep -q "<!-- === SAGE Development System (auto-injected) === -->" CLAUDE.md && grep -q "<!-- === End SAGE ===" CLAUDE.md`）
- [ ] AC-04: `.sage/config.yaml` の `project_checks` が active command を持たない（各キーがコメント `#` で始まる、または不在）
- [ ] AC-05: `.sage/config.yaml` に Phase 2 関連コメント（`grep -q "Phase 2" .sage/config.yaml`）

### 機能検証
- [ ] AC-06: `bash scripts/sage-validate.sh 2>&1 | grep -c "MISSING"` が 0
- [ ] AC-07: `bash scripts/sage-validate.sh 2>&1 | grep -E "ERROR.*FOUND" | grep -oE "[0-9]+" | head -1` が 0

### 異常系
- [ ] AC-08: secret 直書き不在（`grep -iE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" CLAUDE.md .sage/config.yaml` が空）
- [ ] AC-10: gakuten 固有語が新規追加されていない（`git diff HEAD -- CLAUDE.md .sage/config.yaml | grep "^+" | grep -v "^+++" | grep -iE "gakuten|学生転職|apps/web|web_ipo|academy|internships"` が空）

### 配置検証
- [ ] AC-09: 変更が以下の 2 ファイルに限定される（`.sage/` ディレクトリは `.gitignore` 済のため、git tracked diff は CLAUDE.md のみ）:
  - (a) `git diff --name-only HEAD` の結果が `CLAUDE.md` のみ
  - (b) `.sage/config.yaml` の `project_checks` セクションがローカルで更新されている（gitignored、配布対象外、各 contributor が install.sh 後に同等の編集を行う運用）

## 異常系

- 想定エラー1: 既存 auto-injected ブロックを誤って削除 → AC-03 で検出
- 想定エラー2: `.sage/config.yaml` のコメントアウトが不完全（一部 active command 残存） → AC-04 で検出、追加で sage-validate.sh のエラーで検出
- 想定エラー3: CLAUDE.md セクション追加で意図せず他ファイルに影響 → AC-09 で検出
- 境界ケース1: セクション名の表記揺れ（例: "Lifecycle" vs "ライフサイクル"）→ sage-validate.sh は英語キーワードで grep するので**英語見出し**で記述

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 不足セクション名で grep して位置確認、欠落セクションを追加 |
| AC-02 | Error Context Template を Error Resolution Protocol セクション内に追加 |
| AC-03 | auto-injected ブロックを `git checkout HEAD -- CLAUDE.md` から復元、新規セクションを再追加 |
| AC-04 | `project_checks` 配下の各キーに `#` を付ける |
| AC-05 | コメントに「Phase 2」を含める |
| AC-06 | sage-validate.sh 出力で MISSING 行を特定、該当セクションを CLAUDE.md に追加 |
| AC-09 | 余分な変更ファイルを `git checkout HEAD -- <file>` で revert |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| SAGE upstream 更新で CLAUDE.md 既存セクションが上書きされる | `sage/failures.md` | リポオーナー（人間） |
| sage-validate.sh が新セクション要求を追加 | `sage/failures.md` → `sage/anti-patterns.md` 昇格候補 | リポオーナー |
| `.sage/config.yaml` Go サンプル残留が他リポでも再発 | `sage/anti-patterns.md` 直接記録 | リポオーナー |

### anti-patterns 参照
- **計画と実装の乖離**: SAGE インストール後のテンプレ未調整パターン。本 SPEC が解消の最初の事例
- **Silent Scope Expansion**: auto-injected ブロックや他ファイルへの拡散禁止

## 契約
- commit-msg hook: TASK-ID 必須
- sage-validate.sh: 本 SPEC 完了後に pass する契約

## リスク

- リスク1: SAGE upstream 更新で 11 セクション仕様が変わる → 軽減策: セクション名は最低限の英語キーワードに留め、内容は本リポの実態に合わせて記述
- リスク2: CLAUDE.md 肥大化で AI への毎セッションコンテキストが重くなる → 軽減策: 各セクション短く（10-30 行程度）、詳細は `sage/governance.md` への参照リンクで委譲
- リスク3: `.sage/config.yaml` のコメントアウトを忘れて Go コマンドが残る → AC-04 で機械検出
- リスク4: Protected files ルール違反（CLAUDE.md は human-only）→ 本 SPEC は user の explicit instruction で例外、commit message にも明記

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| sage-validate.sh | 0 ERRORs |
| CLAUDE.md セクション数 | 10 必須 + auto-injected = 11+ |
| .sage/config.yaml project_checks | active command 0 |
| 副作用 | 配布物・SAGE 管理ファイルに変更なし |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| SPEC Draft → Approved | AC-01..AC-10 全 pass + 95+ 採点 |
| 本リポ SAGE 環境整備完了 | SPEC-0007 Approved |

## 実装メモ

### CLAUDE.md 新規セクションの推奨構造

```markdown
# CLAUDE.md (Project: ai-check-template)

## Project Overview
- 目的: AI 駆動開発のテストフローテンプレート / 設計思想を npm パッケージで配布
- 配布物: `package-templates/` のみ
- 開発手法: SAGE Development System で SPEC → PLAN → TASK → Execute → Verify
- 詳細: `README.md`, `.claude/rules/ai-check-template.md`

## Instruction Priority
優先順位（高い順）:
1. `sage/governance.md` の基本原則 10 件
2. `.claude/rules/ai-check-template.md` の本リポ固有原則（汎用ファースト / 実証ファースト / SAGE 横並びコンパニオン）
3. 本 CLAUDE.md（このファイル）
4. 配下の `.claude/rules/*.md`
5. SPEC / PLAN / TASK 内の指示

## SAGE Lifecycle Protocol
7 段階: Specify → Plan → Slice → Execute → Verify → Merge → Observe
詳細: `sage/governance.md` §2

## Forbidden Shortcuts
- 仕様なし実装
- File Scope 外への変更
- TODO/FIXME を残してコミット
- `--no-verify` / `--force` / `rm -rf` の使用
- 配布物と SAGE 内部物の混在
- gakuten 等特定プロジェクト固有語の使用

## Error Resolution Protocol
1. エラー発生時、TASK-ID を含むログを記録
2. `sage/anti-patterns.md` で既知パターンを確認
3. 新規パターンなら `sage/failures.md` に追記
4. 同パターン 3 回累積で anti-patterns.md に昇格

### Error Context Template
エラー報告時に含める 6 要素:
1. エラーログ: 完全な stack trace
2. 失敗ファイル: パスと行番号
3. 関連仕様: SPEC-ID と該当 AC
4. 最近の変更: `git diff` 出力
5. Fix scope: 変更可能ファイル一覧
6. 完了条件: テストの pass/fail

## Agent Constraints
役割分離（`sage/governance.md` §3 参照）:
- Spec Agent: 仕様作成
- Planning Agent: 計画変換
- Implementation Agent: 実装
- Review Agent: 整合検証
- Test / Security / Operations Agent

同一エージェントが「実装と最終承認」「実装とセキュリティ承認」を兼ねない。

## File Scope Rules
- TASK の File Scope に列挙されたファイルのみ変更可
- スコープ外への書き込みは `check-file-scope.sh` hook で検出
- 検出方針は `.sage/config.yaml` `hooks.profile`（standard: warn / strict: block）

## Traceability Requirements
すべての変更は traceable:
- SPEC-ID → PLAN-ID → TASK-ID → commit
- commit message に TASK-ID 必須（commit-msg hook で強制）
- PR 本文に SPEC-ID / PLAN-ID / TASK-ID

## Quality Gate Checklist
- Gate 1: Structural（型 / lint / format）
- Gate 2: Functional（unit / integration / e2e）
- Gate 3: Security（secret scan / SAST / SCA）
- Gate 4: Architecture（layer 境界 / traceability）
- Gate 5: Release（migration safety / rollback / monitoring）

## Language Rules
| 文脈 | 言語 |
|---|---|
| User-facing ドキュメント | 日本語 |
| コード識別子 | 英語 |
| commit message | 英語 |
| PR description | 日本語 |
| テストケース名 | 日本語 |
詳細: `.claude/rules/sage-governance-rules.md`

<!-- === SAGE Development System (auto-injected) === -->
...（既存ブロック保持）
<!-- === End SAGE === -->
```

### `.sage/config.yaml` の `project_checks` 修正案

```yaml
project_checks:
  # Phase 2 で Node 化予定: 現在は SAGE Gate を SKIPPED に保つため全コメントアウト
  # lint: "pnpm lint"
  # format: "pnpm format:check"
  # type_check: "pnpm typecheck"
  # test_command: "pnpm test"
  # coverage_command: "..."
  # --- 削除した Go サンプル ---
  # lint: "go vet ./..."
  # format: 'test -z "$(gofmt -l .)"'
  # ...
```

### TASK 分解の指針
- TASK-A: CLAUDE.md 10 セクション追加
- TASK-B: .sage/config.yaml project_checks コメントアウト
- TASK-C: AC 検証 + sage-validate.sh 実行確認

3 TASK。File Scope が 2 ファイルしかないため、A と B を別 TASK にして並列実行可能性を確保。

## ロールバック手順

| Level | 手順 |
|---|---|
| Level 1 | 該当ファイル個別復元（CLAUDE.md または .sage/config.yaml） |
| Level 2 | 両ファイル一括復元（`git checkout HEAD -- CLAUDE.md .sage/config.yaml`） |
| Level 3 | SPEC を Draft に戻し再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 変更は CLAUDE.md と `.sage/config.yaml` の 2 ファイルに限定
- [INV-02] (Gate 4) CLAUDE.md の auto-injected SAGE ブロックは unchanged
- [INV-03] (Gate 3) secret / token / 危険コマンドの実行可能形が含まれない

### Pre-conditions
- [PRE-01] (Gate 1) `bash scripts/sage-validate.sh` を実行可能（SAGE インストール済み）
- [PRE-02] (Gate 1) User からの explicit instruction で CLAUDE.md 改変が許可されている（C+D 選択）

### Post-conditions
- [POST-01] (Gate 2) `bash scripts/sage-validate.sh` の ERRORs が 0
- [POST-02] (Gate 2) CLAUDE.md に 10 必須セクション + Error Context Template が存在
- [POST-03] (Gate 4) 配布物・SAGE 管理ファイルに変更なし

### Assumptions
- [ASM-01] sage-validate.sh の検証ルール（10 セクション名）は v1.8.0 時点。upstream 更新で変わる可能性あり
- [ASM-02] `.sage/config.yaml` の Node 用 project_checks 実体は Phase 2 で追加（package.json 等が存在してから）

## 関連ID

- PLAN-ID: PLAN-0007
- TASK-ID: TASK-0023..0025
