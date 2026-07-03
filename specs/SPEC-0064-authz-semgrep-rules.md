# SPEC-0064: supabase-rls addon に authz / RLS 無視の典型失敗を検出する Semgrep ルール例を同梱

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0064 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0051（`security:sast` = `semgrep scan --config auto` を確立し `ai:check:secure` の 4-step chain を固定。「organization-specific Semgrep rules」を明示スコープ外化 — 本 SPEC で解禁する #12 相当）、SPEC-0062（Semgrep SARIF opt-in を解禁したが「Semgrep ルールセット自体の同梱（organization-specific rules / カスタム `.semgrep.yml` の配布）」を別 SPEC（#12）へ明示的に deferred。本 SPEC がその継続。SARIF は `--config auto` 出力のみで、カスタムルールは本 SPEC が扱う）、SPEC-0063（supabase-rls addon の RLS テストテンプレをパラメータ化 — 本 SPEC の Semgrep ルールが検出対象とするアンチパターンの「正しい形」= テンプレが体現する anon key + user session 経路・`service_role` 非使用の裏付け。テンプレは manual-copy 配布物であり本 SPEC のルール YAML も同一の manual-copy 境界に置く） |
| 権限レベル | platform |

## 背景・目的

`supabase-rls` addon は RLS correctness の**検証テンプレ**（pgTAP / integration / E2E）を配布するが、「そもそも authz / RLS / レート制限を無視した実装が書かれてしまう」という**典型的な失敗そのものを静的に検出する手段**は同梱していない。利用者の `ai:check:secure` が呼ぶ `security:sast` は `semgrep scan --config auto`（レジストリの auto ルールのみ）であり、Supabase の RLS バイパスや service_role 誤用のような**ドメイン固有のアンチパターン**は auto ルールでは十分に拾えない。事前調査（2026-07-03、`package-templates/` と `src/cli/` 現行実装、Semgrep 公式 rule syntax）で確認した現状は次のとおり:

- **カスタム Semgrep ルールは repo 全体に 1 つも存在しない**。`grep -rln "pattern-either|pattern-inside|metavariable-pattern" package-templates/ templates/` はヒット 0 件。`.semgrep.yml` / `.semgrep/` も無い。カスタムルールの置き場は**新設**する必要がある
- **`security:sast` は `semgrep scan --config auto` で固定**。`package-templates/package.scripts.fragment.json` L9 と `src/cli/profile-scripts.mjs` L62（`COMMON_SECURITY_SUPPORT_SCRIPTS`）の両方に `"security:sast": "semgrep scan --config auto"` がある。SPEC-0051 FR-02 / INV-01 が「`security:sast` は Semgrep entrypoint（`--config auto`）を維持する」と固定しており、既定 gate へのカスタムルールの**強制組み込みは契約違反**になる。したがってカスタムルールは `--config <path>` の**追加**として opt-in で提供するしかない
- **SPEC-0062 が「Semgrep ルールセット自体の同梱」を別 SPEC（#12）へ明示 deferred**（SPEC-0062 スコープ外節）。SPEC-0062 は `--config auto` での SARIF 出力のみを解禁し、カスタムルール配布は本 SPEC の担当と定義済み。本 SPEC は SARIF 統合（CI 経路）には踏み込まず、ルール YAML の同梱と opt-in 適用手順に限定する
- **supabase-rls addon の配布物は manual-copy 中心**。`package-templates/supabase/`（テンプレ 3 種）と `package-templates/profiles/supabase-rls/README.md` は CLI（`init`/`update`/`doctor`）が管理しない manual-copy 配布物（SPEC-0063 で確認済み）。ルール YAML も同一境界に置き、CLI managed file にはしない
- **検出対象アンチパターンの「正しい形」は既存テンプレが体現している**。`package-templates/supabase/tests/rls/rls.integration.test.ts` は anon key + user session（`createClient(url, anonKey, { global: { headers: { Authorization: Bearer ... } } })`）で検証し、`service_role` を使わない（「service-role bypass warning」コメント + `service_role` 文字列不在）。ルールはこの逆（= service_role でクライアントを作りユーザー経路で使う疑い等）を検出する
- **既存の triage 資産がある**。`package-templates/prompts/security-scan.md` は Semgrep 出力の triage プロンプト（fix now / false positive / suppress with owner and expiration / accept risk with explicit business justification / needs human security review の 5 分類）を既に持つ。本 SPEC のルールが誤検知しうる前提で、この triage プロンプトと `nosemgrep` 抑制を案内経路として接続する
- **テスト基盤は Node 標準 + 静的検証**。`package.json` は runtime / dev dependencies ゼロ。`test` = `node --test tests/cli/*.test.mjs`。テンプレ内容の静的検証は `tests/cli/supabase-rls-template.test.mjs`（`fs.readFileSync` + `assert.match` の grep 形）が先例。YAML パースは `tests/cli/ci-workflows.test.mjs` が `ruby -ryaml` を `spawnSync` で使い、**ruby 不在環境は SKIPPED 扱い**にして他の静的検証を継続する先例がある（npm への YAML パーサ追加はしない）

本 SPEC は「**RLS / authz / レート制限を無視した典型失敗を検出する Semgrep ルール例を、既定 gate を変えずに opt-in で追加できる形で addon に同梱する**」レイヤを追加する。事前調査に基づき、次の 1 案に確定する:

