# Done Definition: SPEC-0062 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0061 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0062
- PLAN-ID: PLAN-0062
- TASK-ID: TASK-0222, TASK-0223, TASK-0224, TASK-0225, TASK-0226
- Round: 1
- テスト対象 URL: N/A（CLI + 配布 CI テンプレ。GitHub Actions runner は本リポ CI で実行しない — NFR-05 / ASM-01）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0062 AC-01〜AC-08 の Gate 配分）

### Structural Gate（Gate 1）

- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし）
- [ ] 各 TASK の File Scope 外の変更がない（特に `src/cli/profile-scripts.mjs`（`security:sast` 不変 — INV-02）/ `.github/workflows/ai-quality.yml` / `ai-quality/action.yml`（hosted contract 不変 — INV-05）/ `src/cli/managed-files.mjs` / `install-state.mjs` / `update.mjs`（3-way 判定本体不変 — ASM-03）/ `package-templates/profiles/` の無変更。`src/cli/ci-workflows.mjs` は差分ゼロが原則 — FR-05）
- [ ] commit message に TASK-ID を含める（commit-msg hook で強制）
- [ ] **AC-07**: `docs/github-actions.md` に third-party action の SHA pin 具体手順が存在し、4 点（対象 action 一覧 / `@<SHA> # vX` 形式 / SHA の調べ方 / `@v0.3.0` タグ pin との違い）が同節に含まれる（レビューで確認）。`grep` で `security-events: write` 記載と SHA pin 例（40 桁 hex または `# v` コメント併記）の存在を検証（FR-08 / FR-09 / SEC-01 / SEC-02）【docs】
- [ ] **AC-08**: `package-templates/ci-examples/README.md` に (a) monorepo（paths filter / matrix / `--workspace` 接続）、(b) SARIF opt-in、(c) §7 SHA pin 手順参照、の 3 節が存在し、リンク先が `docs/github-actions.md` である（`grep` で monorepo・SARIF・SHA pin の各キーワード、リンク先はレビュー確認 = FR-09）【docs】
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない（配布物追加は `ci-examples/*.yml` / docs / README で `package.json` `files` の既存パターン内、`tests/` は pack 非同梱）

### Functional Gate（Gate 2）

- [ ] **AC-01**: `node --test tests/cli/*.test.mjs` が全件パスし、CI テンプレ変更後も 4 PM（pnpm / npm / yarn / bun）× 2 direct file（`ai-check.yml` / `ai-check-fast.yml`）の `renderedCiWorkflow` 出力が YAML 妥当で、active な job 構造（`jobs:` 直下の step 列と実行コマンド）が本 SPEC 適用前と同一である（追加はコメント雛形のみ = NFR-01 / NFR-03 / INV-01 / INV-03 / PRE-01）【unit + integration】
- [ ] **AC-02**: `ai-check.yml`（4 PM 描画いずれでも）に SARIF opt-in の 3 要素（`semgrep scan --sarif` / `github/codeql-action/upload-sarif` / `security-events: write`）が grep でヒットし、`ai-check-fast.yml` に SARIF 要素が不在である（FR-01。grep で存在 / 不在を検証）【unit】
- [ ] **AC-03**: `package-templates/package.scripts.fragment.json` L9 と `src/cli/profile-scripts.mjs` L62 の両方に `semgrep scan --config auto` がヒットし、いずれも `git diff` がゼロ（SARIF 経路が package script を変えていない、FR-02 / INV-02 / SPEC-0051 FR-02）【unit】
- [ ] **AC-04**: `ai-check.yml` / `ai-check-fast.yml` に paths filter 例（`paths:` コメント + workspace glob 例）が存在し、OPS-02 の「required check 全スキップで pending にならない工夫」の案内が同ファイルまたは docs に存在する。`ai-check.yml` に matrix 例（`strategy:` / `matrix:`）が存在する（grep = FR-03 / FR-04）【unit】
- [ ] **AC-05**: 未改変の CI テンプレを持つ target への `update`（フラグなし）が更新後テンプレ（4 PM 変種のいずれか）に一致する既存ファイルを `local == baseline` 経路で auto-follow し、`isManagedCiWorkflowContent` が更新後 4 変種を managed と判定する（FR-06 / POST-01 / SPEC-0056 3-way 未改変経路）【integration】
- [ ] **AC-06**: 利用者が改変した CI テンプレ（`local != baseline` かつ `local != 新 upstream`）を持つ target への `update`（フラグなし）が `skip-modified` で既存改変を保護し、`--force-managed` で `.bak-<version>` 書き込み後に上書きする（FR-07 / POST-02 / SPEC-0056 INV-01 継続）【integration】
- [ ] NFR-04: 各分岐（SARIF 3 要素存在 / fast への SARIF 不在 / paths filter 例 / matrix 例 / PM 別描画不変性（4 PM × 2 direct file）/ 3-way 未改変 auto-follow / 3-way 改変済み skip-modified）に最低 1 テストケースが対応している
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）
- [ ] 既存の CI 関連テストの期待値（`managed-files.test.mjs` の managed paths リスト・既存 3-way ケース・PM 別描画の active 部分）の diff がゼロで、追加ケースのみである（NFR-01 / PLAN-0062 実装リスク8。レビューで確認）

