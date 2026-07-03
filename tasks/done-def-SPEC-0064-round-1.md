# Done Definition: SPEC-0064 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0063 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0064
- PLAN-ID: PLAN-0064
- TASK-ID: TASK-0230, TASK-0231
- Round: 1
- テスト対象 URL: N/A（配布物 = manual-copy Semgrep ルール YAML + docs。本リポ CI では利用者コードに対する実 Semgrep スキャンを回さない — NFR-01 / ASM-04）
- 起動コマンド: `node --test tests/cli/supabase-semgrep-rules.test.mjs`（Round 全体は `node --test tests/cli/*.test.mjs`）

## Pass/Fail 判定（SPEC-0064 AC-01〜AC-05 の Gate 配分）

SPEC の AC↔Gate 対応表に従う: AC-01 / AC-02 = Gate 2: Functional、AC-03 = Gate 2: Functional（+ Gate 3: Security の誤検知配慮観点）、AC-04 = Gate 1: Structural（+ Gate 3: Security の `security:sast` 不変 / service_role 非使用観点）、AC-05 = Gate 1: Structural。

### Structural Gate（Gate 1）

- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] 各 TASK の File Scope 外の変更がない（特に `src/cli/`（`profile-scripts.mjs` / `managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` — manual-copy 境界保存 = INV-06 / ASM-03）/ `package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` 不変 = SPEC-0051 / INV-01）/ `package-templates/ci-examples/`（SARIF / CI 経路は SPEC-0062）/ `package-templates/prompts/rls-permission.md` / `package-templates/supabase/tests/` テンプレ 3 種（SPEC-0063）/ `package.json`（新規テストは `tests/cli/` glob 対象のため scripts 無変更）/ `docs/cli.md`（CLI surface 不変）/ 他 profile README の無変更）
- [ ] commit message に TASK-ID を含める（commit-msg hook で強制。TASK-0230 → TASK-0231 の順）
- [ ] **AC-04**: `package-templates/supabase/README.md` に「Semgrep ルール例」節があり、(1)`security:sast` = `semgrep scan --config auto` 不変、(2)`--config ./supabase/semgrep/authz-rules.yml` 追加適用コマンド例、(3) ルールが「例（出発点）」で誤検知しうる旨、(4)`nosemgrep: <rule-id>` 抑制、(5)`prompts/security-scan.md` triage 導線が含まれる（`grep` で `--config` / `authz-rules.yml` / `config auto` / `nosemgrep` / `security-scan` の共存を検証）。`service_role` 非使用注意書きが維持され追記と整合している（`grep` + レビュー = FR-04 / SEC-02 / INV-01 / INV-02）【docs】
- [ ] **AC-05**: `package-templates/profiles/supabase-rls/README.md` に `authz-rules.yml` 同梱 + opt-in（`--config` 追加）要約が、`package-templates/prompts/security-scan.md` に `authz-rules.yml` 追加適用出力の triage 対象化 + 出発点前提の記載が存在する（`grep` で `authz-rules.yml` / `--config` / triage 該当キーワードを検証）。`security-scan.md` の既存 triage 分類ロジック（fix now / false positive / suppress with owner+expiration / needs human review）・出力フォーマットが無変更である（レビュー確認 = FR-05）【docs】
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない（配布物変更は `package-templates/supabase/semgrep/authz-rules.yml`（新規）/ `package-templates/supabase/README.md` / `profiles/` / `prompts/` の既存 `package.json` `files` パターン内、`tests/cli/` は pack 非同梱）

### Functional Gate（Gate 2）