> **案A: ルール YAML を `package-templates/supabase/semgrep/authz-rules.yml` に「例（出発点）」として同梱し、`security:sast`（`--config auto`）は変えず、利用者が `--config ./supabase/semgrep/authz-rules.yml` を**追加**する手順を README / prompt に記載する。**
> - ルール YAML は Semgrep 公式 rule schema に準拠（`rules:` トップレベル、各ルールに `id` / `message` / `severity` / `languages` / いずれかの pattern operator）。誤検知を避け保守的に、明確なアンチパターンに限定する。各ルールに検出意図・「これは出発点」の但し書き・`nosemgrep` 抑制方法をコメントで併記する
> - **ルール例（3 件、TS/JS 対象。各 opt-in・例示目的）**:
>   1. **service_role 誤用（RLS バイパス疑い）**: Supabase client を service_role key（`SUPABASE_SERVICE_ROLE_KEY` 等の env、または `service_role` を含む変数）で `createClient(...)` し、ユーザーリクエスト経路で使う疑い。RLS を素通りさせる典型
>   2. **認可チェックを伴わない RLS 前提クエリ疑い**: `.from(...).select()` 等が、所有者フィルタ（`.eq("owner_id"/"user_id", ...)` 等）や auth コンテキストを伴わずに実行される疑い（保守的に、明確なアンチパターンに限定。過剰検出しない）
>   3. **認可 / レート制限ミドルウェアの無い API route / handler 疑い**: TS/Next.js の route handler（`export async function GET/POST(...)` 等）に認可・レート制限のガードが見当たらない疑い。言語非依存の汎用検出は困難なため、**TS/Next.js route の典型形に限定した example**とし「これは出発点であり網羅ではない」と明記する
> - **opt-in の適用方法を明確化**: `security:sast` = `semgrep scan --config auto` は**変えない**（SPEC-0051 FR-02 / INV-01 保存）。利用者は `semgrep scan --config auto --config ./supabase/semgrep/authz-rules.yml` のように `--config` を**追加**して適用する。この手順を `package-templates/supabase/README.md` / `profiles/supabase-rls/README.md` / `prompts/security-scan.md` に記載する
> - **誤検知への配慮**: ルールは「例（出発点）」であり誤検知しうる旨、`nosemgrep`（`// nosemgrep: <rule-id>`）での行単位抑制方法、チューニング前提（利用者が自コードベースに合わせて `paths:` / `pattern-not` で絞る）を YAML コメント + README に明記する。過剰検出で既定 CI（`--config auto` のみ）が壊れることは、既定 gate にルールを組み込まないことで構造的に防ぐ
> - **新規 npm 依存ゼロ**: semgrep は既存の SAST（利用者側）で、本 SPEC はルール YAML を足すだけ。ルール YAML の静的検証も Node 標準 + `ruby -ryaml`（ruby 不在は SKIPPED）で行い、YAML パーサ npm 依存を追加しない
>
> **案A を採る理由**: manual-copy 制約と SPEC-0051 の `security:sast` 保存契約に最も合う。既定 gate に組み込む案B（`security:sast` を `--config auto --config <path>` に変える）は SPEC-0051 FR-02 / INV-01 に反し、かつ auto ルールと異なるチューニング要求の未成熟なカスタムルールで**全利用者の CI を壊すリスク**を負う。opt-in で例として配れば、利用者が triage（`security-scan.md`）とチューニング（`nosemgrep` / `paths:`）を経て自 gate に取り込むかを選べる。SPEC-0062 が SARIF を「コメント雛形の opt-in」で解禁したのと同じ「既定を壊さない追加」方針に整合する。

本 SPEC は **静的検証中心**である。ルール YAML は配布物であり、本リポの CI では実 Semgrep スキャンを利用者コードに対して回さない。したがって observable なのは「**ルール YAML ファイルの内容**」と「README / prompt の追記内容」であり、テストは「YAML が Semgrep rule schema として妥当（`rules:` / 各ルールの `id` / pattern operator / `message` / `severity` / `languages` を持つ）」「ルールが meta として健全（id 一意・重複なし・想定件数）」「opt-in 適用手順（`--config` 追加）が README / prompt に存在」「`nosemgrep` 抑制と『例（出発点）』の但し書きが記載」ことの静的検証に限る（AC 参照）。

## 対象ユーザー

- Supabase + RLS を使う CLI 利用者 — `authz-rules.yml` を `--config` に追加して `semgrep scan` を回し、service_role 誤用・認可なし RLS クエリ・ガードなし route の疑いを早期に検出できる。ルールは出発点で、triage（`security-scan.md`）と `nosemgrep` でチューニングして使う
- 既定の `security:sast` のみで運用したい利用者 — ルールは opt-in であり、`--config` を追加しなければ観測可能な挙動は現行どおり（`--config auto` のみ）。既定 gate は変わらない（影響ゼロ）
- security を重視する利用者 — ルール例を出発点に自組織固有ルール（`organization-specific Semgrep rules`）へ育て、`paths:` / `pattern-not` で誤検知を絞り込める
- Review Agent / CI — 「ルール YAML の schema 妥当性」「ルール件数・id 一意」「opt-in 適用手順の存在」「例（出発点）・`nosemgrep` の明記」がテスト（静的検証）で固定される

## スコープ（含む）

- **Semgrep ルール YAML の同梱**: `package-templates/supabase/semgrep/authz-rules.yml`（**新規**）に、authz / RLS / レート制限無視の典型失敗を検出する 3 ルール例を Semgrep 公式 rule schema で記述する。各ルールは (a) service_role 誤用（RLS バイパス疑い）、(b) 認可チェックを伴わない RLS 前提クエリ疑い、(c) 認可 / レート制限ミドルウェアの無い TS/Next.js route handler 疑い。`languages` は TS/JS（`[typescript, javascript]` 等）。誤検知を避け保守的に、明確なアンチパターンに限定する
- **各ルールへのコメント併記**: YAML コメントで (i) 検出意図、(ii) 「これは出発点であり網羅ではない」旨、(iii) `nosemgrep`（`// nosemgrep: <rule-id>`）での抑制方法、(iv) `paths:` / `pattern-not` でのチューニング前提を明記する
- **opt-in 適用手順の記載**（既定 `security:sast` を変えない）: `package-templates/supabase/README.md` に「Semgrep ルール例」節を追加し、`semgrep scan --config auto --config ./supabase/semgrep/authz-rules.yml` のように `--config` を**追加**して適用する手順、ルールが「例（出発点）」で誤検知しうる旨、`nosemgrep` 抑制方法、`security-scan.md` triage への導線を記載する
- **profile / prompt への導線追記**: `package-templates/profiles/supabase-rls/README.md` に、addon が Semgrep ルール例を同梱すること + opt-in 適用の要約を追記する。`package-templates/prompts/security-scan.md` の「When To Use」または該当節に、`authz-rules.yml` を追加適用した Semgrep 出力も triage 対象である旨（+ ルールが出発点で誤検知しうる前提）を追記する
- **テスト追加**: ルール YAML の schema 妥当性（`rules:` トップレベル存在 + 各ルールに `id` / `message` / `severity` / `languages` / いずれかの pattern operator が揃う。ruby 不在は SKIPPED で他検証継続）、ルール meta の健全性（ルール件数 3 + id が一意・重複なし + `languages` が TS/JS）、opt-in 適用手順の存在（README に `--config` 追加手順と `authz-rules.yml` パスの記載）、誤検知配慮の記載（「例 / 出発点」の但し書き + `nosemgrep` 抑制方法）を静的検証する

## スコープ外（明示的に除外）

- **既定 security gate へのカスタムルールの強制組み込み** — `security:sast` = `semgrep scan --config auto`（SPEC-0051 FR-02 / INV-01）を**変えない**。カスタムルールは opt-in（`--config` 追加）に留める。`package.scripts.fragment.json` / `src/cli/profile-scripts.mjs` は変更しない
- **Supabase 以外の authz パターンの検出** — 対象外。ルールは Supabase / RLS 文脈の典型失敗に閉じる（他 ORM / 他 DB / 汎用 authz フレームワークは扱わない）
- **レート制限の汎用検出** — ルール (c) は TS/Next.js route の**例示**に限定し、言語非依存・フレームワーク非依存のレート制限検出は行わない（「これは出発点」と明記する）
- **ルールの網羅性 / 完全性** — 例示が目的であり、authz / RLS の全アンチパターンを網羅しない。3 ルールは出発点で、利用者が育てる前提
- **SARIF 統合 / CI 経路** — SPEC-0062 の範囲。本 SPEC は SARIF 出力・GitHub Code Scanning upload・CI ワークフローへのルール組み込みに踏み込まない（`package-templates/ci-examples/` は変更しない）
- **Semgrep の自動 install** — 対象外（SPEC-0051 スコープ外「scanner dependencies の自動 install」の継続）。ルールは semgrep が利用者環境にある前提の例示
- **ルールを CLI managed file にする**（`init`/`update`/`doctor` がルール YAML を配布・管理する）— 別 SPEC。本 SPEC は manual-copy のまま同梱し、`src/cli/` は一切変更しない
- **新規 npm 依存の追加**（YAML パーサ・semgrep の devDependency 化・rule linter 等）— ゼロ。schema 検証は Node 標準 + `ruby -ryaml`（ruby 不在は SKIPPED）で行う
- **`prompts/rls-permission.md` の変更** — 本 SPEC は権限マトリクス生成には触れない。触れる docs は `supabase/README.md` / `profiles/supabase-rls/README.md` / `prompts/security-scan.md` の 3 点に限る

