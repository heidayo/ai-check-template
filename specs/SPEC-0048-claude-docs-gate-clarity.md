# SPEC-0048: Claude Code Docs Gate Clarity

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0048 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0047 |
| 権限レベル | platform |

## 背景・目的

SPEC-0047 / TASK-0182 で `CLAUDE.md` と `package-templates/.claude/*` を public docs に追従させる sync を行ったが、Claude Code レビューと Codex 確認の包括整理で以下 3 件の細粒度の整合性 issue が残っていることが判明した。

1. `CLAUDE.md` の "Quality Gate Checklist (Gate 1-5)" は本リポ内部の SAGE 検証モデルだが、配布物の `ai:check` / `ai:check:fast` / `ai:check:secure` (AI 内部ループ + PR Gate ハイブリッド) と別概念であることが明示されておらず、AI agent が誤って配布物に Gate 1-5 を対応付ける可能性がある。
2. `package-templates/.claude/README.md` の "blocking モード" 節が `"blocking": true` という存在しない field を Claude Code hook spec として案内している。実際の blocking 制御は exit code 2 または stdout JSON (`decision: "block"` / `permissionDecision`)。
3. `package-templates/.claude/rules/test-rules.md` が maintainer 専用の `../../../docs/roadmap.md` を相対リンクで参照しており、利用者プロジェクトへコピーされた時点で死リンクになる。

本 SPEC では機能追加や hook fragment の動作変更は行わず、上記 3 件のドキュメント不整合のみを修正することで、配布物 (利用者向け) と SAGE 内部 (maintainer 向け) の語彙境界を明確にする。

## 対象ユーザー

- `ai-check-template` を CLI / 手動コピーで導入する利用者 (配布される `.claude/` 文書の正確性が必要)
- 配布物 `.claude/rules/test-rules.md` を自プロジェクトにコピーした後の利用者 (相対リンクが解決すること)
- Claude Code / Codex / Cursor 等で本リポを開発する AI agent (CLAUDE.md の Gate 表現を配布物 ai:check と混同しないこと)
- 本リポを SAGE standard lane で保守する maintainer

## スコープ（含む）

- `CLAUDE.md` "Quality Gate Checklist" 節に「SAGE 内部 CI 検証モデルであり、配布物 `ai:check` / `ai:check:fast` / `ai:check:secure` とは別概念」を明示する追記
- `package-templates/.claude/README.md` "blocking モード" 節を Claude Code hook 公式仕様 (exit code 2 または stdout JSON `decision`) に整合させる書き換え
- `package-templates/.claude/rules/test-rules.md` から、配布先で解決不能になる maintainer 専用相対リンク (`../../../docs/roadmap.md`) を除去

## スコープ外（明示的に除外）

- `package-templates/.claude/settings.hook-fragment.json` 本体の構造変更 (現行 Claude Code spec に整合しているため不要)
- hook fragment の matcher に `MultiEdit` / `NotebookEdit` を追加する拡張 (別 SPEC で扱う方が筋がいい)
- README / `docs/` / `tests/` / `src/` / `bin/` / `package-templates/scripts/` / `package-templates/prompts/` の変更 (Codex 担当範囲、または本 issue と直接関係なし)
- `package-templates/docs/philosophy/` の更新 (本 issue と直接関係なし)
- SAGE governance 本体 (`sage/`) の変更
- `ai:check` の構造化実行 (PASS/FAIL/SKIPPED, timing, redacted output) / AC・Test Matrix の YAML 化 / `ai:check:secure` 拡張等の中期改善
- npm package version bump / npm publish / GitHub release
- 利用者が SAGE を導入する運用への変更 (利用者は引き続き SAGE 不要)

## 要件

