# PLAN-0048: Claude Code Docs Gate Clarity

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0048 |
| SPEC-ID   | SPEC-0048 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [ ] test
- [x] docs (CLAUDE.md / package-templates docs)
- [x] agent-ops (SAGE 保護ファイル経由)

## 影響範囲

- 本リポ内部 (maintainer 向け): `CLAUDE.md` の "Quality Gate Checklist" 節
- 配布物 (利用者向け): `package-templates/.claude/README.md` の "blocking モード" 節
- 配布物 (利用者向け): `package-templates/.claude/rules/test-rules.md` の冒頭 4 行
- SAGE artifacts for SPEC-0048: `specs/SPEC-0048-*.md`, `plans/PLAN-0048-*.md`, `tasks/TASK-0185-*.md`

非影響範囲:
- `package-templates/.claude/settings.hook-fragment.json` (内容は現行 Claude Code spec に整合済)
- README / `docs/` / `tests/` / `src/` / `bin/` (Codex 担当 or 本 issue と無関係)
- `sage/` 配下 (SAGE governance 本体)
- `package.json` `files` contract

## 実装方針

本 PLAN では 3 件のドキュメント修正を 1 つの TASK (TASK-0185) に集約する。理由:

1. すべて Claude Code Implementation Agent 担当
2. File Scope が 3 ファイルで lite lane 上限内に収まる
3. 修正内容が相互依存しない (並列的に変更可) ため、TASK 細分割によるオーバーヘッドが利益を上回らない
4. 単一 TASK で `sage-managed: true` を 1 度設定すれば CLAUDE.md と配布物両方を扱える

ただし standard lane で SPEC + PLAN + TASK の構造は維持し、Gate 1-4 すべてを通す。

### 手順

1. SPEC-0048 / PLAN-0048 / TASK-0185 を作成 (本作業中)
2. TASK-0185 の status を `In Progress` に遷移、`sage-managed: true` を付与
3. 3 ファイルを順次編集
   - `CLAUDE.md` "Quality Gate Checklist" 節を SAGE 内部モデル明示に書き換え
   - `package-templates/.claude/README.md` blocking モード節を Claude Code 公式 spec に整合させる
   - `package-templates/.claude/rules/test-rules.md` の roadmap 相対リンクを削除
4. AC-03 / AC-05 を `rg` で即時検証
5. `make validate` / `bash scripts/sage-validate.sh` / `git diff --check` を順次実行
6. TASK-0185 の実行ログを更新、status を `Done` に遷移
7. commit (TASK-ID 含む)

### 段階昇格条件

| 移行 | 条件 | コマンド |
|---|---|---|
| Specify -> Plan | SPEC-0048 に scope / out-of-scope / AC / 異常系 / Properties が揃う | `bash scripts/sage-validate.sh` |
| Plan -> Execute | PLAN-0048 と TASK-0185 に File Scope と依存関係が揃い、3 ファイルから逸脱しない | `git diff --check` + scope review |
| Execute -> Verify | TASK-0185 の完了条件 (5 件) が pass | `rg` パターン + `make validate` |
| Verify -> Merge ready | 全 AC、`make validate`、SAGE validation、diff check が pass | `make validate` + `bash scripts/sage-validate.sh` + `git diff --check` |

## Error Resolution / Knowledge Management

- 失敗時の責任者は失敗を発見した担当Agent (本 PLAN では Claude Code Implementation) とする
- 失敗を検出したら、TASK-0185 の実行ログに RUN-ID / 失敗コマンド / 結果 `Fail` を記録する
- 既知パターン確認は `sage/anti-patterns.md` を使う
- 新規失敗は修正前に `sage/failures.md` へ FAIL-XXXX 形式で記録する
- 同種失敗が 3 回発生したら、`sage/anti-patterns.md` への昇格候補として記録する
- commit を作る場合は commit-msg hook に従い、TASK-ID を含める。`--no-verify` は使わない

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0185 | CLAUDE.md Gate 明示・blocking 説明訂正・配布物 roadmap リンク削除を一括実施 | Claude Code Implementation | 25m | none | No |

依存グラフ:

```text
TASK-0185 (single task)
```

## リスク

- リスク1: 単一 TASK に 3 ファイル変更を集約すると File Scope 外編集の事故が起きやすい → 軽減策: File Scope を 3 ファイル明示し、`templates/hooks/check-file-scope.sh` で hook 検出を活かす
- リスク2: CLAUDE.md の Gate 表現変更で過去 TASK の "Gate 1/2/4 PASS" 記述が読みづらくなる → 軽減策: 過去 TASK の表現は SAGE 内部評価軸として読めるよう CLAUDE.md 側に補足を入れる。過去 TASK ファイルは変更しない
- リスク3: blocking 説明の書き換えで Claude Code 公式 spec の将来変更に追従できなくなる → 軽減策: 「現行 spec では」「Claude Code Hooks 公式 docs」など版管理を意識した表現にする
- リスク4: test-rules.md の冒頭ブロック書き換えで「配布される example である」前提が失われる → 軽減策: roadmap リンクのみピンポイントで削除し、example 宣言の 2 行は残す

## 必要な検証

- [x] structural (Gate 1): `make validate` (JSON / YAML / shell / structure / cli / npm pack / npm publish dry-run / sage) — PASS
- [x] functional (Gate 2): AC-01..AC-10 (主に文書 grep ベース) — all PASS
- [x] security (Gate 3): `rg "TODO|FIXME" CLAUDE.md package-templates/.claude/README.md package-templates/.claude/rules/test-rules.md` が新規 unfinished marker を検出しない — PASS (既存の Forbidden Shortcuts 行のみ)
- [x] architecture (Gate 4): `git diff --name-only main...HEAD` が 3 ファイル + SPEC/PLAN/TASK のみに限定される、TASK File Scope と diff が一致する — PASS
- [ ] traceability (Gate 4): commit message に TASK-0185 が含まれる — commit 時に確認

Gate 5 (Release) はリリース作業を含まないため N/A。

## ロールバック

- CLAUDE.md の変更で SAGE 内部運用に支障が出た場合: TASK-0185 commit の `CLAUDE.md` hunk のみを revert する。`git reset --hard` は使わない
- package-templates README の blocking 説明書き換えで利用者が混乱した場合: 該当節のみ revert し、別 SPEC で再設計する
- test-rules.md のリンク削除で本リポ内部の roadmap 参照経路が失われた場合: `package-templates/.claude/README.md` (配布される側) ではなく、本リポ内部の `.claude/rules/ai-check-template.md` 側に同等の説明を移すことで対処する
- いずれも差分単位で通常 revert する

## 自動採点

```yaml
eval_feedback:
  target_file: "plans/PLAN-0048-claude-docs-gate-clarity.md"
  target_type: PLAN
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