### Security Gate（Gate 3）

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" package-templates/ci-examples src/cli/ci-workflows.mjs docs/github-actions.md tests/cli/ci-workflows.test.mjs` が新規 unfinished marker を検出しない
- [ ] **AC-07（Security 観点）**: SARIF 雛形の `security-events: write` が SARIF scan / upload ステップと同じブロック内でコメント化され、SARIF を有効化しない利用者の permission は `contents: read`（現行）のまま広がらない（SEC-01 / INV-04。レビューで確認）
- [ ] SEC-02: SHA pin 手順に「third-party action の tag は可変で SHA pin で内容を固定する」supply-chain の根拠が明記され（ASM-04）、SHA pin を強制せず strict policy 組織向けの推奨経路として提示されている（レビュー）
- [ ] SEC-03: SARIF 雛形に「finding にパスや周辺コードが含まれる点に留意。secret / private value を CI ログ / SARIF に載せない」旨の注意書きがある（レビュー）
- [ ] PRE-02: SARIF 雛形の外部 action 参照（`github/codeql-action/upload-sarif` の `sarif_file` 入力・バージョン）と Semgrep `--sarif` フラグが公式ドキュメントと照合済みである（src-rules.md AI Output Verification。レビューで参照確認）
- [ ] NFR-02: 新規 npm 依存（YAML パーサ等）を追加していない（`tests/cli/package.test.mjs` の dependencies 検査で機械検証）

### Architecture Gate（Gate 4）

- [ ] TASK-0222 → TASK-0223 → { TASK-0224, TASK-0225 → TASK-0226 } の commit 順序（git log で確認。TASK-0222 → TASK-0223 は同一 `ai-check.yml` への追記順序固定）
- [ ] INV-02: `security:sast` の値が `semgrep scan --config auto` のままで、SARIF 経路が `src/cli/profile-scripts.mjs` を変更していない（AC-03 のテスト + diff レビュー）
- [ ] INV-03: `renderedCiWorkflow(fileName, pm)` の 4 PM 変種が YAML 妥当で、`isManagedCiWorkflowContent` が更新後 4 変種を managed と判定する（AC-01 / AC-05）
- [ ] INV-05 / SPEC-0040: hosted workflow（`ai-quality.yml`）/ Composite Action（`action.yml`）の input / step contract が不変である（File Scope 外 diff ゼロ + レビュー）
- [ ] ASM-03: SPEC-0056 3-way ロジック本体（`managed-files.mjs` / `install-state.mjs` / `update.mjs`）が無変更で、CI テンプレ hash 変化が既存経路で処理される（File Scope 外 diff ゼロ + AC-05 / AC-06 の 3-way 挙動不変）
- [ ] FR-05: `src/cli/ci-workflows.mjs` の diff がゼロで、追加コメントが PM 別置換対象文字列（`pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK`）を含まない（レビュー + AC-01 の 4 PM 描画 YAML 妥当性）
- [ ] SARIF が `ai-check-fast.yml` に混入していない（FR-01 / 境界ケース1。AC-02 の fast 不在検証 + レビュー）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] File Scope 外変更が `templates/hooks/check-file-scope.sh` で検出されていない

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。SARIF 有効化失敗（`security-events: write` 付与漏れ / `upload-sarif` の pin ずれ）は症状欄冒頭に原因タグ『sarif: 有効化失敗』を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01。原因タグは cause enum を置き換えず補助的に追加する）。
4. 同種失敗 3 回で `sage/anti-patterns.md` 昇格候補にする（判定: 次マイナーバージョン PLAN 起票時に `grep -c 'sarif: 有効化失敗' sage/failures.md` で機械確認）。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
