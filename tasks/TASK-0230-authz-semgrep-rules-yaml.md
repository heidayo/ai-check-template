# TASK-0230: Semgrep authz ルール YAML の作成 + 新規テスト作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0230 |
| SPEC-ID   | SPEC-0064 |
| PLAN-ID   | PLAN-0064 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0231 が同一新規テストファイル `tests/cli/supabase-semgrep-rules.test.mjs` に追記するため追記順序を固定する） |
| 依存TASK  | なし |
| 見積     | 3h |

## 責務

`package-templates/supabase/semgrep/authz-rules.yml`（**新規**）に、authz / RLS / レート制限を無視した典型失敗を検出する Semgrep ルール例 3 件を Semgrep 公式 rule schema で記述する（SPEC T1）。トップレベルは `rules:`（リスト）で、各ルールは `id`（一意・namespace 付き）/ `message` / `severity` / `languages`（TS/JS）/ いずれかの pattern operator を持つ。各ルールに YAML コメントで検出意図・「例（出発点）であり網羅ではない」・`nosemgrep: <id>` 抑制・`paths:`/`pattern-not` チューニング前提を併記する。あわせて新規テスト `tests/cli/supabase-semgrep-rules.test.mjs` を作成し、YAML schema 妥当性・ルール meta 健全性・誤検知配慮コメントの検証ケースを固定する。

## 入力

- SPEC-0064 FR-01 / FR-02 / FR-03、SEC-01 / SEC-03、NFR-01 / NFR-02 / NFR-03 / NFR-04、AC-01 / AC-02 / AC-03、異常系1 / 異常系2 / 異常系4、境界ケース1、契約 (1) / (3)、実装メモ「ルール YAML」、リスク1 / リスク2 / リスク4 / リスク5 / 実装リスク7、INV-03 / INV-04 / INV-05、PRE-02、ASM-01 / ASM-02 / ASM-04
- 3 ルール例の骨格（SPEC 実装メモ一次情報源）:
  - (a) `supabase-rls.service-role-client-misuse`: Supabase client を service_role key（`SUPABASE_SERVICE_ROLE_KEY` 等の env、または `service_role` を含む変数）で `createClient(...)` する疑い。`patterns` + `pattern: createClient($URL, $KEY, ...)` + `metavariable-pattern`（`$KEY` を `pattern-regex: (?i)service_role|SERVICE_ROLE_KEY` 相当で絞る）で保守的に検出。RLS バイパス疑い（severity: 明確なアンチパターン寄りのため `WARNING`）
  - (b) `supabase-rls.rls-query-without-owner-filter`: `.from(...).select(...)` に所有者フィルタ（`.eq("owner_id"/"user_id", ...)`）や auth コンテキストが**付かない**形を `patterns` + `pattern` + `pattern-not`（フィルタ付き形を除外）で保守的に絞る（過剰検出しない。severity: `WARNING` or `INFO`）
  - (c) `supabase-rls.route-handler-without-authz-guard`: TS/Next.js route handler（`export async function GET/POST(...)` 等）に認可 / レート制限ガードが見当たらない疑い。`pattern-inside` 等で route の export 形に限定。**言語非依存の汎用検出は困難なため TS/Next.js route の典型形に限定した example**とし「これは出発点であり網羅ではない」と明記。検出困難ゆえ severity は `ERROR` を避け `WARNING`/`INFO`（SEC-01）