- [ ] **AC-01**: `package-templates/supabase/semgrep/authz-rules.yml` が存在し Semgrep rule schema として妥当 — トップレベル `rules:`（リスト）+ 各ルールに `id` / `message` / `severity` / `languages` / いずれかの pattern operator（`pattern` / `patterns` / `pattern-either` / `pattern-regex`）を持つ。`ruby -ryaml` でパースして各ルールに 5 必須要素が揃うことを検証（`ci-workflows.test.mjs` 先例）。**ruby 不在環境では YAML パースを SKIPPED とし、grep ベースで `rules:` / 各ルールの `id:` / `message:` / `severity:` / `languages:` / pattern operator トークンの存在を代替検証**。各ルールの `severity` 値が Semgrep OSS 有効値集合 `{ERROR, WARNING, INFO}` のいずれかである（無効値 `HIGH`/`CRITICAL` を弾く）（FR-01 / NFR-01）【unit】
- [ ] **AC-02**: ルール meta が健全 — ルールが 3 件、`id` が一意（重複なし）で `nosemgrep: <id>` 参照可能な namespace 付き命名。各ルールの `languages` が TS/JS（`typescript` / `javascript` / `ts` / `js` のいずれか）を含む。3 ルールがそれぞれ (a) service_role 誤用、(b) 認可なし RLS クエリ、(c) route handler の意図に対応する `id` / `message` を持つ（`grep` / パースで id 集合・languages・件数を検証）（FR-01 / FR-02）【unit】
- [ ] **AC-03**: 各ルールに誤検知配慮のコメントが併記されている — YAML コメントに「例 / 出発点（starting point / example / not exhaustive 相当）」の但し書き、`nosemgrep`（`// nosemgrep:` または `nosemgrep: <rule-id>`）抑制方法、`paths:` / `pattern-not` チューニング前提が記載（`grep` で該当キーワード + `nosemgrep` の存在を検証）（FR-03 / SEC-01）【unit + docs】
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、ルール YAML 追加後も既存テストが無修正で pass する（NFR-01 後方互換 / INV-01 / INV-02 / INV-03 / PRE-01 / POST-01 / POST-02）【unit + integration】
- [ ] NFR-04: 各新規追加要素（YAML schema 妥当性 / ルール meta 健全性 / 誤検知配慮コメント / opt-in 適用手順の存在 / 導線追記）に最低 1 テストケースが対応している
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）。テストケース名は日本語（言語規約）
- [ ] 新規 `tests/cli/supabase-semgrep-rules.test.mjs` の ruby 不在時 grep 代替が、`ruby -ryaml` パス時と同一の AC-01 結論に到達する（`/^\s*rules:/m` + 各必須キートークン + pattern operator トークン + `severity` 値が有効集合内。PLAN-0064 実装リスク7。`ci-workflows.test.mjs` の `hasRuby()` 先例踏襲）

### Security Gate（Gate 3）

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" package-templates/supabase package-templates/profiles/supabase-rls package-templates/prompts/security-scan.md tests/cli/supabase-semgrep-rules.test.mjs` が新規 unfinished marker を検出しない
- [ ] **SEC-01 / INV-01**: ルールが既定 gate に組み込まれず opt-in（`--config` 追加）に留まる（`security:sast` = `semgrep scan --config auto` 不変 = AC-04 の `config auto` 不変記載 + `package.scripts.fragment.json` / `profile-scripts.mjs` 無変更確認）。ルール pattern が明確なアンチパターンに限定され、`pattern-not` / `paths:` チューニング前提と `nosemgrep` 抑制が明記されている（AC-03）。検出困難な (c) の `severity` が `ERROR` を避け `WARNING`/`INFO`（AC-01 の `severity` 値 + レビュー）
- [ ] **SEC-02 / INV-04**: ルール YAML・README・prompt に `service_role` を使う経路の推奨・実値・例示が無い（ルール (a) は service_role 誤用を**検出する側**）。既存テンプレの anon key + user session 経路（「service-role bypass warning」）と整合し、`supabase/README.md` の `service_role` 非使用注意書きが維持されている（AC-04 のレビュー + grep — 異常系4）
- [ ] **SEC-03**: ルール YAML・README・prompt 追記に実在の secret / token / service_role key の実値 / 本番 URL / 本番 email が無い。pattern が参照する env 名（`SUPABASE_SERVICE_ROLE_KEY` 等）は名前のみで値を書いていない。例示は非機密プレースホルダ（`app_items` / `127.0.0.1` / `.test`）を維持（レビュー + grep）
- [ ] **PRE-02 / ASM-01**: ルール pattern（pattern operator / `severity` 有効値 `ERROR`/`WARNING`/`INFO` / `languages` 綴り）が Semgrep 公式 rule-syntax ドキュメントと照合済みで、確認日が実行ログ / レビューに記録されている（src-rules.md AI Output Verification。TASK-0230 のレビューで参照確認）。**残存リスク明記**: 本リポ CI では実 semgrep を回さないため pattern の**意味的**妥当性（実際にアンチパターンを検出する / 誤検知しない）はテストで担保できず、レビュー + 実装者照合に依存する（AP-06 部分残存。将来 semgrep バイナリがあれば `semgrep --validate` を additive 追加可能）
- [ ] NFR-02: 新規 npm 依存（YAML パーサ・rule linter・semgrep devDependency 等）を追加していない（`tests/cli/package.test.mjs` の runtime dependencies 検査で機械検証）

