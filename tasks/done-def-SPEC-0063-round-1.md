# Done Definition: SPEC-0063 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0062 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0063
- PLAN-ID: PLAN-0063
- TASK-ID: TASK-0227, TASK-0228, TASK-0229
- Round: 1
- テスト対象 URL: N/A（配布物 = manual-copy RLS テストテンプレ。実 Postgres / Supabase / ブラウザは本リポ CI で起動しない — NFR-01 / ASM-04）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0063 AC-01〜AC-06 の Gate 配分）

SPEC の AC↔Gate 対応表に従う: AC-01〜AC-04 = Gate 2: Functional、AC-05 = Gate 1: Structural（+ Gate 3: Security の service_role 非使用観点）、AC-06 = Gate 1: Structural。

### Structural Gate（Gate 1）

- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] 各 TASK の File Scope 外の変更がない（特に `src/cli/`（`managed-files.mjs` / `profile-docs.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` — manual-copy 境界保存 = INV-06 / ASM-03）/ `package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` 不変 = SPEC-0051）/ `package.json`（新規テストは `tests/cli/` glob 対象のため scripts 無変更）/ `docs/cli.md`（CLI surface 不変）/ 他 profile README の無変更）
- [ ] commit message に TASK-ID を含める（commit-msg hook で強制。TASK-0227 → TASK-0228 → TASK-0229 の順）
- [ ] **AC-05**: `package-templates/supabase/README.md` の Replacement Checklist が「設定変数ブロック 1 箇所編集 / env 注入」に簡素化され、SQL（`\set` / `-v`）・TS（`const` / `process.env`）・Playwright（`process.env`）の変数一覧と 2 つの注入方法が記載されている（`grep` で変数名一覧・`-v` / `process.env` の記載を検証）。`service_role` 非使用注意書きが残存し（`grep` + レビュー）、manual-copy 非追従性が明記されている（レビュー = FR-06 / FR-08 / SEC-02 / INV-06）【docs】
- [ ] **AC-06**: `package-templates/profiles/supabase-rls/README.md` と `package-templates/prompts/rls-permission.md` に、権限マトリクス（role/resource/action）をテスト設定変数（テーブル・所有者列・ロール名・ポリシー名）へ対応づけるガイドが存在する（`grep` で「設定変数」「マトリクス」等のキーワードとテンプレ参照の存在を検証）。`rls-permission.md` のマトリクス生成プロンプト本体（`## 手順` / `## 出力形式` Step 1〜3）が無変更である（レビュー確認 = FR-07）【docs】
- [ ] `make validate` / `npm pack --dry-run`（または既存 preflight）が壊れない（配布物変更は `package-templates/supabase/tests/*` / `package-templates/supabase/README.md` / `profiles/` / `prompts/` の既存 `package.json` `files` パターン内、`tests/cli/` は pack 非同梱）

### Functional Gate（Gate 2）

- [ ] **AC-01**: `rls_policy.test.sql` の `\set` 宣言行を除いた本文に `app_items` / `owner_id` のリテラル直書きが 0 件で、冒頭に `\set table_name`（および owner 列の `\set`）が存在し、本文が `:"table_name"` 等の識別子展開で参照している（`grep` で `^\s*\\set\b` 行を除外して直書き 0 件を検証 = FR-01）【unit】
- [ ] **AC-02**: `rls.integration.test.ts` の変数宣言ブロック（`const ... = process.env` 行）を除く本文に `app_items` / `owner_id` のリテラル直書きが 0 件で、冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"`（および owner 列相当）が存在し、本文が `TABLE` / `OWNER` を参照している（`grep`）。当該テンプレがパース/型健全である（FR-03）【unit】
- [ ] **AC-03**: env fallback — TS テンプレの変数解決が `process.env.RLS_TABLE` 未設定で default（`app_items`）、設定時にその値へ切り替わる（変数解決部分を単体で検証）。SQL テンプレは `-v table_name=<name>` 指定時に対象テーブルが切り替わり、無指定時に冒頭 `\set` の default が有効になる（構文レベル / dry-run 相当で検証。実 DB 接続なし = NFR-01）（FR-02 / FR-04）【unit】
- [ ] **AC-04**: SQL / TS テンプレの妥当性 — `rls_policy.test.sql` が psql `--dry-run` 相当（または pgTAP テンプレの静的構文チェック）でパース可能で、`plan(6)` の件数・6 アサーション（`lives_ok`/`isnt_empty`/`is_empty`/`lives_ok`/`results_eq`/`throws_ok`）の許可/拒否の意味が保存されている。`magic-link.spec.ts` を含む TS 系テンプレがパース健全で、`describe`/`test` 構造が保存されている（NFR-03 の検証意図保存を含む。実 DB / ブラウザ起動なし = NFR-01）【unit + integration】
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、CI テンプレ変更後も既存テストが無修正で pass する（NFR-01 後方互換 / INV-01 / INV-02 / INV-03 / PRE-01 / POST-01 / POST-02）【unit + integration】
- [ ] NFR-04: 各分岐（SQL 本文ハードコード不在 / TS 本文ハードコード不在 / SQL 構文健全性 / TS パース健全性 / env fallback（SQL `-v`）/ env fallback（TS `process.env`））に最低 1 テストケースが対応している
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）。テストケース名は日本語（言語規約）
- [ ] 新規 `tests/cli/supabase-rls-template.test.mjs` の grep 除外正規表現（SQL: `^\s*\\set\b` 行除外 / TS: `const ... = process.env` 行除外）が、除外後の本文に対して `\bapp_items\b` / `\bowner_id\b` を検査している（PLAN-0063 実装リスク7。除外設計は SPEC AC-01 / AC-02 が一次情報源）