### 機能要件
- [FR-01] `CLAUDE.md` "Quality Gate Checklist" の見出しまたは導入文で「本リポ内部の SAGE 検証モデル」であることが識別できること
- [FR-02] `CLAUDE.md` "Quality Gate Checklist" 節に、配布物 `ai:check` / `ai:check:fast` / `ai:check:secure` との別概念であることと、配布物検証の一次情報源 (`package-templates/.claude/README.md` または `package-templates/scripts/README.md`) への参照が含まれること
- [FR-03] `package-templates/.claude/README.md` "blocking モード" 節から `"blocking": true` という field 名の案内が削除され、代わりに exit code 2 または stdout JSON (`{"decision": "block", "reason": "..."}`) で blocking 制御する旨が書かれること
- [FR-04] `package-templates/.claude/rules/test-rules.md` から `../../../docs/roadmap.md` への相対リンクが削除されること、もしくは配布先で解決可能な形へ書き換えられること
- [FR-05] `package-templates/.claude/rules/test-rules.md` は配布先プロジェクト単独で意味が完結するファイルになること (maintainer context が混入しない)

### 非機能要件
- [NFR-01] 既存 hook fragment (`settings.hook-fragment.json`) の動作を変更しない
- [NFR-02] 利用者向け配布物の SAGE 非依存性を弱めない
- [NFR-03] `CLAUDE.md` の SAGE Lifecycle / Forbidden Shortcuts / File Scope / Traceability などの既存節は変更しない (Quality Gate Checklist 節のみ調整)
- [NFR-04] 修正対象 3 ファイルのうち、`CLAUDE.md` 以外は SAGE 保護対象外であるため、編集に `sage-managed: true` フラグは不要 (CLAUDE.md は必要)
- [NFR-05] 修正は ドキュメント文言のみで、JSON / shell / TypeScript / 設定ファイルの構造は変更しない

### セキュリティ要件
- [SEC-01] 修正対象ファイルに secret / token / credential / private URL を新規追加しない
- [SEC-02] `package-templates/.claude/README.md` の blocking 制御の説明を、Claude Code 公式 spec から逸脱しないようにする (誤った blocking 案内を残すと、利用者が誤実装で session 進行不能になるリスクあり)

### 運用要件
- [OPS-01] `make validate` が pass する
- [OPS-02] `bash scripts/sage-validate.sh` が pass する
- [OPS-03] `git diff --check` が pass する
- [OPS-04] commit message に TASK-ID を含める (commit-msg hook が enforce)
- [OPS-05] エラー発生時は TASK-ID と RUN-ID を該当 TASK の実行ログに記録し、`sage/anti-patterns.md` で既知パターンを確認する
- [OPS-06] 新規失敗パターンは発見した担当Agentが同一セッションで `sage/failures.md` へ FAIL-XXXX 形式で記録する

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `CLAUDE.md` "Quality Gate Checklist" 節に、SAGE 内部 CI 検証モデルであることが明示的に書かれている
- [x] AC-02: `CLAUDE.md` "Quality Gate Checklist" 節に、配布物 `ai:check` / `ai:check:fast` / `ai:check:secure` との別概念であることが書かれている
- [x] AC-03: `rg -n '"blocking"\s*:\s*true' package-templates/.claude/README.md` が検出ゼロ (`"blocking": true` 表記が残っていない)
- [x] AC-04: `package-templates/.claude/README.md` の blocking モード説明に「exit code 2」または「decision」のいずれかの語が含まれる (`rg -n 'exit code 2|decision' package-templates/.claude/README.md` が 1 件以上 hit)
- [x] AC-05: `rg -n '\.\./\.\./\.\./docs/roadmap\.md' package-templates/.claude/rules/test-rules.md` が検出ゼロ (壊れる相対リンクが除去されている)
- [x] AC-06: `make validate` が pass する
- [x] AC-07: `bash scripts/sage-validate.sh` が pass する
- [x] AC-08: `git diff --check` が pass する
- [x] AC-09: `rg -n 'TODO|FIXME' CLAUDE.md package-templates/.claude/README.md package-templates/.claude/rules/test-rules.md` が新規 unfinished marker を検出しない
- [x] AC-10: `node -e "const p=require('./package.json'); if ((p.files||[]).includes('CLAUDE.md')) process.exit(1)"` が pass (root `CLAUDE.md` が npm package files に含まれていないことを再確認)