### Architecture Gate（Gate 4）

- [ ] TASK-0230 → TASK-0231 の commit 順序（git log で確認。TASK-0230 → TASK-0231 は同一新規テストファイル `tests/cli/supabase-semgrep-rules.test.mjs` への追記順序固定 + docs が rule id/path に依存 = PRE-01）
- [ ] **INV-06 / ASM-03**: ルール YAML が manual-copy 配布物のまま保たれ、`src/cli/`（`profile-scripts.mjs` / `managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs`）が無変更である（SPEC-0056 の 3-way managed file 経路に載せない。File Scope 外 diff ゼロ + レビュー）
- [ ] **INV-01**: `security:sast` が常に `semgrep scan --config auto`（Semgrep entrypoint）で、カスタムルールは既定 gate に組み込まれず opt-in（`--config` 追加）でのみ適用される。`package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs` の `security:sast` が無変更である（SPEC-0051 FR-02 / INV-01 保存。File Scope 外 diff ゼロ + レビュー）
- [ ] **INV-02 / POST-02**: `--config` を追加しない利用者の観測可能な挙動（`security:sast` / `ai:check:secure` の 4-step chain）が本 SPEC 適用前と同一である（opt-in の完全性。ルール YAML 追加 + docs 追記が既定挙動に影響しないことをレビュー確認）
- [ ] **INV-03 / POST-01**: `authz-rules.yml` が schema 妥当な 3 ルール（id 一意・TS/JS）を含み、`--config` 追加で semgrep に読み込める形である（AC-01 / AC-02）
- [ ] **INV-05**: 各ルールに「例（出発点）であり網羅ではない」旨と `nosemgrep`（`nosemgrep: <rule-id>`）抑制方法・チューニング前提が併記されている（AC-03）
- [ ] SPEC-0062 保存: `package-templates/ci-examples/` / SARIF 経路が無変更である（File Scope 外 diff ゼロ + レビュー）
- [ ] SPEC-0063 保存: `package-templates/supabase/tests/` テンプレ 3 種が無変更である（File Scope 外 diff ゼロ + レビュー）
- [ ] `prompts/rls-permission.md` / `docs/cli.md` / 他 profile README が無変更である（本 SPEC は 3 docs に限る / CLI surface 不変 — スコープ外節。File Scope 外 diff ゼロ）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] File Scope 外変更が `templates/hooks/check-file-scope.sh` で検出されていない

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。ルール誤検知の失敗（明確なアンチパターンでないコードを誤検出 / 利用者が `nosemgrep`・`paths:` で抑制せざるを得なかった）は症状欄冒頭に原因タグ『semgrep: authz ルール誤検知』（固定文字列・表記ゆれ禁止）を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01。原因タグは cause enum を置き換えず補助的に追加する）。
4. 同種失敗 3 回で `sage/anti-patterns.md` 昇格候補にする（判定: 次マイナーバージョン PLAN 起票時に `grep -c 'semgrep: authz ルール誤検知' sage/failures.md` で機械確認。3 回累積で `pattern-not`/`paths:` 追加による絞り込みまたはルール除去を別 SPEC 起票 — OPS-01）。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