### Security Gate（Gate 3）

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" package-templates/supabase package-templates/profiles/supabase-rls package-templates/prompts/rls-permission.md tests/cli/supabase-rls-template.test.mjs` が新規 unfinished marker を検出しない
- [ ] **SEC-01 / INV-04**: SQL テンプレでスキーマ識別子を埋め込む変数参照が psql 識別子展開（`:"var"` ダブルクォート）で、値展開（`:'var'` シングルクォート）で識別子を埋め込む形が存在しない（AC-01 の `:"var"` 参照形存在確認 + AC-04 の SQL 妥当性 + レビュー）。使い分けがテンプレコメント + README に明記されている（異常系2）
- [ ] **SEC-02 / INV-05**: RLS correctness の検証経路が anon key + 実ユーザー session で、`service_role` / 特権サーバキーを使う経路・default・例示がテンプレに存在しない。「service-role bypass warning」コメントが残存する（AC-05 のレビュー + テンプレ内 anon key + user session 経路の維持のレビュー — 異常系4 / PRE-02）
- [ ] **SEC-03**: 設定変数ブロック・README・prompt 追記に実在の secret / token / 本番 URL / 本番 email が無い。UUID は `0000...0001` 系ダミー、URL は `127.0.0.1` 系ローカル、email は `.test` ドメインを維持（レビュー + grep）
- [ ] ASM-01: psql の識別子展開（`:"var"`）と `-v var=value` 上書きが公式ドキュメントと照合済みである（src-rules.md AI Output Verification。TASK-0227 のレビューで参照確認）
- [ ] NFR-02: 新規 npm 依存（SQL/YAML パーサ・fixture ローダ等）を追加していない（`tests/cli/package.test.mjs` L135 の runtime dependencies 検査で機械検証）

### Architecture Gate（Gate 4）

- [ ] TASK-0227 → TASK-0228 → TASK-0229 の commit 順序（git log で確認。TASK-0227 → TASK-0228 は同一新規テストファイル `tests/cli/supabase-rls-template.test.mjs` への追記順序固定）
- [ ] **INV-06 / ASM-03**: supabase テンプレが manual-copy 配布物のまま保たれ、`src/cli/`（`managed-files.mjs` / `profile-docs.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs`）が無変更である（SPEC-0056 の 3-way managed file 経路に載せない。File Scope 外 diff ゼロ + レビュー）
- [ ] SPEC-0051 保存: `package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs` の `security:sast` = `semgrep scan --config auto` が無変更である（File Scope 外 diff ゼロ + レビュー）
- [ ] **INV-01**: 各テンプレでスキーマ依存識別子（テーブル名・所有者列名）が「ファイル冒頭の設定変数ブロック 1 箇所」でのみ default 宣言され、本文にリテラル直書きが存在しない（AC-01 / AC-02）
- [ ] **INV-02 / POST-01 / POST-02**: env / `-v` 無指定時のテンプレ対象が本 SPEC 適用前の旧テンプレと同一で、新テンプレは default 値のまま有効な SQL / TS、既にコピー済みの旧ハードコード形テンプレも有効な SQL / TS のまま（AC-03 / AC-04 + manual-copy 非追従性）
- [ ] **INV-03**: パラメータ化前後で pgTAP の `plan()` 件数・各アサーションの許可/拒否の意味・`describe`/`test` 構造が一致する（AC-04）
- [ ] `docs/cli.md` / 他 profile README が無変更である（CLI surface 不変 — スコープ外節。File Scope 外 diff ゼロ）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] File Scope 外変更が `templates/hooks/check-file-scope.sh` で検出されていない

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。RLS 変数注入の失敗（変数集約したが本文に置換漏れ / env 注入が効かない）は症状欄冒頭に原因タグ『rls: 変数注入漏れ』を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01。原因タグは cause enum を置き換えず補助的に追加する）。
4. 同種失敗 3 回で `sage/anti-patterns.md` 昇格候補にする（判定: 次マイナーバージョン PLAN 起票時に `grep -c 'rls: 変数注入漏れ' sage/failures.md` で機械確認。3 回累積で変数集約の粒度見直し（案B fixture 切り出し検討を含む）を別 SPEC 起票 — OPS-01）。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
