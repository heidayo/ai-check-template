# CLAUDE.md (Project: ai-check-template)

## Project Overview

`ai-check-template` は AI 駆動開発のための **テストフローテンプレート** と **テスト設計思想** を npm パッケージとして配布するリポジトリ。

- 配布物: `package-templates/` 配下のみ
- 開発手法: SAGE Development System で SPEC → PLAN → TASK → Execute → Verify
- 詳細: [`README.md`](./README.md), [`.claude/rules/ai-check-template.md`](./.claude/rules/ai-check-template.md)

## Instruction Priority

優先順位（高い順）:

1. `sage/governance.md` の基本原則 10 件
2. `.claude/rules/ai-check-template.md` の本リポ固有原則（汎用ファースト / 実証ファースト / SAGE 横並びコンパニオン）
3. 本 CLAUDE.md（このファイル）
4. 配下の `.claude/rules/*.md`
5. SPEC / PLAN / TASK 内の指示

## SAGE Lifecycle Protocol

7 段階の標準ライフサイクル:

1. **Specify**: 目的・スコープ・受け入れ条件・異常系を SPEC で固定
2. **Plan**: 影響範囲・タスク分解・検証方法を PLAN で設計
3. **Slice**: 1 TASK = 1 責務に分割、File Scope と完了条件を明示
4. **Execute**: 役割分担エージェントが実装・テスト・レビュー
5. **Verify**: lint / typecheck / unit / integration / e2e / SAST を機械検証
6. **Merge**: 検証済み変更のみ統合
7. **Observe**: 本番観測でフィードバック → SPEC 改訂

詳細: `sage/governance.md` §2

## Forbidden Shortcuts

- 仕様なし実装（standard レーンでは SPEC 必須）
- File Scope 外への変更
- TODO / FIXME を残してコミット
- `--no-verify` / `--force` / `rm -rf` の使用
- 配布物（`package-templates/`）と SAGE 内部物（`templates/`, `sage/`, `.sage/`）の混在
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等特定プロジェクト固有語の使用
- secret / token / API key の直書き
- 大きな単一プロンプトで複数責務を一括実装（Big Bang Prompt）

詳細: `sage/governance.md` §6

## Error Resolution Protocol

エラー発生時の手順:

1. TASK-ID 付きで run log にエラーを記録
2. `sage/anti-patterns.md` で既知パターンを確認
3. 新規パターンなら `sage/failures.md` に追記（FAIL-XXXX 形式）
4. 同パターン 3 回累積で `sage/anti-patterns.md` に昇格
5. 修正は SPEC スコープ内で行い、スコープを拡げる場合は SPEC 改訂

### Error Context Template

エラー報告時には以下 6 要素を必ず含める:

1. **エラーログ**: 完全な stack trace
2. **失敗ファイル**: パスと行番号
3. **関連仕様**: SPEC-ID と該当 acceptance criteria
4. **最近の変更**: `git diff` 出力
5. **Fix scope**: 変更可能ファイル一覧（TASK の File Scope）
6. **完了条件**: テストの pass/fail 基準

## Agent Constraints

役割分離（`sage/governance.md` §3 参照）:

- **Spec Agent**: 仕様作成・明確化
- **Planning Agent**: 計画変換・タスク分解
- **Implementation Agent**: 実装（許可範囲のみ）
- **Review Agent**: 整合検証・3-gate FP filter
- **Test / Security / Operations Agent**: 各専門領域

分離原則: 同一エージェントが「実装と最終承認」「実装とセキュリティ承認」を兼ねない。

## File Scope Rules

- TASK の File Scope に列挙されたファイルのみ変更可
- スコープ外への書き込みは `templates/hooks/check-file-scope.sh` で検出
- 検出方針は `.sage/config.yaml` `hooks.profile`（standard: warn / strict: block）
- SAGE 保護ファイル（`CLAUDE.md`, `sage/*`, `.sage/config.yaml`, `.claude/settings.json`）は `sage-managed: true` + `In Progress` の TASK でのみ編集可

## Traceability Requirements

すべての変更は traceable であること:

- SPEC-ID → PLAN-ID → TASK-ID → commit
- commit message に TASK-ID 必須（commit-msg hook で強制）
- PR 本文に SPEC-ID / PLAN-ID / TASK-ID を記載
- 例外: `vibe/*` レーン（explore）は TASK-ID 不要、`promote/*` で Retro-SPEC 起票

詳細: `sage/traceability.md`

## Quality Gate Checklist

CI で 5 段階の Gate を通過すること:

- **Gate 1: Structural** — 型 / lint / format
- **Gate 2: Functional** — unit / integration / e2e
- **Gate 3: Security** — secret scan / SAST / SCA
- **Gate 4: Architecture** — layer 境界 / traceability
- **Gate 5: Release** — migration safety / rollback / monitoring

3-state: PASS(✅) / FAIL(❌) / SKIPPED(⏭️)。`.sage/config.yaml` `project_checks` で各 Gate のコマンドを設定。

## Language Rules

| 文脈 | 言語 |
|---|---|
| User-facing ドキュメント（README / philosophy / prompts 等） | 日本語 |
| コード識別子（関数名・変数名・ファイル名・CLI フラグ） | 英語 |
| commit message | 英語 |
| PR description | 日本語 |
| テストケース名 | 日本語 |
| 配布物内コメント（利用者向け） | 日本語 OK |

詳細: `.claude/rules/sage-governance-rules.md`

<!-- === SAGE Development System (auto-injected) === -->
## SAGE Development System

- Before writing code on the standard lane, check `specs/` for an existing SPEC. No SPEC = no code.
- Only modify files listed in the active TASK's File Scope.
- Every commit must include a TASK-ID (enforced by pre-commit hook).
- Prototypes go on `vibe/*` branches (no SPEC needed). To promote to main: `/sage-promote` or `bash scripts/sage-promote.sh vibe/<name>`.
- Development lanes: explore (`vibe/*`, no gates) | lite (`fix/*` / `chore/*` / `docs/*`, TASK-ID + max 3 files + no contract changes + Gate 1+3) | standard (`feature/*`, full SPEC + Gate 1-4) | promotion (`promote/*`, Retro-SPEC + TASK-ID + Gate 1-4).
- `vibe/*` → `main` direct merge is prohibited. Use `promote/*` with Retro-SPEC.
- For detailed workflows: `/sage-spec`, `/sage-plan`, `/sage-review`, `/sage-evaluate`
- SPEC/PLAN completion triggers auto-scoring (100 points required before implementation).
- Governance docs in `sage/` — do not modify without human approval.
- Run `bash scripts/sage-update-check.sh` at session start (1日1回).
- CI Gates enforce quality with 3-state: PASS(✅) / FAIL(❌) / SKIPPED(⏭️). Configure in `.sage/config.yaml` `project_checks`.
- Claude Code hooks provide runtime protection: dangerous command block, SAGE file protection, File Scope check.
- Hook profile in `.sage/config.yaml` `hooks.profile`: minimal(Phase A) / standard(Phase B) / strict(Phase C+).
- Health check: `make doctor` | Repair: `make repair` | Metrics: `make report`
- Claude collaboration brief: reference `docs/claude-collaboration-brief.md` for engagement patterns; well-scoped tasks may be delegated to Codex via packet.
- Claude-only boundary: do not edit Codex-specific files (`AGENTS.md`, `docs/codex-*.md`) unless human explicitly assigns. Record as Codex follow-up otherwise.
- Properties section is required for new SPECs (system/platform). See `sage/governance.md` §11.
- Review uses 3-gate FP filter (Dead Code / Trust Boundary / Scope Check).

Auto-update rules:
- Update check failure → warning only, never block development
- `installer_url` not configured → skip silently

Project-specific rules: add your own files to `.claude/rules/` (do not edit `specs-rules.md` etc. — they are overwritten on update).

Directory: `specs/` (what) | `plans/` (how) | `tasks/` (work units) | `sage/` (governance) | `templates/hooks/` (runtime guards)
<!-- === End SAGE === -->