- `severity` の有効値（PRE-02 / リスク1 の一次情報源）: Semgrep OSS の `severity` 有効値は `ERROR` / `WARNING` / `INFO` のみ。`HIGH`/`CRITICAL`/`LOW`/`MEDIUM` は AppSec Platform 用の表示分類でありコミュニティ rule の `severity:` には使えない。3 ルールとも `ERROR`/`WARNING`/`INFO` から選ぶ（誤検知前提で (c) を下げる）
- `id` 命名: `nosemgrep: <id>` で参照するため namespace 付き（`supabase-rls.<name>`）にし、3 件で重複させない。`languages` は TS/JS（`[typescript, javascript]`）を含める
- 実ドキュメント照合（PRE-02 / ASM-01 / src-rules.md AI Output Verification / リスク1）: pattern operator（`pattern` / `patterns` / `pattern-either` / `pattern-regex` / `metavariable-pattern` / `pattern-inside` / `pattern-not`）・`severity` の有効値（`ERROR`/`WARNING`/`INFO`）・`languages` の綴り（`typescript`/`javascript`/`ts`/`js`）を Semgrep 公式 rule-syntax ドキュメントで照合してから確定する（幻覚フラグ混入防止）。**照合した確認日を実行ログ / レビューに記録**し、照合した構文をルール YAML コメントに残す
- service_role 非使用の維持（SEC-02 / INV-04 / 異常系4）: ルール (a) は service_role 誤用を**検出する側**であり、YAML に service_role を使う正しい例 / 推奨を書かない。pattern が参照する env 名（`SUPABASE_SERVICE_ROLE_KEY` 等）は**名前のみ**で、値は書かない
- secret 非混入（SEC-03）: 実在の secret / token / service_role key の実値 / 本番 URL / 本番 email を書かない。例示コードは非機密プレースホルダ（`app_items` / `127.0.0.1` / `.test` 系）を維持
- 言語規約: `authz-rules.yml` のコメントは英語（Semgrep ルールの慣習 + 利用者向け example）。rule id・env var 名は英語（コード識別子）
- 新規テスト（`tests/cli/supabase-semgrep-rules.test.mjs`）の設計: YAML を文字列で読み、`ruby -ryaml` でパースして `rules` がリスト・各ルールに `id`/`message`/`severity`/`languages`/pattern operator が揃い、`severity` が `{ERROR, WARNING, INFO}` のいずれかであることを assert（AC-01）。**ruby 不在は `ci-workflows.test.mjs` の `hasRuby()` 先例に倣い SKIPPED とし、grep ベース（`/^\s*rules:/m` の存在 + `id:` / `message:` / `severity:` / `languages:` トークン + pattern operator トークン + `severity` 値が有効集合内）で代替検証**（AC-01 / NFR-01 / 実装リスク7）。ルール件数 3・`id` 一意（namespace 付き）・`languages` TS/JS・3 意図の id/message（AC-02）。YAML コメントの「例 / 出発点（starting point / example / not exhaustive 相当）」但し書き + `nosemgrep` + `paths:`/`pattern-not` 言及を grep（AC-03）。読み取り + 静的アサートのみで実 semgrep を回さない。テストケース名は日本語 + AC-N 参照

## 出力

- `package-templates/supabase/semgrep/authz-rules.yml`（**新規作成**）: `rules:` トップレベル + 3 ルール例（(a) service_role 誤用 / (b) 認可なし RLS クエリ / (c) ガードなし TS route）。各ルールに `id`（一意・namespace 付き）/ `message` / `severity`（`ERROR`/`WARNING`/`INFO`）/ `languages`（TS/JS）/ pattern operator + 誤検知配慮コメント
- `tests/cli/supabase-semgrep-rules.test.mjs`（**新規作成**）: YAML schema 妥当性（`ruby -ryaml` + ruby 不在 SKIPPED + grep 代替 + `severity` 値集合 = AC-01）+ ルール meta 健全性（件数 3・id 一意・languages TS/JS = AC-02）+ 誤検知配慮コメント（AC-03）の検証ケース。docs 側のケースは TASK-0231 が追記する

## File Scope（変更許可範囲）