## 要件

### 機能要件

- [FR-01] ルール YAML の同梱: `package-templates/supabase/semgrep/authz-rules.yml`（新規）に Semgrep 公式 rule schema 準拠の 3 ルール例を置く。トップレベルは `rules:`（リスト）。各ルールは `id`（一意）・`message`・`severity`・`languages`（TS/JS）・いずれかの pattern operator（`pattern` / `patterns` / `pattern-either` / `pattern-regex`）を持つ。3 ルールは (a) service_role 誤用（RLS バイパス疑い）、(b) 認可チェックを伴わない RLS 前提クエリ疑い、(c) 認可 / レート制限ミドルウェアの無い TS/Next.js route handler 疑い
- [FR-02] pattern の有効性（保守的な検出）: 各ルールの pattern は実際に有効な Semgrep 構文であり、明確なアンチパターンに限定して誤検知を避ける（例: (a) は `createClient(..., $KEY, ...)` で `$KEY` が service_role 由来である疑いを `metavariable-pattern` / `pattern-regex` 等で絞る。(b) は `.from(...).select(...)` に所有者フィルタ / auth が付かない形を `pattern` + `pattern-not` で絞る。(c) は route handler の export 形に `pattern-inside` 等を使う）。pattern は Semgrep 公式 rule syntax に照合してから確定する（AI Output Verification）
- [FR-03] 各ルールへのコメント併記: YAML コメントで各ルールに (i) 検出意図、(ii)「例（出発点）であり網羅ではない」旨、(iii) `nosemgrep`（`// nosemgrep: <rule-id>`）による行単位抑制方法、(iv) `paths:` / `pattern-not` によるチューニング前提を記載する。ルール `id` は `nosemgrep: <id>` で参照できる命名（例: `supabase-rls.service-role-client-misuse` 等の namespace 付き）にする
- [FR-04] opt-in 適用手順の記載（既定 `security:sast` 不変）: `package-templates/supabase/README.md` に「Semgrep ルール例」節を追加し、(1)`security:sast` = `semgrep scan --config auto` は変わらないこと、(2) 適用は `semgrep scan --config auto --config ./supabase/semgrep/authz-rules.yml` のように `--config` を**追加**すること、(3) ルールは「例（出発点）」で誤検知しうること、(4)`nosemgrep: <rule-id>` での抑制、(5)`prompts/security-scan.md` での triage への導線、を記載する。`service_role` 非使用の既存注意書きと整合させる
- [FR-05] profile / prompt への導線追記: `package-templates/profiles/supabase-rls/README.md` に「addon が `supabase/semgrep/authz-rules.yml` を同梱し、`--config` 追加で opt-in 適用する」旨と要約を追記する。`package-templates/prompts/security-scan.md` に、`authz-rules.yml` を追加適用した Semgrep 出力も本 triage プロンプトの対象であり、ルールは出発点で誤検知しうる前提で triage する旨を追記する（既存 triage 本文の分類ロジックは変えない）
- [FR-06] 既定挙動の非変更（opt-in の完全性）: `--config` を追加しない利用者の観測可能な挙動（`security:sast` = `semgrep scan --config auto`、`ai:check:secure` の 4-step chain）は本 SPEC 適用前と同一である。ルール YAML の追加は `package-templates/supabase/semgrep/` の新規ファイルと 3 docs の追記に閉じ、`src/cli/` / `package.scripts.fragment.json` を変えない

### 非機能要件

- [NFR-01] 観測面の明示（静的検証中心）: 本 SPEC の observable は「ルール YAML ファイルの内容」と「README / prompt の追記内容」である。本リポ CI では実 Semgrep スキャンを利用者コードに対して回さないため、テストは (a) YAML の schema 妥当性（`rules:` 存在 + 各ルールの必須キー。パースは `ruby -ryaml` で行い、ruby 不在は SKIPPED として grep ベースの静的検証で代替継続）、(b) ルール meta の健全性（件数 3・id 一意・`languages` TS/JS）、(c) opt-in 適用手順の存在（README の `--config` 追加手順 + `authz-rules.yml` パス）、(d) 誤検知配慮の記載（「例 / 出発点」+ `nosemgrep`）に限る。**実際に Semgrep がアンチパターンを検出する / 誤検知しない挙動の検証はスコープ外**（利用者コード依存 + semgrep バイナリ依存）。一般的なコードカバレッジ閾値は本 SPEC の観測面に適さないため適用対象外とし、網羅性は AC-01〜AC-05 の個別テストケース充足で担保する
- [NFR-02] 新規 npm 依存ゼロ: ルール同梱・検証は既存前提（semgrep は利用者側 SAST、`ruby -ryaml` は既存 `ci-workflows.test.mjs` の先例、`node:` 標準）のみで行い、YAML パーサ / rule linter / semgrep の devDependency を新規導入しない。`package.json` の runtime / dev dependencies を変えない（検証: `tests/cli/package.test.mjs` の dependencies 検査）
- [NFR-03] 最小変更・既定 gate 不干渉: 変更はルール YAML の新規追加 + 3 docs の追記に限定し、`security:sast`（`--config auto`）・`ai:check:secure` chain・profile scripts・CI テンプレを変えない。ルールを既定 gate に組み込まないことで、未成熟なカスタムルールが全利用者の CI を壊す経路を構造的に作らない
- [NFR-04] 新規追加要素は各々テストで固定: ルール YAML の schema 妥当性・ルール meta（件数・id 一意・languages）・opt-in 適用手順の存在・誤検知配慮の記載を各 1 ケース以上で固定する。ruby 不在で YAML パースが SKIPPED になる場合も grep ベースの静的検証（`rules:` / `id:` / `pattern` 系トークンの存在）は継続する。網羅はテストケース列挙で担保し、カバレッジツールは導入しない（NFR-01 の観測面方針に整合）

### セキュリティ要件