## 異常系

- 想定エラー1: `CLAUDE.md` の Gate 1-5 説明を削ってしまい SAGE 内部 governance との整合性が壊れる → 該当節は削除せず、見出しまたは追加 1 行で「SAGE 内部モデルである」ことを明示する形に留める
- 想定エラー2: `package-templates/.claude/README.md` の blocking 説明を強い断定で書き換えた結果、Claude Code spec の将来変更に追従できなくなる → 公式 docs の参照リンクまたは「現行 spec では」など版管理可能な表現にする
- 想定エラー3: `test-rules.md` から roadmap 行を削除した結果、利用者が「配布される example である」「自分のプロジェクトの `.claude/rules/` にコピーする」という前提を見失う → 該当前提文 (1〜2 行目) は残し、リンクのみ除去する
- 境界ケース1: SAGE 保護ファイル `CLAUDE.md` の編集が `sage-managed: true` の TASK 経由でないと hook により block される → 該当 TASK ファイルに `sage-managed: true` を明示し、status を `In Progress` にしてから編集する

## 契約

- API: なし
- DB: なし
- イベント: なし
- Package contract: `package.json` の `files` は変更しない。`CLAUDE.md` は引き続き npm publish 対象外。配布物 `package-templates/.claude/README.md` と `package-templates/.claude/rules/test-rules.md` は npm package に同梱される (`files: ["package-templates/**"]` 相当) ため、文言修正は consumer 側に伝播する。

## リスク

- リスク1: CLAUDE.md の Gate 表現を変えると、過去 TASK (TASK-0001 等で Gate 1/2/4 と書かれている) との整合性に違和感が出る → 軽減策: 過去 TASK の「Gate 1/2/4」は本リポ内部 SAGE 検証の評価軸として読めるよう、CLAUDE.md 側に「SAGE 内部評価軸」と明記する
- リスク2: `package-templates/.claude/README.md` の blocking 説明書き換えで、既存 dogfooding 利用者のメンタルモデルが変わる → 軽減策: 削除ではなく置き換えとし、「現行 spec では exit code 2 / decision JSON」と書く
- リスク3: test-rules.md の maintainer リンクを単純削除すると、本リポ内部でその情報源 (roadmap) を参照するパスが失われる → 軽減策: 必要なら同等の説明を `package-templates/.claude/README.md` 側 (内部向け解説) に移す
- リスク4: 後続 SPEC が同様の「配布物に maintainer context が混入」issue を再発させる → 軽減策: 本 SPEC の AC を恒常的な linter pattern (`rg` パターン) として PLAN-0048 で残し、将来の review で再利用できるようにする

## 検証メトリクスと昇格条件

| 段階 | 合格基準 | 検証コマンド |
|---|---|---|
| Planning complete | SPEC / PLAN / TASK が作成済みで File Scope が 3 ファイルに限定される | `bash scripts/sage-validate.sh` |
| Implementation ready | feature branch 上で 3 ファイルのみ変更されている | `git diff --name-only main...HEAD` |
| Doc fix verified | AC-01..AC-05 が pass | `rg` パターン群 |
| Review ready | 全 AC と Gate 1, 3, 4 が pass | `make validate` + `bash scripts/sage-validate.sh` + `git diff --check` |

採用メトリクスは小規模 docs 修正のため、初見導線改善のような定性指標は本 SPEC では扱わない。代わりに、AC の `rg` パターンが将来の regression 検出に再利用できることを成功基準とする。

## Error Resolution / Knowledge Management

エラー発生時は担当Agentが以下を実行する。

1. 該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認し、既知パターンなら該当回避策に従う。
3. 新規パターンなら `sage/failures.md` に FAIL-XXXX 形式で追記する。
4. 同種失敗が 3 回累積した場合、Review TASK で `sage/anti-patterns.md` への昇格候補として記録する。
5. 修正は該当 TASK の File Scope 内に限定する。File Scope 外が必要な場合は TASK を改訂してから実行する。