- 作成: `package-templates/supabase/semgrep/authz-rules.yml`
- 作成: `tests/cli/supabase-semgrep-rules.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `security:sast`（`semgrep scan --config auto`）の変更・カスタムルールの既定 gate 強制組み込みの禁止 — カスタムルールは opt-in（`--config` 追加）に留める（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 — SPEC-0051 FR-02 / INV-01 保存）
- `src/cli/` の変更の禁止 — ルール YAML は manual-copy のまま。CLI 管理化はスコープ外（触れたら設計を疑う。検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — INV-06）
- 無効な Semgrep 構文（公式 rule syntax 未照合の pattern / 必須キー欠落 / 無効 `severity` 値 `HIGH`/`CRITICAL` 等）のコミットの禁止（検出: AC-01 の YAML schema 妥当性（`ruby -ryaml` パース + grep 代替 + `severity` 値集合検証）+ レビューで公式 rule syntax 参照確認 — src-rules.md AI Output Verification / PRE-02）
- ルール YAML への `service_role` 使用の推奨・実値・実在 secret / 本番 URL / 本番 email の混入の禁止 — env 名は名前のみ、例示は非機密プレースホルダ（検出: YAML の grep + レビュー — SEC-02 / SEC-03 / INV-04）
- 過剰検出で既定 CI を壊すルールを既定 gate に入れることの禁止 — opt-in + 明確なアンチパターン限定 + `nosemgrep`/`paths:`/`pattern-not` 明記（検出: AC-03 の誤検知配慮記載 + 既定 gate 不変 — SEC-01 / INV-01）
- 「例（出発点）であり網羅ではない」但し書きの省略の禁止 — ルールを網羅的 authz チェックと誤解させない（検出: AC-03 の但し書き存在検証 — リスク5）
- 新規 npm 依存（YAML パーサ・rule linter・semgrep devDependency）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- File Scope 外への変更の禁止（特に `src/cli/` / `package-templates/ci-examples/` / `prompts/rls-permission.md` / `supabase/tests/` テンプレ 3 種）（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME を残してコミットすることの禁止（src-rules.md Forbidden shortcuts）
- commit message に TASK-0230 を含めないコミットの禁止（commit-msg hook で強制）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。ルール誤検知関連は症状欄冒頭に原因タグ『semgrep: authz ルール誤検知』を付し、既存 `cause` enum の該当値と併記する — OPS-01）
- [ ] `package-templates/supabase/semgrep/authz-rules.yml` を新規作成し、トップレベル `rules:`（リスト）+ 3 ルール例（(a) service_role 誤用 / (b) 認可なし RLS クエリ / (c) ガードなし TS route）が存在する（AC-01 / AC-02 / FR-01）
- [ ] 各ルールに `id`（一意・namespace 付き `supabase-rls.<name>`）/ `message` / `severity`（`ERROR`/`WARNING`/`INFO` のいずれか）/ `languages`（TS/JS）/ いずれかの pattern operator が揃っている。検出困難な (c) の `severity` は `ERROR` を避けている（AC-01 / AC-02 / FR-01 / SEC-01 / INV-03）
- [ ] Semgrep 公式 rule syntax（pattern operator / `severity` 有効値 `ERROR`/`WARNING`/`INFO` / `languages` 綴り）を公式ドキュメントで照合し、**確認日を実行ログ / レビューに記録**している。照合した構文を YAML コメントに残している（PRE-02 / ASM-01 / リスク1 / src-rules.md AI Output Verification）
- [ ] 各ルールに YAML コメントで (i) 検出意図、(ii)「例（出発点）であり網羅ではない」旨、(iii) `nosemgrep: <id>` 抑制方法、(iv) `paths:`/`pattern-not` チューニング前提が併記されている（AC-03 / FR-03 / SEC-01 / リスク5）
- [ ] ルール YAML に `service_role` を使う経路の推奨・実値・実在 secret / 本番 URL / 本番 email が無い。env 名（`SUPABASE_SERVICE_ROLE_KEY` 等）は名前のみで値を書いていない。例示は非機密プレースホルダ（`app_items` / `127.0.0.1` / `.test`）（SEC-02 / SEC-03 / INV-04 / 異常系4）
- [ ] `tests/cli/supabase-semgrep-rules.test.mjs` を新規作成し、YAML schema 妥当性（`ruby -ryaml` パース + ruby 不在 SKIPPED + grep 代替 + `severity` 値集合検証 = AC-01）・ルール meta 健全性（件数 3・id 一意・languages TS/JS = AC-02）・誤検知配慮コメント（AC-03）の検証ケースがある。各テストケース名は日本語 + AC-N 参照
- [ ] ruby 不在時の grep 代替が、`ruby -ryaml` パス時と同一の AC-01 結論に到達する設計である（`/^\s*rules:/m` + 各必須キートークン + pattern operator トークン + `severity` 値が有効集合内。実装リスク7）
- [ ] `node --test tests/cli/supabase-semgrep-rules.test.mjs` が全件パスし、かつ `node --test tests/cli/*.test.mjs` が全件パスして既存テストが無修正で pass する（AC-01 / AC-02 / AC-03 / NFR-01）
- [ ] `src/cli/` / `package.scripts.fragment.json` / `profile-scripts.mjs` / `package-templates/ci-examples/` の diff がゼロである（INV-01 / INV-06 / SPEC-0051 / SPEC-0062）
- [ ] `git diff --check` が pass する（trailing whitespace / 行末改行の混入なし — src-rules.md Intentional changes only）
- [ ] commit message に TASK-0230 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0064-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