- [SEC-01] ルール pattern の健全性（誤検知で CI を壊さない）: ルールは既定 gate に組み込まず opt-in（`--config` 追加）に留めることで、過剰検出が全利用者の `security:sast`（`--config auto` のみ）を壊さないことを構造的に保証する。ルール pattern は明確なアンチパターンに限定し、`pattern-not` / `paths:` でのチューニング前提と `nosemgrep` 抑制を明記する（FR-03）。ルールの `severity` は誤検知前提で保守的に設定し（Semgrep OSS の有効値 `ERROR` / `WARNING` / `INFO` から選び、検出困難な (c) は `ERROR` を避け `WARNING` / `INFO` を選ぶ）、「例（出発点）」であることを YAML コメント + README に明記する
- [SEC-02] service_role 非使用の維持: ルール (a) は「service_role でクライアントを作りユーザー経路で使う」アンチパターンを**検出する側**であり、ルール YAML・README・prompt に `service_role` を使う経路の例示・推奨を混入させない。既存テンプレの anon key + user session 経路（「service-role bypass warning」）と整合し、RLS correctness を素通りさせる例を書かない
- [SEC-03] secret 非混入: ルール YAML・README・prompt 追記に、実在の secret / token / service_role key の実値 / 本番 URL / 本番 email を例示として書かない。ルール pattern が参照する env 名（`SUPABASE_SERVICE_ROLE_KEY` 等）は**名前のみ**で、値は書かない。例示コードは非機密のプレースホルダ（`app_items` / `127.0.0.1` / `.test` 系）を維持する

### 運用要件