Forbidden Shortcuts は `CLAUDE.md` と AGENTS.md の既存ルールに従う。特に TODO/FIXME の残置、`--no-verify`、`--force`、File Scope 外変更、SPEC なし実装、SAGE governance 直接変更は禁止する。

## 実装メモ（Implementation Agent向け）

- 本 SPEC は Claude Code Implementation Agent が単独で実装する想定 (3 ファイルすべて Claude 担当範囲)。
- `CLAUDE.md` の編集は SAGE 保護対象なので、TASK に `sage-managed: true` を明示し、status を `In Progress` にしてから編集を開始する。
- `CLAUDE.md` "Quality Gate Checklist" 節の既存 5 行 (Gate 1-5) と 3-state 行は維持する。見出しの修飾と 1 行の追記のみが許容範囲。
- `package-templates/.claude/README.md` "blocking モード" 節 (L74-77 付近) の書き換えは、`"blocking": true` field を案内する 1 文を、exit code 2 または stdout JSON `decision` で制御する旨に置き換える。「現行 spec では」のような版管理を可能にする表現を含める。
- `package-templates/.claude/rules/test-rules.md` の L4 付近、`リリース状況は [...](../../../docs/roadmap.md) を参照。` を削除する。冒頭 2 行 (配布される example である旨、利用者がコピーする旨) は残す。
- 変更後、`rg` パターンで AC-03 / AC-05 を即時確認する。
- commit 前に `make validate`、`bash scripts/sage-validate.sh`、`git diff --check` を順に実行する。

## Properties

### Invariants
- [INV-01] (Gate 4) `CLAUDE.md` "Quality Gate Checklist" 節は SAGE 内部検証モデルを指し、配布物 `ai:check` を指さない
- [INV-02] (Gate 4) 配布物 `package-templates/.claude/rules/*.md` は maintainer 専用相対リンクを含まない
- [INV-03] (Gate 3) `package-templates/.claude/README.md` の hook 制御の説明は Claude Code 公式 spec から逸脱しない
- [INV-04] (Gate 4) 本 SPEC の修正で `package.json` `files` の contract は変わらない (root `CLAUDE.md` は引き続き npm publish 対象外)

### Pre-conditions
- [PRE-01] (Gate 2) feature branch `feature/spec-0048-claude-docs-gate-clarity` 上で作業する
- [PRE-02] (Gate 2) `CLAUDE.md` を編集する TASK は `sage-managed: true` を明示し、status `In Progress` に遷移してから書き換える
- [PRE-03] (Gate 4) File Scope は 3 ファイル (`CLAUDE.md`, `package-templates/.claude/README.md`, `package-templates/.claude/rules/test-rules.md`) に限定される

### Post-conditions
- [POST-01] (Gate 2) AC-01..AC-05 がすべて pass する
- [POST-02] (Gate 2) `make validate` / `bash scripts/sage-validate.sh` / `git diff --check` がすべて pass する
- [POST-03] (Gate 4) commit message に TASK-ID が含まれ、traceability chain (SPEC-0048 → PLAN-0048 → TASK-XXXX → commit) が成立する
- [POST-04] (Gate 3) 修正対象ファイルに secret-like 値や新規 TODO/FIXME marker が残らない

### Assumptions
- [ASM-01] (Gate 横断) Claude Code の現行 hook spec は exit code 2 / stdout JSON `decision` で blocking 制御を行う (PostToolUse / Stop に共通)
- [ASM-02] (Gate 横断) Codex は本 SPEC の File Scope 内ファイルを並行編集しない
- [ASM-03] (Gate 横断) `make validate` および `bash scripts/sage-validate.sh` は SPEC-0047 完了時点の構成で pass する状態にある

## 関連ID

- PLAN-ID: PLAN-0048
- TASK-ID: TASK-0185

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0048-claude-docs-gate-clarity.md"
  target_type: SPEC
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
