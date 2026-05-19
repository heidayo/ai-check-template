# TASK-0185: Claude Code Docs Gate Clarity

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0185 |
| SPEC-ID   | SPEC-0048 |
| PLAN-ID   | PLAN-0048 |
| ステータス | Done |
| 担当Agent | Claude Code Implementation |
| 並列可否  | No |
| 依存TASK  | none |
| 見積     | 25m |

sage-managed: true

## 責務

SPEC-0048 で特定された 3 件のドキュメント整合性 issue を一括で修正する。具体的には (A) `CLAUDE.md` の "Quality Gate Checklist" 節を SAGE 内部 CI 検証モデルであると明示し配布物 `ai:check` との別概念を追記、(B) `package-templates/.claude/README.md` の "blocking モード" 節を Claude Code hook 公式 spec (exit code 2 / stdout JSON `decision`) に整合させる、(C) `package-templates/.claude/rules/test-rules.md` から配布先で解決不能になる maintainer 専用相対リンク (`../../../docs/roadmap.md`) を削除する。

## 入力

- SPEC-0048 (Background, Scope, AC-01..AC-10, Properties)
- PLAN-0048 (実装方針, 検証手順)
- Claude Code Hooks 公式仕様 (exit code 2 / stdout JSON で blocking 制御)
- 既存 `CLAUDE.md` L105-115 ("Quality Gate Checklist" 節)
- 既存 `package-templates/.claude/README.md` L74-77 ("blocking モード" 節)
- 既存 `package-templates/.claude/rules/test-rules.md` L3-4 (冒頭 example 宣言と roadmap リンク)

## 出力

- `CLAUDE.md` "Quality Gate Checklist" 節に SAGE 内部モデルである旨と、配布物 `ai:check` / `ai:check:fast` / `ai:check:secure` との別概念であることが書かれている
- `package-templates/.claude/README.md` "blocking モード" 節から `"blocking": true` 表記が消え、代わりに exit code 2 または stdout JSON `decision` で blocking 制御する旨が書かれている
- `package-templates/.claude/rules/test-rules.md` から `../../../docs/roadmap.md` への相対リンクが削除されている。冒頭の「配布される example」「利用者がコピーする」前提 2 行は残っている
- 各 AC (`rg` パターン群) が pass する

## File Scope（変更許可範囲）

- 作成: `tasks/TASK-0185-claude-docs-gate-clarity.md`
- 作成: `specs/SPEC-0048-claude-docs-gate-clarity.md`
- 作成: `plans/PLAN-0048-claude-docs-gate-clarity.md`
- 変更: `CLAUDE.md` (SAGE 保護対象、`sage-managed: true` 経由)
- 変更: `package-templates/.claude/README.md`
- 変更: `package-templates/.claude/rules/test-rules.md`
- 削除: なし

## 禁止事項

- `package-templates/.claude/settings.hook-fragment.json` を変更しない (動作は現行 spec に整合済)
- README / `README-en.md` / `docs/` / `tests/` / `src/` / `bin/` / `package-templates/scripts/` / `package-templates/prompts/` / `package-templates/docs/philosophy/` を変更しない
- SAGE governance 本体 (`sage/`) を変更しない
- `CLAUDE.md` の "Quality Gate Checklist" 節以外を変更しない (SAGE Lifecycle / Forbidden Shortcuts / File Scope / Traceability などの既存節は保持)
- `package-templates/.claude/README.md` の他の節 (思想 / 利用者向け組み込み手順 / hook と script の対応表 / 出典) を変更しない
- 過去 TASK ファイルの "Gate 1/2/4 PASS" 表記を遡って書き換えない (SAGE 内部評価軸として残す)
- `package.json` `files` contract を変更しない
- npm package version の bump を行わない

## 完了条件

- [x] `rg -n '"blocking"\s*:\s*true' package-templates/.claude/README.md` が検出ゼロ
- [x] `rg -n 'exit code 2|decision' package-templates/.claude/README.md` が 1 件以上 hit
- [x] `rg -n '\.\./\.\./\.\./docs/roadmap\.md' package-templates/.claude/rules/test-rules.md` が検出ゼロ
- [x] `rg -n 'SAGE 内部|本リポ内部' CLAUDE.md` で "Quality Gate Checklist" 節に SAGE 内部であることを示す表記が確認できる
- [x] `rg -n 'ai:check' CLAUDE.md` で "Quality Gate Checklist" 節に配布物との別概念が明示されている
- [x] `rg -n 'TODO|FIXME' CLAUDE.md package-templates/.claude/README.md package-templates/.claude/rules/test-rules.md` が新規 unfinished marker を検出しない (既存の Forbidden Shortcuts 行のみ)
- [x] `node -e "const p=require('./package.json'); if ((p.files||[]).includes('CLAUDE.md')) process.exit(1)"` が pass
- [x] `make validate` が pass
- [x] `bash scripts/sage-validate.sh` が pass
- [x] `git diff --check` が pass
- [x] `git diff --name-only main...HEAD` が `CLAUDE.md`, `package-templates/.claude/README.md`, `package-templates/.claude/rules/test-rules.md`, `specs/SPEC-0048-*.md`, `plans/PLAN-0048-*.md`, `tasks/TASK-0185-*.md` のみ

## Done Definition（ラウンド単位）

本 TASK は小規模変更 (3 ファイル + SAGE artifacts) であるため、TASK の完了条件と SPEC-0048 の AC を Done Definition として扱う。別途 `tasks/done-def-SPEC-0048-round-1.md` は作成しない。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0048-task-0185 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass / architecture: pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0185-claude-docs-gate-clarity.md"
  target_type: TASK
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