- [OPS-01] 誤検知事例の段階観測: v1 リリース後 1 リリースサイクル、`authz-rules.yml` の「明確なアンチパターンでないコードを誤検出した」「利用者が `nosemgrep` / `paths:` で抑制せざるを得なかった」事例を観測する。該当事例が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'semgrep: authz ルール誤検知' sage/failures.md` で機械的に件数確認する。原因タグ『semgrep: authz ルール誤検知』は固定文字列とし表記ゆれを禁止する。failures.md 記録時は既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）のうち該当値と併記し、症状欄冒頭に検索用補助タグ『semgrep: authz ルール誤検知』を付す。原因タグは cause enum を置き換えず補助的に追加する）、ルールの `pattern-not` / `paths:` 追加による絞り込みまたはルール除去を別 SPEC で起票する
- [OPS-02] ルール昇格 / 既定組み込み需要の観測: ルール例が dogfooding / 利用者要望で「既定 gate に組み込むほど誤検知が少なく有用」と実証されたら、別 SPEC で `security:sast` への opt-in 組み込み手段（例: `.ai-check.yaml` 経由の追加 config / profile オプション）を additive に検討する。判定は roadmap 見直し時に issue / feedback を確認して行う（本 SPEC の opt-in 提供は、将来の既定組み込みへの移行余地を塞がない — 契約節参照）

## File Scope

| 区分 | ファイル |
|---|---|
| 新規（ルール YAML） | `package-templates/supabase/semgrep/authz-rules.yml`（3 ルール例 + コメント併記） |
| 変更（ドキュメント） | `package-templates/supabase/README.md`（「Semgrep ルール例」節追加 = opt-in 適用手順 / 誤検知配慮 / `nosemgrep` / triage 導線）, `package-templates/profiles/supabase-rls/README.md`（ルール同梱 + opt-in 要約の追記）, `package-templates/prompts/security-scan.md`（`authz-rules.yml` 追加適用出力の triage 対象化 + 出発点前提の追記） |
| 新規（テスト） | `tests/cli/supabase-semgrep-rules.test.mjs`（**新規**。YAML schema 妥当性 + ルール meta 健全性 + opt-in 適用手順の存在 + 誤検知配慮の記載を静的検証）。**配置先を `tests/cli/` に確定する理由**: 現行 `package.json` の `test` / `test:cli` は `node --test tests/cli/*.test.mjs` であり `tests/cli/` 配下のみを実行対象とするため、ここに置けば package.json 変更なしで既存 test に組み込まれる（`tests/templates/` 等に置くと glob 非対象で CI 未実行になる） |

上記以外への変更は本 SPEC のスコープ外。特に **`src/cli/` 配下（`profile-scripts.mjs` / `managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` 等 — ルール YAML を manual-copy のまま保つ。CLI 管理化はスコープ外）**、`package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` を変えない — SPEC-0051 FR-02 / INV-01 保存）、`package-templates/ci-examples/`（SARIF / CI 経路は SPEC-0062 の範囲）、`package-templates/prompts/rls-permission.md`、`docs/cli.md`（CLI surface を変えないため追記不要）、`package-templates/supabase/tests/` 配下のテンプレ 3 種（SPEC-0063 で確定済み。本 SPEC は変えない）は**変更しない**。テストは `tests/cli/supabase-semgrep-rules.test.mjs` に新規作成する（`tests/cli/` 配下のため既存 test glob に自動で含まれ、`package.json` の scripts 変更は不要 = File Scope 外を触らない）。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `package-templates/supabase/semgrep/authz-rules.yml` が存在し、Semgrep rule schema として妥当である — トップレベルに `rules:`（リスト）を持ち、各ルールが `id` / `message` / `severity` / `languages` / いずれかの pattern operator（`pattern` / `patterns` / `pattern-either` / `pattern-regex`）を持つ。パースは `ruby -ryaml` で行い（`ci-workflows.test.mjs` 先例）、各ルールに 5 必須要素が揃うことを検証する。**ruby 不在環境では YAML パースを SKIPPED とし、grep ベースで `rules:` / 各ルールの `id:` / `message:` / `severity:` / `languages:` / pattern operator トークンの存在を代替検証する**。加えて各ルールの `severity` 値が Semgrep OSS 有効値集合 `{ERROR, WARNING, INFO}` のいずれかであることを検証する（無効値 `HIGH`/`CRITICAL` 等を弾く）（FR-01 / NFR-01）【種別: unit】
- [ ] AC-02: ルール meta が健全 — ルールが 3 件存在し、`id` が一意（重複なし）で `nosemgrep: <id>` 参照可能な命名（namespace 付き）である。各ルールの `languages` が TS/JS（`typescript` / `javascript` / `ts` / `js` のいずれか)を含む。3 ルールがそれぞれ (a) service_role 誤用、(b) 認可なし RLS クエリ、(c) route handler の意図に対応する `id` / `message` を持つ（`grep` / パースで id 集合・languages・件数を検証）（FR-01 / FR-02）【種別: unit】
- [ ] AC-03: 各ルールに誤検知配慮のコメントが併記されている — YAML コメントに「例 / 出発点（starting point / example / not exhaustive 相当）」の但し書き、`nosemgrep`（`// nosemgrep:` または `nosemgrep: <rule-id>`）による抑制方法、`paths:` / `pattern-not` によるチューニング前提が記載されている（`grep` で該当キーワード + `nosemgrep` の存在を検証）（FR-03 / SEC-01）【種別: unit + docs】
- [ ] AC-04: `package-templates/supabase/README.md` に opt-in 適用手順が記載されている — (1)`security:sast` = `semgrep scan --config auto` が変わらないこと、(2)`--config ./supabase/semgrep/authz-rules.yml` を**追加**する適用コマンド例、(3) ルールが「例（出発点）」で誤検知しうる旨、(4)`nosemgrep: <rule-id>` 抑制、(5)`prompts/security-scan.md` triage への導線、が含まれる（`grep` で `--config`・`authz-rules.yml`・`config auto`・`nosemgrep`・`security-scan` の共存を検証し、`service_role` 非使用注意書きと整合していることをレビュー確認 = FR-04 / SEC-02）【種別: docs】
- [ ] AC-05: `profiles/supabase-rls/README.md` と `prompts/security-scan.md` に導線が追記されている — profile README に `authz-rules.yml` の同梱 + opt-in（`--config` 追加）要約が、security-scan prompt に「`authz-rules.yml` を追加適用した出力も triage 対象であり、ルールは出発点で誤検知しうる前提」の記載が存在する（`grep` で `authz-rules.yml` / `--config` / triage 該当キーワードを検証し、`security-scan.md` の既存 triage 分類ロジック（fix now / false positive / suppress with owner and expiration / accept risk with explicit business justification / needs human security review の 5 分類）が無変更であることをレビュー確認 = FR-05）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit | Gate 2: Functional |
| AC-02 | unit | Gate 2: Functional |
| AC-03 | unit + docs | Gate 2: Functional（+ Gate 3: Security の誤検知配慮観点） |
| AC-04 | docs | Gate 1: Structural（+ Gate 3: Security の `security:sast` 不変 / service_role 非使用観点） |
| AC-05 | docs | Gate 1: Structural |

AC-01〜AC-03 のテストは `tests/cli/supabase-semgrep-rules.test.mjs` に置かれ、現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs` の実行対象に自動で含まれるため、CI 上は追加の workflow 設定なし・package.json 変更なしで必須チェック化される。AC-04 / AC-05 は docs の静的検証（grep + レビュー）で、preflight（`npm pack` 内容検査等）を壊さないことを含めて確認する。

## 異常系

- 想定エラー1（ルール YAML の構文誤り）: 実装中にルール YAML の構文を壊した場合（必須キー欠落 / インデント誤り / pattern operator 不在）→ AC-01 の YAML パース（`ruby -ryaml`）または grep ベースの必須トークン検証が fail する。ruby 不在環境でも grep 検証（`rules:` / `id:` / pattern operator の存在）で必須要素欠落を検出する（silent に schema 不正な YAML を配布しない。検証条件は AC-01 を一次情報源とする）
- 想定エラー2（ルールの誤検知）: 利用者が `authz-rules.yml` を適用し、明確なアンチパターンでないコードを誤検出された場合 → ルールは opt-in（`--config` 追加）で既定 gate を壊さず、利用者は `nosemgrep: <rule-id>`（行単位）または `paths:` / `pattern-not`（ルール調整）で抑制できる。この抑制手段を YAML コメント + README（AC-03 / AC-04）に明記し、triage（`security-scan.md`）で false positive / suppress with owner+expiration の分類経路に載せる（検証条件は AC-03 / AC-04 を一次情報源とする）
- 想定エラー3（既定 gate へのカスタムルール混入）: 実装中に `security:sast` を `--config auto --config <path>` に変えてしまった場合 → SPEC-0051 FR-02 / INV-01 に反し、`package.scripts.fragment.json` / `src/cli/profile-scripts.mjs` の無変更確認（Forbidden Shortcuts の検出）で fail する。ルールは opt-in に留め既定 gate を変えない（検証条件は AC-04 の `config auto` 不変記載 + File Scope 外変更検出を一次情報源とする）
- 想定エラー4（service_role 例示の混入）: ルール (a) の記述過程で `service_role` を使う正しい例 / 推奨を混入させた場合 → SEC-02 に反する。ルールは service_role 誤用を**検出する側**であり、YAML / README / prompt に service_role 使用の推奨・実値を書かない。既存テンプレの anon key + user session 経路との整合を AC-04 のレビューで確認する（検証条件は AC-04 を一次情報源とする）
- 境界ケース1（TS/JS 以外のコードベース）: 利用者のコードが Python / Go 等で TS/JS でない場合 → ルールの `languages` は TS/JS のため対象外となり Semgrep は当該ルールを適用しない（誤って他言語に適用されない）。ルールが TS/JS example に限定される旨を README に明記する（検証条件は AC-02 の languages 検証を一次情報源とする）
- 境界ケース2（semgrep バイナリ不在）: 利用者環境に semgrep が無い場合 → `--config` 追加の適用コマンドは semgrep 前提であり、semgrep が無ければ既定の `security:sast`（`semgrep scan --config auto`）自体も動かない（本 SPEC の新規問題ではなく SPEC-0051 スコープ外「scanner の自動 install」の既知前提）。README は semgrep が利用者環境にある前提の例示であることを示す（検証条件は AC-04 を一次情報源とする）

## 契約

- API: (1) **ルール YAML（配布物）**: `package-templates/supabase/semgrep/authz-rules.yml` に Semgrep rule schema 準拠の 3 ルール例。トップレベル `rules:`、各ルールに `id`（一意・namespace 付き）/ `message` / `severity` / `languages`（TS/JS）/ pattern operator。ルールは「例（出発点）」で、`nosemgrep` / `paths:` / `pattern-not` でチューニングする前提。 (2) **opt-in 適用**: 既定 `security:sast` = `semgrep scan --config auto`（SPEC-0051 FR-02 / INV-01）は不変で、適用は `--config ./supabase/semgrep/authz-rules.yml` の**追加**。既定 gate に組み込まない（`--config` を追加しない利用者の挙動は現行と同一）。 (3) **manual-copy 境界**: ルール YAML は CLI 管理外の manual-copy 配布物であり、`init`/`update`/`doctor` の managed file 経路（SPEC-0056 3-way）の対象外。 (4) **将来拡張（既定組み込み）**: opt-in 提供は、将来ルールが実証された時点での `security:sast` への追加組み込み手段（別 SPEC）へ additive に移行可能で、本 SPEC はそれを排他しない（OPS-02）。 (5) **triage 導線**: `prompts/security-scan.md` の既存 triage 分類ロジック（fix now / false positive / suppress with owner and expiration / accept risk with explicit business justification / needs human security review の 5 分類）は不変で、`authz-rules.yml` 出力を対象に含める追記のみ。 (6) **SARIF / CI 不変**: `package-templates/ci-examples/`・SARIF 経路（SPEC-0062）は不変。
- DB: なし（ルール YAML は配布物であり、本リポは実 Semgrep スキャンを利用者コードに対して回さない）
- イベント: なし

## リスク

- リスク1: Semgrep の rule syntax（pattern operator / `metavariable-pattern` / `severity` の値 / `languages` の綴り）が利用者の semgrep バージョンで期待どおり動かない、または pattern が幻覚で無効構文になる → 軽減策: pattern は Semgrep 公式 rule syntax（`rules:` トップレベル / `id`・`message`・`severity`・`languages`・pattern operator の必須性 / `severity` は Semgrep OSS rule schema の有効値 `ERROR` / `WARNING` / `INFO`（版により `INVENTORY` / `EXPERIMENT`）。`LOW`/`MEDIUM`/`HIGH`/`CRITICAL` は AppSec Platform 用の表示分類でありコミュニティ rule の `severity:` には使えない（実装時に公式 rule-syntax ドキュメントで確認日を記録する） / `languages` は `typescript`/`javascript`/`ts`/`js`）に照合してから確定する（src-rules.md AI Output Verification）。ルールは opt-in で、利用者が自由に編集・除去できる。schema 妥当性は AC-01 で `ruby -ryaml` パース（+ grep 代替）により固定する
- リスク2: ルールが過剰検出し、利用者の `--config` 追加適用で大量の誤検知が出て導入が萎える → 軽減策: 明確なアンチパターンに限定し（FR-02）、`pattern-not` / `paths:` でのチューニング前提と `nosemgrep` 抑制を明記（FR-03 / AC-03）。既定 gate に組み込まないため全利用者の CI は壊れない（SEC-01）。誤検知事例は OPS-01 で観測し、閾値超過でルール絞り込み / 除去を別 SPEC 化する
- リスク3: 実装者が便利さから `security:sast` を `--config auto --config <path>` に変えて既定に組み込む → 軽減策: SPEC-0051 FR-02 / INV-01 保存を Forbidden Shortcuts + AC-04（`config auto` 不変記載）+ File Scope 外変更検出（`templates/hooks/check-file-scope.sh`）で機械ガードする。`package.scripts.fragment.json` / `profile-scripts.mjs` に触れたら設計ミスとして立ち止まる
- リスク4: ルール (a) の記述で `service_role` を使う「正しい例」を混入させ、検出したいアンチパターンを推奨してしまう → 軽減策: ルールは service_role 誤用を検出する側で、YAML / docs に service_role 使用の推奨・実値を書かない（SEC-02）。既存テンプレの anon key + user session 経路との整合を AC-04 レビューで確認する
- リスク5: ルール YAML が「網羅的な authz チェック」と誤解され、利用者がこれだけで安全と思い込む → 軽減策: 「例（出発点）であり網羅ではない」を YAML コメント + README（FR-03 / FR-04 / AC-03）に明記する。RLS correctness の主担当はテンプレ（pgTAP / integration）であり Semgrep は補助、という SPEC-0051 / SPEC-0063 の責務分界を README で示す
- リスク6: 機構を撤去する必要が生じた場合 → 軽減策: 変更はルール YAML + docs に閉じ（`src/cli/` / 既定 gate 不変）、ルール YAML を除去し docs の該当節を戻せば現行に戻る。opt-in ゆえ `--config` を追加していない利用者への影響はゼロ

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: authz / RLS 向け Semgrep ルール例の同梱は配布物（`package-templates/supabase/`）の内容追加であり、本リポの開発運用ルールに影響しない。配布物の一次情報源は `package-templates/supabase/README.md` / `profiles/supabase-rls/README.md` / `package-templates/.claude/README.md` で、CLAUDE.md / `ai-check-template.md` は既に参照型（配布物の fixed-list を持たない）ため追記不要。CLI surface は不変なので `docs/cli.md` も対象外）
- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。OPS-01 の原因タグ『semgrep: authz ルール誤検知』を該当時に付す
- 「`security:sast` = `semgrep scan --config auto` を既定として保存し、カスタムルールは opt-in（`--config` 追加）で提供する」は SPEC-0051（FR-02 / INV-01）・SPEC-0062（SARIF を opt-in コメント雛形で解禁）で確立した「既定を壊さない追加」パターンの継続であり、新規パターンではない。破ると未成熟なカスタムルールが全利用者の CI を壊すため、Forbidden Shortcuts / AC-04 で既定 gate 不変をガードする
- 「manual-copy 配布物は SPEC-0056 の 3-way managed file 経路の対象外」は SPEC-0063 で確認済みの既知境界。ルール YAML も同一境界に置き、CLI 管理化しない（`src/cli/` 不変）
- 「Semgrep pattern は幻覚で無効構文になりうる」は AI Output Verification の対象。pattern を公式 rule syntax に照合し、AC-01 の schema 妥当性検証（`ruby -ryaml` パース + grep 代替）でガードする
- テスト期待値は本 SPEC の契約節から導出し、AC-N 参照をテストケース名に付す

**アンチパターン照合の補記**: 想定タスク分割 T1〜T2 は各 File Scope が 10 ファイル未満で AP-02（Big Bang Prompt）の 20 ファイル閾値に抵触しない。commit message への TASK-ID 必須（commit-msg hook）は AP-05（Invisible Development）の防止策と一致する。File Scope 外変更（特に `src/cli/` / `package.scripts.fragment.json` / `ci-examples/`）は `templates/hooks/check-file-scope.sh` で検出される（AP-03）。ルール schema 妥当性を文章ルールでなくテスト（AC-01）でガードするのは AP-06（Human-Only Guard）の回避。

## 実装メモ（Implementation Agent向け）

- **ルール YAML**（`package-templates/supabase/semgrep/authz-rules.yml`）: トップレベル `rules:` の下に 3 ルールを列挙する。各ルールの骨格:
  ```yaml
  rules:
    - id: supabase-rls.service-role-client-misuse
      # 検出意図: service_role key で createClient し RLS を素通りさせる疑い。
      # 例（出発点）であり網羅ではない。誤検知しうる。
      # 抑制: 該当行の直前に `// nosemgrep: supabase-rls.service-role-client-misuse`
      # チューニング: paths: で対象を絞る / pattern-not で正当な使用を除外する
      message: >-
        Supabase client created with a service_role key may bypass RLS ...
      severity: WARNING
      languages: [typescript, javascript]
      patterns:
        - pattern: createClient($URL, $KEY, ...)
        - metavariable-pattern:
            metavariable: $KEY
            patterns:
              - pattern-regex: (?i)service_role|SERVICE_ROLE_KEY
  ```
  ルール (b)（認可なし RLS クエリ）は `.from(...).select(...)` に `.eq("owner_id"/"user_id", ...)` 等の所有者フィルタが**付かない**形を `pattern` + `pattern-not`（フィルタ付き形を除外）で保守的に絞る。ルール (c)（route handler）は `export async function GET/POST(...)` 等の Next.js route 形に `pattern-inside` を使い、認可 / レート制限のガード（middleware 呼び出し等）が見当たらない疑いを保守的に検出する。`severity` は Semgrep OSS 有効値 `ERROR`/`WARNING`/`INFO` から選び、誤検知前提で (c) を `WARNING`/`INFO` に下げる（SEC-01）。**pattern は Semgrep 公式 rule syntax に照合してから確定する**（幻覚防止 — src-rules.md AI Output Verification）
- **id 命名**: `nosemgrep: <id>` で参照するため namespace 付き（`supabase-rls.<name>`）にし、3 件で重複させない。`languages` は TS/JS を含める
- **README「Semgrep ルール例」節**（`supabase/README.md`）: 既存「SQL identifier injection」節や service_role 注意書きの近くに、opt-in 適用（`semgrep scan --config auto --config ./supabase/semgrep/authz-rules.yml`）・「例（出発点）で誤検知しうる」・`nosemgrep: <rule-id>` 抑制・`prompts/security-scan.md` triage 導線を記載する。既定 `security:sast` が変わらないことを明記する。言語は既存 README（英語ベース）に合わせる
- **profile / prompt 追記**: `profiles/supabase-rls/README.md`（日本語）の「Manual-copy templates」節付近に、addon が `supabase/semgrep/authz-rules.yml` を同梱し `--config` 追加で opt-in 適用する旨を追記。`prompts/security-scan.md`（英語）の「When To Use」等に、`authz-rules.yml` 追加適用出力も triage 対象で、ルールは出発点で誤検知しうる前提の旨を追記（既存の Findings / decision 分類ロジックは不変）
- **テスト**（新規 `tests/cli/supabase-semgrep-rules.test.mjs`）: (1) `authz-rules.yml` を読み、`ruby -ryaml` でパースして `rules` がリスト・各ルールに `id`/`message`/`severity`/`languages`/pattern operator が揃うことを assert。**ruby 不在は `ci-workflows.test.mjs` の `hasRuby()` 先例に倣い SKIPPED とし、grep ベース（`/^\s*rules:/m` / `id:` / `message:` / `severity:` / `languages:` / pattern operator トークン）で代替検証**（AC-01）。(2) ルール件数 3・`id` 一意・`languages` TS/JS・3 意図の id/message を検証（AC-02）。(3) YAML コメントの「例 / 出発点」但し書き + `nosemgrep` + `paths:`/`pattern-not` 言及を grep（AC-03）。(4) README / profile / prompt の追記を grep（AC-04 / AC-05）。読み取り + 静的アサートのみで、実 semgrep を回さない（NFR-01 / NFR-02）
- **言語規約**: `authz-rules.yml` のコメントは英語（Semgrep ルールの慣習 + 利用者向け example）、`supabase/README.md`（英語ベース）への追記は英語、`profiles/supabase-rls/README.md`（日本語）への追記は日本語、`prompts/security-scan.md`（英語）への追記は英語、テストケース名は日本語 + AC-N 参照、コード識別子（rule id・env var 名）は英語
- exit code / エラー規約: 本 SPEC は CLI のエラー経路を新設しない（ルール YAML + docs + テストの変更が主）。`src/cli/` を触らないため `CliError` / `process.exit` に関与しない

### 実装ルール

- `security:sast`（`semgrep scan --config auto`）を変更しない（SPEC-0051 FR-02 / INV-01 保存。`package.scripts.fragment.json` / `profile-scripts.mjs` に触れたら設計を疑う）。カスタムルールは opt-in（`--config` 追加）に留める
- `src/cli/` を変更しない（ルール YAML は manual-copy のまま。CLI 管理化はスコープ外。触れたら設計を疑う）
- `package-templates/ci-examples/` / SARIF 経路を変更しない（SPEC-0062 の範囲）
- `package-templates/supabase/tests/` 配下のテンプレ 3 種（SPEC-0063）を変更しない（本 SPEC はルール YAML の追加のみ）
- `prompts/rls-permission.md` を変更しない（本 SPEC は security-scan.md / supabase README / profile README の 3 docs に限る）
- ルール pattern は Semgrep 公式 rule syntax と照合してから確定する（src-rules.md AI Output Verification: 幻覚フラグの混入防止）
- ルール YAML / README / prompt に `service_role` を使う経路の推奨・実値・実在 secret / 本番 URL / 本番 email を書かない（SEC-02 / SEC-03）。env 名は名前のみ、例示は非機密プレースホルダ
- ルールは既定 gate に組み込まず opt-in に留め、明確なアンチパターンに限定して誤検知で CI を壊さない（SEC-01）
- 新規 npm 依存（YAML パーサ・rule linter・semgrep devDependency）を追加しない（NFR-02）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `src/cli/profile-scripts.mjs` L62 `COMMON_SECURITY_SUPPORT_SCRIPTS` の `"security:sast": "semgrep scan --config auto"` → 本 SPEC はここに触れない。触れる必要が出たら「opt-in で追加」の前提が崩れた設計ミスとして立ち止まる（SPEC-0051 FR-02 / INV-01 保存）
- `package-templates/package.scripts.fragment.json` L9 の `security:sast` → 同上。無変更
- `package-templates/prompts/security-scan.md` の既存 triage 本文（Redaction Rules / Findings 表 / decision 分類 / Suppression Policy）→ 追記は「When To Use」等への `authz-rules.yml` 対象化のみで、分類ロジック・出力フォーマットを変えない
- `package-templates/supabase/README.md` の既存 service_role 非使用注意書き（`Do not use service_role ...`）→ 「Semgrep ルール例」節の追加は既存注意書きと整合させ、削除・弱体化しない
- `package-templates/supabase/tests/rls/rls.integration.test.ts` の anon key + user session 経路・「service-role bypass warning」→ ルール (a) が検出したいアンチパターンの「正しい形」の裏付け。テンプレ自体は変えない（本 SPEC のルールがテンプレを誤検出しないことを、ルール pattern の保守性で担保する）
- `tests/cli/ci-workflows.test.mjs` の `hasRuby()` / `rubyLoadYaml()`（`ruby -ryaml` + SKIPPED 先例）→ 新規テストの YAML パース検証はこの先例に倣う（コードは複製でなく同方針の実装。既存テストは変えない）

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: ルール YAML の作成（`package-templates/supabase/semgrep/authz-rules.yml`）+ `tests/cli/supabase-semgrep-rules.test.mjs` の schema / meta / コメント検証ケース（FR-01 / FR-02 / FR-03 / SEC-01 / SEC-03。AC-01 / AC-02 / AC-03）（依存なし）
  - 完了条件: YAML schema 妥当性（`ruby -ryaml` パース + grep 代替）・ルール件数 3・id 一意・languages TS/JS・誤検知配慮コメントのテストがパスし、既存テスト全件が無修正で pass
- T2: ドキュメント更新（`supabase/README.md` の「Semgrep ルール例」節 + `profiles/supabase-rls/README.md` / `prompts/security-scan.md` の導線追記）+ テストの docs 検証ケース追記（FR-04 / FR-05 / FR-06 / SEC-02。AC-04 / AC-05）（依存: T1 — 確定したルール id・ファイルパス・opt-in コマンドを docs 化するため）
  - 完了条件: AC-04 / AC-05 の grep がヒットし、`security:sast` = `--config auto` 不変・service_role 非使用注意書き整合・security-scan.md triage 本文不変をレビュー確認、既存 preflight が壊れない

T1 → T2 は直列（ルール確定 → docs 化）。T1/T2 を 1 タスクに統合しない理由: T1 は Semgrep rule syntax の妥当性（AI Output Verification / Gate 2）、T2 は既定 gate 不変 + service_role 非使用（SPEC-0051 保存 / Gate 3）と検証観点が異なり、独立コミットで観測しやすいため分ける。ただし File Scope が各 10 ファイル未満なので、PLAN 起票時に統合が合理的なら再検討してよい。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- `security:sast`（`semgrep scan --config auto`）の変更・カスタムルールの既定 gate 強制組み込みの禁止 — カスタムルールは opt-in（`--config` 追加）に留める（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 + AC-04 の `config auto` 不変記載 — SPEC-0051 FR-02 / INV-01 保存）
- `src/cli/` の変更の禁止 — ルール YAML は manual-copy のまま（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- 無効な Semgrep 構文（公式 rule syntax 未照合の pattern / 必須キー欠落）のコミットの禁止（検出: AC-01 の YAML schema 妥当性（`ruby -ryaml` パース + grep 代替）+ レビューで公式 rule syntax 参照確認 — src-rules.md AI Output Verification）
- ルール YAML / README / prompt への `service_role` 使用の推奨・実値・実在 secret / 本番 URL / 本番 email の混入の禁止 — env 名は名前のみ、例示は非機密プレースホルダ（検出: AC-04 のレビュー + YAML / README の grep — SEC-02 / SEC-03）
- 過剰検出で既定 CI を壊すルールを既定 gate に入れることの禁止 — opt-in + 明確なアンチパターン限定 + `nosemgrep`/`paths:`/`pattern-not` 明記（検出: AC-03 の誤検知配慮記載 + 既定 gate 不変 — SEC-01）
- 「例（出発点）であり網羅ではない」但し書きの省略の禁止 — ルールを網羅的 authz チェックと誤解させない（検出: AC-03 の但し書き存在検証 — リスク5）
- `package-templates/ci-examples/` / SARIF 経路の変更の禁止（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー — SPEC-0062 の範囲）
- `prompts/rls-permission.md` / `package-templates/supabase/tests/` テンプレ 3 種の変更の禁止（検出: File Scope 外 + レビュー — SPEC-0063 で確定済み）
- 新規 npm 依存（YAML パーサ・rule linter・semgrep devDependency）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 3) `security:sast` は常に `semgrep scan --config auto`（Semgrep entrypoint）であり、本 SPEC のカスタムルールは既定 gate に組み込まれず opt-in（`--config` 追加）でのみ適用される（SPEC-0051 FR-02 / INV-01 の保存）
- [INV-02] (Gate 2) `--config` を追加しない利用者の観測可能な挙動（`security:sast` / `ai:check:secure` の 4-step chain）は、本 SPEC 適用前と常に同一である（opt-in の完全性）
- [INV-03] (Gate 2) `authz-rules.yml` は常に Semgrep rule schema として妥当であり、トップレベル `rules:` と各ルールの `id`（一意）/ `message` / `severity` / `languages`（TS/JS）/ pattern operator を持つ（schema 妥当性の保存）
- [INV-04] (Gate 3) ルール YAML・README・prompt に `service_role` を使う経路の推奨・実値・実在 secret / 本番値が現れることはない（service_role 誤用を検出する側であり推奨する側ではない — SEC-02 / SEC-03）
- [INV-05] (Gate 3) 各ルールには「例（出発点）であり網羅ではない」旨と `nosemgrep`（`nosemgrep: <rule-id>`）抑制方法・チューニング前提が常に併記される（誤検知配慮の保存）
- [INV-06] (Gate 4) ルール YAML は常に manual-copy 配布物であり、CLI（`init`/`update`/`doctor`）の managed file 経路（SPEC-0056 3-way）に載らない（`src/cli/` 不変 — 境界の保存）

### Pre-conditions
- [PRE-01] (Gate 2) ルール YAML を docs で参照する前に、参照する rule id・ファイルパス・opt-in コマンド（`--config ./supabase/semgrep/authz-rules.yml`）が確定している（未確定値を docs に書かない）
- [PRE-02] (Gate 3) ルール pattern を確定する前に、Semgrep 公式 rule syntax（pattern operator / `severity` の値 = `ERROR`/`WARNING`/`INFO` / `languages` の綴り）と照合済みである（幻覚構文のコミット前排除 — AI Output Verification）

### Post-conditions
- [POST-01] (Gate 2) 本 SPEC 適用後、`authz-rules.yml` は schema 妥当な 3 ルール（id 一意・TS/JS）を含み、`--config` 追加で semgrep に読み込める形である（AC-01 / AC-02）
- [POST-02] (Gate 2) 本 SPEC 適用後も `--config` を追加しない利用者の `security:sast` / `ai:check:secure` は現行どおり動作し、カスタムルールの影響を受けない（opt-in による非干渉 — INV-02）

### Assumptions
- [ASM-01] (Gate 横断) Semgrep はカスタム rule を `--config <path>` で追加読み込みでき、`--config auto --config <path>` の併用で auto ルール + カスタムルールの両方を適用する（Semgrep 公式 CLI の標準機能。pattern operator / `severity` / `languages` の綴りは公式 rule syntax で確認済み）
- [ASM-02] (Gate 横断) ルール pattern が検出するのは「利用者が信頼境界を跨いで書いた authz / RLS / レート制限を無視した実装の疑い」であり、ルールは出発点で誤検知しうる（利用者が `nosemgrep` / `paths:` / `pattern-not` でチューニングする前提 — INV-05）
- [ASM-03] (Gate 横断) ルール YAML は CLI が管理しない manual-copy 配布物であり、内容変更は SPEC-0056 の managed file hash / 3-way update 経路を通らない（`grep -rn "authz-rules\|supabase/semgrep" src/cli/` がヒット 0 件 = `src/cli/` に本ルール YAML を読み込み・管理するコードパスが無いことを事前調査で確認済み — INV-06 の前提。既存の `supabase-rls` profile 参照（`profile.mjs` / `profile-scripts.mjs` / `dependency-installer.mjs` 等）や既存の `security:sast` = `semgrep scan --config auto`（`profile-scripts.mjs:62`）は本 SPEC が変更しない既存契約点であり、ルール YAML 自体の管理コードとは別）
- [ASM-04] (Gate 横断) 本リポの CI は利用者コードに対する実 Semgrep スキャンを回さず、ルールの検証は静的（YAML schema 妥当性・meta 健全性・docs の記載）に限る（NFR-01。実際の検出 / 誤検知挙動は利用者環境 + semgrep バイナリの前提）。YAML パースは `ruby -ryaml`（ruby 不在は SKIPPED、grep 代替）で行い npm 依存を追加しない

## 関連ID

- PLAN-ID: [PLAN-0064](../plans/PLAN-0064-authz-semgrep-rules.md)
- TASK-ID: [TASK-0230](../tasks/TASK-0230-authz-semgrep-rules-yaml.md)（T1: ルール YAML 作成 + schema/meta/コメント検証テスト — 依存なし、AC-01 / AC-02 / AC-03）, [TASK-0231](../tasks/TASK-0231-authz-semgrep-docs.md)（T2: docs 導線追記 + docs 検証テスト — 依存: TASK-0230、AC-04 / AC-05）
- Done Definition: [done-def-SPEC-0064-round-1.md](../tasks/done-def-SPEC-0064-round-1.md)
- 参考: SPEC-0051（`security:sast` = `semgrep scan --config auto` の確立 + 「organization-specific Semgrep rules」のスコープ外化 — 本 SPEC で opt-in 解禁）, SPEC-0062（Semgrep SARIF opt-in を解禁し「ルールセット自体の同梱」を別 SPEC #12 へ deferred — 本 SPEC がその継続）, SPEC-0063（supabase-rls テンプレのパラメータ化 — 検出対象アンチパターンの「正しい形」の裏付け + manual-copy 境界の共有）, SPEC-0056（managed file hash 3-way — manual-copy が対象外である境界の前提）
