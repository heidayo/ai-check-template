# SPEC-0063: supabase-rls addon の RLS テストテンプレをスキーマ非依存にパラメータ化

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0063 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0056（managed file hash + 3-way update — 本 SPEC が扱う supabase テンプレは manual-copy でありこの経路の**対象外**である、という境界の前提）、SPEC-0057（`.claude/rules/local/` overlay + `ai-check.local.sh` — env var 上書きのみの既存機構で、テンプレ変数注入機構は無いという現状の裏付け）、SPEC-0058（`.ai-check.yaml` config — gate/step 設定のみでテンプレ変数注入ではない、という現状の裏付け）、SPEC-0051（`security:sast` = `semgrep scan --config auto`。RLS correctness は SAST でなく本テンプレが主担当という責務分界の前提） |
| 権限レベル | platform |

## 背景・目的

`supabase-rls` addon profile が配布する RLS テストテンプレは、`app_items` / `owner_id` / 固定 UUID / env var 名といったスキーマ依存の値をテスト本文に**散在ハードコード**している。利用者は自プロジェクトのスキーマに合わせるために、複数箇所を手動 find-replace する必要があり、置換漏れが「意味は通るが対象テーブルが違う」静かな誤りを生む。事前調査（2026-07-03、`package-templates/supabase/` と `src/cli/` 現行実装）で確認した現状は次のとおり:

- **RLS テストテンプレは manual-copy の配布物**であり、CLI（`init` / `update` / `doctor`）は一切管理しない。`grep -rn "supabase\|rls_policy\|app_items" src/cli/managed-files.mjs src/cli/profile-docs.mjs` はヒット 0 件。利用者は `package-templates/supabase/README.md` の「Copy Paths」に従い `cp` で導入し、「Replacement Checklist」に従い placeholder を手で置換する
- **対象テンプレは 3 ファイル**:
  - `package-templates/supabase/tests/database/rls_policy.test.sql` — pgTAP。`app_items` を本文 5 箇所（L25/34/42/51/62、L11 の注記コメントは別）、`owner_id` を本文 5 箇所（L26/35/44/53/62）にハードコード。テスト用 UUID は `set_config('app.test_user_a', '0000...0001', true)` の 2 行に既に集約済みで、本文は `current_setting('app.test_user_a')::uuid` で参照する形（= UUID は既に部分的にパラメータ化されているが、テーブル名・列名は未集約）
  - `package-templates/supabase/tests/rls/rls.integration.test.ts` — Vitest + supabase-js。`app_items` を 3 箇所（L12/20/32 の `.from()`）、`owner_id` を 5 箇所（`.select("id, owner_id")` の文字列内 2 箇所 L13/21 + `.eq("owner_id", ...)` の第 1 引数 3 箇所 L14/22/34）ハードコード。URL / anon key / session / user id は既に `requireEnv(...)` で env var 化済み（= 接続情報は集約済み、テーブル名・列名は未集約）
  - `package-templates/supabase/tests/e2e/magic-link.spec.ts` — Playwright。mail endpoint / email は `process.env.X ?? "default"` で**既に部分パラメータ化済み**。本 SPEC で構造変更を要する箇所は少ない（後述のとおり整合確認のみ）
- **現状のカスタマイズ手段は手動 find-replace**。置換対象の一次情報源は `package-templates/supabase/README.md` の「Replacement Checklist」（`app_items` / `owner_id` / `tenant_id` / user A・B の UUID / `SUPABASE_URL` / `SUPABASE_ANON_KEY` / session env / mail endpoint を列挙）。`profiles/supabase-rls/README.md` はこの手順を「placeholder を置換する」と参照するのみ
- **テンプレ変数注入の汎用機構は存在しない**。`.ai-check.yaml`（SPEC-0058）は gate/step のコマンド設定で、テンプレ変数の注入ではない。overlay（SPEC-0057）は rule ファイルと `ai-check.local.sh` の env var 上書きで、テスト本文への変数注入ではない。したがって「CLI がテンプレを変数展開する」経路は今後も作らず（スコープ外）、テンプレ**自身**の中でパラメータ化を完結させる必要がある
- **`prompts/rls-permission.md` は既に interactive/parametric**。role × resource state × 操作のマトリクスを AI が埋める設計で、スキーマ固有語をハードコードしていない。本 SPEC でプロンプト本体の構造を変える必要はなく、「生成した権限マトリクス（role/policy）をテスト変数にどう対応づけるか」のガイド追記に留める

本 SPEC は「**manual-copy テンプレのままで、スキーマ差し替えを『1 箇所の変数ブロック編集』で済ませる**」レイヤを追加する。事前調査に基づき、次の 1 案に確定する:

> **案A: テンプレ冒頭に「設定変数ブロック」を集約し、本文は変数を参照する。env var fallback で編集レスの注入も可能にする。**
> - pgTAP（SQL）: 冒頭で psql 変数を宣言（`\set table_name app_items` / `\set owner_column owner_id`）し、本文は `format('%I', :'var')` イディオムで参照する。pgTAP のテスト本文は `$$...$$`（ドル引用符）で囲まれ、psql の変数展開（`:'var'` / `:"var"` とも）はドル引用符文字列内では機能しないため、`:'var'`（値展開）を**ドル引用符の外**で `format()` の引数として渡し、`%I` が安全な識別子に変換する。散在した 5+5 箇所のハードコードを 2 行の宣言に集約する
> - Vitest（TS）: 冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items";` / `const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id";` を置き、本文は `.from(TABLE)` / `.select(\`id, ${OWNER}\`)` で参照する。env var 未設定なら default 値で従来どおり動く
> - Playwright（E2E）: 既に `process.env.X ?? default` パターンなので、変数宣言をファイル冒頭の「設定変数ブロック」に他 2 ファイルと同一の見出し規約で揃えるのみ（機能変更なし）
> - `package-templates/supabase/README.md` の「Replacement Checklist」を「各ファイル冒頭の設定変数ブロック 1 箇所を編集（または env var を注入）」に簡素化する
> - `profiles/supabase-rls/README.md` / `prompts/rls-permission.md` に、`rls-permission.md` が生成する権限マトリクスの role/policy をテスト変数（ロール名・ポリシー名・テーブル・列）へ対応づけるガイドを追記する
>
> **案A を採る理由**: manual-copy 制約（CLI が展開しない）と最小変更に最も合う。案B（`rls-fixtures.example.(sql|ts|json)` に切り出して import/include）は、pgTAP の `\i` include / Vitest の import 追加でファイル数と結合点が増え、「1 ファイルをコピーして冒頭を直す」という manual-copy の単純さを損なう。UUID が既に集約済み（SQL）・接続情報が既に env 化済み（TS）である現状は案A の「冒頭集約」に自然に接続する。案B は将来 fixture 共有の需要が実証された時点で別 SPEC で additive に足せる（スコープ外節）。

本 SPEC は **静的検証中心**である。テンプレは配布物であり、本リポの CI では実 Postgres / Supabase / ブラウザを起動しない。したがって observable なのは「**テンプレファイルの内容**」であり、テストは「変数が 1 箇所に集約され本文がハードコードを持たない」「テンプレが有効な SQL/TS として妥当」「env fallback が効く」ことの静的検証に限る（AC 参照）。

## 対象ユーザー

- Supabase + RLS を使う CLI 利用者 — テンプレを `cp` した後、各ファイル冒頭の設定変数ブロック 1 箇所を自スキーマ（テーブル・列・ロール・テスト UUID）に書き換えるだけで動く。散在置換の漏れによる「別テーブルを検証していた」事故を避けられる
- CI / 環境変数で注入したい利用者 — テンプレを編集せず、`RLS_TABLE` / `RLS_OWNER_COLUMN` 等の env var（SQL は psql `-v`、TS は `process.env`）で対象を差し替えられる
- 既にテンプレを手動コピー済みの利用者 — テンプレ内容が変わるだけで、**既にコピーしたファイルは変わらない**（manual-copy なので update で降ってこない — SPEC-0056 の managed file 経路の対象外）。次に新規コピーする分から新形式になる。新旧いずれのテンプレも有効な SQL/TS であることを保証する（後方互換）
- Review Agent / CI — 「変数集約（本文にハードコード直書きが無い）」「SQL/TS 妥当性」「env fallback」がテスト（静的検証）で固定される

## スコープ（含む）

- **`rls_policy.test.sql`（pgTAP）のパラメータ化**: 冒頭に設定変数ブロック（`\set table_name ...` / `\set owner_column ...`、必要なら `\set tenant_column ...`）を集約し、本文の `app_items` / `owner_id` を `format('%I', :'var')` イディオム（`:'var'` 値展開をドル引用符の外で `format()` に渡し、`%I` で安全に識別子化）に置換する。テスト UUID の `set_config('app.test_user_a', ...)` 集約は現行を維持する。env var 注入（`psql -v table_name=...` 相当）で default を上書きできる形にする
- **`rls.integration.test.ts`（Vitest）のパラメータ化**: ファイル冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"` 等の変数宣言ブロックを集約し、本文の `app_items` / `owner_id` 直書きを変数参照に置換する。env var 未設定時は default で従来と同一挙動
- **`magic-link.spec.ts`（Playwright）の整合**: 既存の `process.env.X ?? default` を、他 2 ファイルと同一の「設定変数ブロック」見出し規約に揃える（機能変更なし。冒頭集約の一貫性のみ）
- **`package-templates/supabase/README.md` の Replacement Checklist 簡素化**: 「複数箇所を find-replace」から「各ファイル冒頭の設定変数ブロックを 1 箇所編集、または env var を注入」へ書き換える。SQL 変数（psql `\set` / `-v`）・TS 変数（const + `process.env`）・Playwright 変数（`process.env`）の 3 系統の編集/注入方法を記載する。`service_role` を使わない注意書きは維持する
- **`profiles/supabase-rls/README.md` の追記**: 「Manual-copy templates」節に、テンプレが変数集約形であること、`rls-permission.md` で作った権限マトリクスの role/policy を各テスト変数（ロール名・ポリシー名・テーブル・列）に対応づける手順を追記する
- **`prompts/rls-permission.md` の追記**: 「カスタマイズ」節（または新規小節）に、生成した権限マトリクスの role/resource/action を pgTAP / integration テストの設定変数へ落とし込むマッピングガイドを追記する（プロンプト本文＝マトリクス生成ロジックは変えない）
- **テスト追加**: 変数集約の静的検証（設定変数ブロック外に `app_items` / `owner_id` 直書きが無いことの grep）、SQL/TS の妥当性検証（pgTAP テンプレの構文健全性・TS のパース/型健全性）、env fallback の検証（env 未設定で default、設定で上書き）

## スコープ外（明示的に除外）

- **RLS テストの CLI 管理化**（manual-copy を `init`/`update`/`doctor` の managed file にする）— 別 SPEC。本 SPEC は manual-copy のまま、テンプレ内容のパラメータ化に限定する。`src/cli/` は一切変更しない
- **CLI によるテンプレ変数展開機構の新設**（`init --rls-table app_items` 等で CLI がテンプレを書き換える）— 対象外。パラメータ化はテンプレ自身（psql 変数 / TS const + env）で完結させ、CLI 経路を作らない
- **authz / RLS 向け Semgrep ルールの同梱**（依頼 #12）— 別 SPEC。`security:sast` = `semgrep scan --config auto`（SPEC-0051）は変えない。RLS correctness は本テンプレが主担当で SAST は補助、という責務分界を維持する
- **Supabase 以外の DB / 権限機構への一般化**（MySQL row policy / アプリ層 authz テンプレ等）— 対象外。本 SPEC は `supabase-rls` addon の 3 テンプレに閉じる
- **権限マトリクスの自動生成**（`rls-permission.md` が担う role × resource × action マトリクスの生成ロジック）— `rls-permission.md` の範囲。本 SPEC はマトリクスを**テスト変数に対応づけるガイド**の追記に留め、マトリクス生成プロンプト本体は変えない
- **新規 npm 依存の追加**（YAML/SQL パーサ・fixture ローダ・pgTAP/vitest/playwright の追加依存）— ゼロ。既存前提（pgTAP は Supabase CLI、vitest / playwright は利用者側）のまま
- **案B（別 fixture ファイルへの切り出し）**の採用 — 本 SPEC では採らない（案A を確定）。将来 fixture 共有の需要が実証されたら別 SPEC で additive に検討する
- **`magic-link.spec.ts` の認証フロー・mail capture ロジックの機能変更** — 冒頭変数ブロックの見出し整合のみで、fetch / locator / フロー本体は変えない

## 要件

### 機能要件

- [FR-01] SQL 変数集約: `rls_policy.test.sql` はテスト本文で参照するスキーマ依存値（テーブル名・所有者列名、tenant 列を使う場合はそれも）を**ファイル冒頭の設定変数ブロック 1 箇所**に psql 変数（`\set`）で宣言する。本文の SQL は当該変数を `format('%I', :'var')` イディオムで参照する（`:'var'`（値展開）をドル引用符 `$$...$$` の**外**で `format()` の引数として渡し、`%I` が安全な識別子に変換する。psql の変数展開はドル引用符文字列内では機能しないため、生の `:"var"` / `:'var'` をドル引用符内に置かない）。`app_items` / `owner_id` の**リテラル直書きを本文に残さない**（設定変数ブロック内の default 宣言を除く）。テスト UUID の `set_config('app.test_user_a', ...)` 集約は現行を維持する
- [FR-02] SQL の env/実行時上書き: SQL の設定変数は psql 実行時に `-v table_name=<name>`（未指定時は冒頭 `\set` の default が有効）で上書きできる。default 値は現行のリテラル（`app_items` / `owner_id`）と一致させ、env/`-v` 無指定時の挙動を現行と同一にする
- [FR-03] TS 変数集約: `rls.integration.test.ts` はテーブル名・所有者列名を**ファイル冒頭の変数宣言ブロック**に `const TABLE = process.env.RLS_TABLE ?? "app_items"` / `const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id"` 形で集約し、本文の `.from(...)` / `.select(...)` / `.eq(...)` は当該変数を参照する。本文に `app_items` / `owner_id` のリテラル直書きを残さない（宣言ブロックの default を除く）。接続情報（URL / anon key / session / user id）の既存 `requireEnv(...)` 集約は維持する
- [FR-04] TS の env fallback: TS の変数は `process.env.RLS_TABLE` 等が設定されていればその値、未設定なら宣言ブロックの default 値（`app_items` / `owner_id`）を使う。env 未設定時の挙動は現行と観測的に同一である
- [FR-05] Playwright の見出し整合: `magic-link.spec.ts` の既存 `process.env.SUPABASE_LOCAL_MAIL_API_URL ?? ...` / `process.env.SUPABASE_TEST_EMAIL ?? ...` を、他 2 ファイルと同一の「設定変数ブロック」見出し規約（例: `// --- 設定変数（環境に合わせて編集 / env で注入）---`）でファイル冒頭にまとめる。default 値・fetch・locator・フロー本体は変えない
- [FR-06] Replacement Checklist の簡素化: `package-templates/supabase/README.md` の「Replacement Checklist」を、「各テストファイル冒頭の設定変数ブロックを編集する、または対応する env var を注入する」手順に書き換える。SQL（`\set` default / `psql -v`）・TS（`const` default / `process.env`）・Playwright（`process.env`）の変数名一覧と、編集/注入の 2 方法を記載する。`service_role` 非使用の注意書きは維持する
- [FR-07] profile / prompt のマッピングガイド追記: `profiles/supabase-rls/README.md` の「Manual-copy templates」節に、テンプレが変数集約形であること + `rls-permission.md` の権限マトリクス（role/resource/action）をテスト変数（テーブル・所有者列・ロール名・ポリシー名）へ対応づける手順を追記する。`prompts/rls-permission.md` の「カスタマイズ」節に、生成マトリクスをテスト設定変数へ落とし込むガイドを追記する（マトリクス生成プロンプト本体は不変）
- [FR-08] 後方互換（新旧テンプレの妥当性）: 本 SPEC 適用後の新テンプレ（変数集約形）は default 値のまま有効な SQL / TS であり、かつ既にコピー済みの旧テンプレ（ハードコード形）も有効な SQL / TS のままである。manual-copy ゆえ既存利用者のファイルは書き換わらず、新形式は新規コピー分にのみ適用される（この非追従性を README に明記する）

### 非機能要件

- [NFR-01] 観測面の明示（静的検証中心）: 本 SPEC の observable は「テンプレ**ファイルの内容**」である。本リポ CI では実 Postgres / Supabase / ブラウザを起動しないため、テストは (a) 変数集約（設定変数ブロック外にハードコード直書きが無い）の grep 検証、(b) SQL テンプレの構文健全性（psql `--dry-run` 相当のパース、または pgTAP テンプレの静的構文チェック。実 DB 接続なし）、(c) TS テンプレのパース/型健全性（`tsc --noEmit` 相当。実行なし）、(d) env fallback の解決（env 有無で対象値が切り替わることの単体検証）に限る。実 RLS 挙動（実際に行が見える/見えない）の検証はスコープ外（利用者環境依存）。一般的なコードカバレッジ閾値（行/分岐 %）は本 SPEC の観測面に適さないため適用対象外とし、網羅性は AC-01〜AC-06 の個別テストケース充足で担保する
- [NFR-02] 新規 npm 依存ゼロ: パラメータ化・検証は既存前提（pgTAP は Supabase CLI 側、vitest / playwright は利用者側、`node:` 標準）のみで行い、SQL/YAML パーサや fixture ローダを新規導入しない。`package.json` の runtime / dev dependencies を変えない（検証: `tests/cli/package.test.mjs` の dependencies 検査）
- [NFR-03] 最小変更・散在ハードコード除去: パラメータ化は「冒頭集約 + 本文の変数参照置換」に限定し、テストの検証意図（許可/拒否の各アサーション・pgTAP `plan(6)` の件数・`service_role` 非使用）を変えない。SQL の `plan()` 件数、TS の `describe`/`test` 構造、アサーションの意味は保存する
- [NFR-04] 新規追加要素は各々テストで固定: 変数集約（SQL / TS それぞれで本文ハードコード不在）・SQL 構文健全性・TS パース/型健全性・env fallback（SQL の `-v` 上書き相当 / TS の `process.env` 上書き）を各 1 ケース以上で固定する。網羅はテストケース列挙で担保し、カバレッジツールは導入しない（NFR-01 の観測面方針に整合）

### セキュリティ要件

- [SEC-01] SQL インジェクション回避（識別子の安全なクォート）: SQL テンプレの変数は**識別子**（テーブル名・列名）として使われるため、`format('%I', ...)` で埋め込み、SQL 側で安全にクォートさせる。psql の変数展開（`:'var'` / `:"var"` とも）は引用符付き SQL リテラル・識別子内および**ドル引用符文字列（`$$...$$`）内では機能しない**（PostgreSQL 公式 psql "SQL Interpolation" ドキュメントで確認済み）。pgTAP のテスト本文は `$$...$$` で囲まれるため、その中に生の変数参照を置くと展開されずリテラル文字列としてサーバに渡り無効な SQL になる。したがって psql の `:'var'`（**値展開**）を**ドル引用符の外**で `format()` の引数として渡し（psql がクォート付き文字列リテラルに展開）、`format('%I', ...)` がそれを安全にクォートした識別子に変換する。テンプレは「利用者が信頼する自スキーマの識別子を注入する」前提だが、`%I` を正しく使うことで、変数値がクエリ構造を壊さない（例: テーブル名に予約語やスペースが来ても `"..."` で囲まれる）。この機構（ドル引用符内に変数参照を置かず `format('%I', :'var')` で識別子化する）をテンプレコメント + README に明記する
- [SEC-02] service_role 非使用の維持: パラメータ化で `service_role` / 特権サーバキーを使う経路を新設しない。TS テンプレの「service-role bypass warning」コメントと anon key + user session による検証経路を維持する（RLS correctness を素通りさせない）。変数化で接続情報の注入先が増えても、特権キーの default / 例示を混入させない
- [SEC-03] secret 非混入: 設定変数ブロック・README・prompt 追記に、実在の secret / token / 本番 URL / 本番 email を例示として書かない。UUID は現行の `0000...0001` 系のダミー、URL は `127.0.0.1` 系ローカル、email は `.test` ドメインを維持する（利用者が env で本番値を注入する前提で、テンプレには非機密の default のみ）

### 運用要件

- [OPS-01] 置換漏れ事例の段階観測: v1 リリース後 1 リリースサイクル、パラメータ化テンプレの「変数集約したが本文に置換漏れが残り別テーブルを検証していた」「env 注入が効かない」事例を観測する。該当事例が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'rls: 変数注入漏れ' sage/failures.md` で機械的に件数確認する。原因タグ『rls: 変数注入漏れ』は固定文字列とし表記ゆれを禁止する。failures.md 記録時は既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）のうち該当値と併記し、症状欄冒頭に検索用補助タグ『rls: 変数注入漏れ』を付す。原因タグは cause enum を置き換えず補助的に追加する）、変数集約の粒度見直し（案B の fixture 切り出し検討を含む）を別 SPEC で起票する
- [OPS-02] fixture 切り出し需要の観測: 複数テストファイル間でテーブル/ロール/UUID を共有したい需要（案B）が dogfooding / 利用者要望で確認されたら、別 SPEC で `rls-fixtures.example.(sql|ts)` の切り出しを additive に検討する。判定は roadmap 見直し時に issue / feedback を確認して行う（本 SPEC の案A 冒頭集約は、fixture 切り出しへの移行余地を塞がない — 契約節参照）

## File Scope

| 区分 | ファイル |
|---|---|
| 変更（テンプレ SQL） | `package-templates/supabase/tests/database/rls_policy.test.sql`（冒頭設定変数ブロック + 本文の psql 変数参照化） |
| 変更（テンプレ TS） | `package-templates/supabase/tests/rls/rls.integration.test.ts`（冒頭変数宣言ブロック + 本文の変数参照化、env fallback） |
| 変更（テンプレ E2E） | `package-templates/supabase/tests/e2e/magic-link.spec.ts`（既存 env 変数を設定変数ブロック見出しに整合。機能変更なし） |
| 変更（ドキュメント） | `package-templates/supabase/README.md`（Replacement Checklist 簡素化）, `package-templates/profiles/supabase-rls/README.md`（変数集約 + マトリクス対応づけガイド追記）, `package-templates/prompts/rls-permission.md`（マトリクス → テスト変数マッピングガイド追記） |
| 変更 / 新規（テスト） | `tests/cli/supabase-rls-template.test.mjs`（**新規**。変数集約の grep 検証 + env fallback 検証 + SQL/TS 静的妥当性）。**配置先を `tests/cli/` に確定する理由**: 現行 `package.json` の `test` / `test:cli` は `node --test tests/cli/*.test.mjs` であり `tests/cli/` 配下のみを実行対象とするため、ここに置けば package.json 変更なしで既存 test に組み込まれる（`tests/templates/` に置くと glob 非対象で CI 未実行になる） |

上記以外への変更は本 SPEC のスコープ外。特に **`src/cli/` 配下（`managed-files.mjs` / `profile-docs.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` 等 — supabase テンプレを manual-copy のまま保つ。CLI 管理化はスコープ外）**、`package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` を変えない — SPEC-0051 保存）、他 profile の README、`docs/cli.md`（CLI surface を変えないため追記不要）は**変更しない**。テストは `tests/cli/supabase-rls-template.test.mjs` に新規作成する（`tests/cli/` 配下のため既存 test glob に自動で含まれ、`package.json` の scripts 変更は不要 = File Scope 外を触らない）。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `rls_policy.test.sql` の設定変数ブロック外（`\set` 宣言行を除く本文）に `app_items` / `owner_id` のリテラル直書きが存在しない（`grep` で宣言行を除外して直書き 0 件を検証）。冒頭に `\set table_name`（および owner 列の `\set`）が存在し、本文が `format(` + `%I` + `:'table_name'` / `:'owner_column'`（シングルクォートの値展開）の参照形で識別子を注入している（`grep` で `format(`・`%I`・`:'table_name'`・`:'owner_column'` の共存を検証）。識別子注入は `:'var'`（シングルクォート）が正しい形であり、`:"var"` や生の変数参照をドル引用符内に置く形は現れない（FR-01）【種別: unit】
- [ ] AC-02: `rls.integration.test.ts` の変数宣言ブロック外に `app_items` / `owner_id` のリテラル直書きが存在せず、冒頭に `const TABLE = process.env.RLS_TABLE ?? "app_items"`（および owner 列相当）が存在し、本文が `TABLE` / `OWNER` 変数を参照している（`grep` で検証）。`tsc --noEmit` 相当（または既存 CI の TS 検証手段）で当該テンプレがパース/型健全である（FR-03）【種別: unit】
- [ ] AC-03: env fallback の検証 — TS テンプレの変数解決が `process.env.RLS_TABLE` 未設定で default（`app_items`）、設定時にその値へ切り替わる（変数解決部分を単体で検証）。SQL テンプレは psql `-v table_name=<name>` 指定時に本文の対象テーブルが切り替わり、無指定時に冒頭 `\set` の default が有効になる（構文レベル / dry-run 相当で検証。実 DB 接続なし = NFR-01）（FR-02 / FR-04）【種別: unit】
- [ ] AC-04: SQL / TS テンプレの妥当性 — `rls_policy.test.sql` が psql `--dry-run` 相当（または pgTAP テンプレの静的構文チェック）でパース可能で、`plan(6)` の件数・許可/拒否の各アサーションが保存されている。`magic-link.spec.ts` を含む TS 系テンプレがパース健全である（NFR-03 の検証意図保存を含む。実 DB / ブラウザ起動なし = NFR-01）【種別: unit + integration】
- [ ] AC-05: `package-templates/supabase/README.md` の Replacement Checklist が「設定変数ブロック 1 箇所の編集 / env 注入」に簡素化され、SQL（`\set` / `-v`）・TS（`const` / `process.env`）・Playwright（`process.env`）の変数一覧と 2 つの注入方法が記載されている（`grep` で変数名一覧・`-v` / `process.env` の記載を検証し、`service_role` 非使用注意書きが残存することをレビュー確認 = FR-06 / SEC-02）【種別: docs】
- [ ] AC-06: `profiles/supabase-rls/README.md` と `prompts/rls-permission.md` に、`rls-permission.md` の権限マトリクス（role/resource/action）をテスト設定変数（テーブル・所有者列・ロール名・ポリシー名）へ対応づけるガイドが存在する（`grep` で「設定変数」「マトリクス」等のキーワードとテンプレ参照の存在を検証し、`rls-permission.md` のマトリクス生成プロンプト本体が無変更であることをレビュー確認 = FR-07）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit | Gate 2: Functional |
| AC-02 | unit | Gate 2: Functional |
| AC-03 | unit | Gate 2: Functional |
| AC-04 | unit + integration | Gate 2: Functional |
| AC-05 | docs | Gate 1: Structural（+ Gate 3: Security の service_role 非使用観点） |
| AC-06 | docs | Gate 1: Structural |

AC-01〜AC-04 のテストは `tests/cli/supabase-rls-template.test.mjs` に置かれ、現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs` の実行対象に自動で含まれるため、CI 上は追加の workflow 設定なし・package.json 変更なしで必須チェック化される。AC-05 / AC-06 は docs の静的検証（grep + レビュー）で、preflight（`npm pack` 内容検査等）を壊さないことを含めて確認する。

## 異常系

- 想定エラー1（env 未設定時の default 動作）: 利用者が `RLS_TABLE` 等の env / `-v` を一切指定せずにテンプレを実行した場合 → SQL は冒頭 `\set` の default（`app_items` / `owner_id`）、TS は `?? "app_items"` の default が有効になり、**本 SPEC 適用前の旧テンプレと観測的に同一の対象**でテストが構成される（現行のデフォルト挙動を保存する。検証条件は AC-03 を一次情報源とする）
- 想定エラー2（変数ブロックの構文誤り）: 利用者が設定変数ブロックの編集で構文を壊した場合（SQL: `\set` の綴り誤り / 変数参照 `:'var'` をドル引用符 `$$...$$` の内側に置いて展開されない / `format('%I', ...)` の引数を欠く、TS: `const` の型不整合や `??` の欠落）→ SQL は psql の構文/実行エラー、TS は `tsc` のパース/型エラーとして fail する（silent に別テーブルを検証しない）。テンプレコメント + README に「ドル引用符内に変数参照を置かず、`:'var'`（値展開）を `format('%I', ...)` の引数としてドル引用符の外で渡す」機構を明記して誤りを減らす（SEC-01。検証条件は AC-01 / AC-04 を一次情報源とする）
- 想定エラー3（本文の置換漏れ）: 実装中に本文の `app_items` / `owner_id` の一部を変数参照に置換し損ねた場合 → 設定変数ブロック外にリテラル直書きが残るため AC-01 / AC-02 の grep 検証が fail する（置換漏れを機械検出する。検証条件は AC-01 / AC-02 を一次情報源とする）
- 想定エラー4（service_role 混入）: パラメータ化の過程で接続情報の変数に特権キーの default / 例示を混入させた場合 → SEC-02 に反する。TS テンプレの anon key + user session 経路と「service-role bypass warning」コメントの残存を AC-05 のレビュー + grep で確認して防ぐ（検証条件は AC-05 を一次情報源とする）
- 境界ケース1（tenant 列を使わないスキーマ）: `tenant_id` 列を持たない利用者 → tenant 変数はオプショナルとし、設定変数ブロックで宣言しない/空にした場合も default（tenant 非依存）のテストが有効な SQL/TS として成立する（tenant 変数を必須にしない。検証条件は AC-04 を一次情報源とする）
- 境界ケース2（既にコピー済みの旧テンプレ）: 利用者が旧ハードコード形テンプレを既にコピー済み → manual-copy のため本 SPEC のテンプレ変更は当該ファイルに降ってこない（SPEC-0056 の managed file 経路の対象外）。旧テンプレは有効な SQL/TS のまま動作し続け、新形式は新規コピー分にのみ適用される（FR-08。検証条件は README の非追従性明記 = AC-05 を一次情報源とする）

## 契約

- API: (1) **テンプレ内容（配布物）**: 3 テンプレを「冒頭設定変数ブロック + 本文の変数参照」形に変更。SQL は psql 変数（`\set` 宣言 / `format('%I', :'var')` イディオムでの識別子注入 / `-v` 上書き。`:'var'` 値展開をドル引用符の外で `format()` に渡し `%I` で識別子化）、TS は `const X = process.env.Y ?? default`、Playwright は既存 env パターンの見出し整合。default 値は現行リテラルと一致し、env/`-v` 無指定時の挙動は現行と同一（後方互換）。 (2) **manual-copy 境界**: これらは CLI 管理外の manual-copy 配布物であり、SPEC-0056 の 3-way managed file 経路の**対象外**。テンプレ変更は既存コピー済みファイルに追従せず、新規コピー分にのみ効く。 (3) **将来拡張（fixture 切り出し）**: 案A の冒頭集約は、将来 `rls-fixtures.example.(sql|ts)` への切り出し（案B）へ additive に移行可能で、本 SPEC は case B を排他しない（OPS-02）。 (4) **prompt / package script 不変**: `rls-permission.md` のマトリクス生成プロンプト本体、`security:sast` = `semgrep scan --config auto`（SPEC-0051）は不変。
- DB: なし（テンプレは配布物であり、本リポは migration を持たない。実 DB 接続は利用者環境で発生し本リポ CI では起動しない）
- イベント: なし

## リスク

- リスク1: psql の変数展開（`:'var'`）や `format('%I', ...)` が利用者の psql / Supabase CLI バージョンで期待どおり動かない、または `-v` の受け渡し方が環境で異なる → 軽減策: psql の変数展開はドル引用符文字列内では機能しないため（公式 "SQL Interpolation" で確認済み）、`:'var'`（値展開）をドル引用符の外で `format()` の引数として渡し `%I` で識別子化する実証済みイディオムを使う。`format('%I', ...)` は PostgreSQL 標準関数、`:'var'` は psql 標準機能であり、テンプレ冒頭の `\set` default で「env/`-v` 無指定でもそのまま動く」状態を保証する。実装時は src-rules.md AI Output Verification に従い psql / PostgreSQL 公式ドキュメントで `:'var'` 値展開・`format('%I', ...)`・`-v` の挙動を照合する（幻覚フラグの混入防止）。利用者は生成された SQL を自由に編集できる
- リスク2: TS の `process.env.X ?? default` が、利用者のテストランナー設定（env 読み込みタイミング）で default に落ちる → 軽減策: env fallback は現行 `magic-link.spec.ts` で既に使われている実証済みパターンで、新規リスクは小さい。env 未設定時に default で動く（= 旧挙動と同一）ことを AC-03 で固定し、env が効かない事例は OPS-01 で観測する
- リスク3: 本文の置換漏れで「変数集約したつもりが一部ハードコードのまま別テーブルを検証」 → 軽減策: AC-01 / AC-02 の grep で設定変数ブロック外の直書きを 0 件検証し、機械的に置換漏れを検出する。文章ルールでなくテストでガードする（AP-06 Human-Only Guard の回避）
- リスク4: パラメータ化で pgTAP の `plan()` 件数やアサーションの意味を意図せず変える → 軽減策: NFR-03 で検証意図の保存を要求し、AC-04 で `plan(6)` 件数・許可/拒否アサーションの保存を検証する。変数化は「識別子の参照方法」だけを変え、テストロジックを変えない
- リスク5: 既存コピー済み利用者が「update で新形式が降ってくる」と誤解する → 軽減策: manual-copy ゆえ追従しないことを README（FR-08 / AC-05）に明記する。混乱事例は OPS-01 で観測する
- リスク6: 機構を撤去する必要が生じた場合 → 軽減策: 変更はテンプレ内容 + docs に閉じ（`src/cli/` 不変）、テンプレを旧ハードコード形に戻せば現行に戻る。CLI 経路を作らないため撤去の影響範囲がテンプレ + docs に限定される

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: RLS テストテンプレのパラメータ化は配布物（`package-templates/supabase/`）の内容変更であり、本リポの開発運用ルールに影響しない。配布物の一次情報源は `package-templates/supabase/README.md` / `profiles/supabase-rls/README.md` で、CLAUDE.md / `ai-check-template.md` は既に参照型（配布物の fixed-list を持たない）ため追記不要。CLI surface は不変なので `docs/cli.md` も対象外）
- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。OPS-01 の原因タグ『rls: 変数注入漏れ』を該当時に付す
- 「manual-copy 配布物は SPEC-0056 の 3-way managed file 経路の対象外であり、テンプレ変更は既存コピーに追従しない」は既知の境界であり、新規パターンではない（`package-templates/supabase/README.md` が manual-copy であることは事前調査で確認済み）。破ると「テンプレを変えたのに利用者に届く/届かない」の期待違いが起きるため、FR-08 / AC-05 で README に明記する
- 「利用者スキーマ由来の識別子（テーブル名・列名）を SQL に埋め込む」のは信頼境界の扱いを要する箇所であり、`format('%I', :'var')` イディオム（psql の変数展開はドル引用符内では機能しないため、`:'var'` 値展開をドル引用符の外で `format()` に渡し `%I` で安全に識別子化する）を SEC-01 で明示し、テンプレコメント + README + AC-01（grep で `format(` + `%I` + `:'table_name'` / `:'owner_column'` 参照形の存在確認）でガードする
- テスト期待値は本 SPEC の契約節から導出し、AC-N 参照をテストケース名に付す

**アンチパターン照合の補記**: 想定タスク分割 T1〜T3 は各 File Scope が 10 ファイル未満で AP-02（Big Bang Prompt）の 20 ファイル閾値に抵触しない。commit message への TASK-ID 必須（commit-msg hook）は AP-05（Invisible Development）の防止策と一致する。File Scope 外変更（特に `src/cli/` / `package.scripts.fragment.json`）は `templates/hooks/check-file-scope.sh` で検出される（AP-03）。

## 実装メモ（Implementation Agent向け）

- **SQL 変数集約**（`rls_policy.test.sql`）: 既存冒頭の `select set_config('app.test_user_a', ...)` 集約の直前/直後に `\set table_name app_items` / `\set owner_column owner_id` を追加し、`app_items` / `owner_id` を参照する各テスト本文を `format($q$ ... %I ... $q$, :'table_name', :'owner_column')` の形に書き換える（例: `select id from app_items where owner_id = ...` → `format($q$ select id from %I where %I = ... $q$, :'table_name', :'owner_column')`、`insert into app_items (owner_id) values ...` → `format($q$ insert into %I (%I) values ... $q$, :'table_name', :'owner_column')`）。**識別子注入は `format('%I', :'var')` イディオム**を使う（psql の変数展開はドル引用符 `$$...$$` 内では機能しないため、`:'var'`（値展開）をドル引用符の外で `format()` の引数として渡し、`%I` が安全な識別子に変換する。ドル引用符内に生の `:"var"` / `:'var'` を置くと展開されず無効な SQL になる — SEC-01）。tenant 列を使う場合の `\set tenant_column ...` はオプショナルで、default では宣言しても本文で使わない形にするか、コメントで示す。`plan(6)` の件数は変えない
- **TS 変数集約**（`rls.integration.test.ts`）: import 群の直後、`describe` の前に `const TABLE = process.env.RLS_TABLE ?? "app_items";` / `const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id";` を宣言する。本文の `.from("app_items")` → `.from(TABLE)`、`.select("id, owner_id")` → `.select(\`id, ${OWNER}\`)`、`.eq("owner_id", ...)` → `.eq(OWNER, ...)` に置換する。`createUserClient` / `requireEnv` / 「service-role bypass warning」コメントは変えない
- **Playwright 見出し整合**（`magic-link.spec.ts`）: 既存の `const mailApiUrl = process.env.X ?? ...` / `const testEmail = ...` を、SQL / TS と同一の見出しコメント（例: `// --- 設定変数（環境に合わせて編集 / env で注入）---`）でまとめる。値・fetch・locator は不変（機能変更なし）
- **README 簡素化**（`supabase/README.md`）: 現「Replacement Checklist」の項目リスト（`app_items` / `owner_id` / `tenant_id` / UUID / env）を、「各ファイル冒頭の設定変数ブロックを編集、または env（SQL: `psql -v table_name=...` / TS: `RLS_TABLE=...` / Playwright: `SUPABASE_TEST_EMAIL=...`）を注入」に置き換える。変数名の対応表（テンプレ変数 ↔ env var ↔ 意味）を載せると分かりやすい。`service_role` 非使用の段落は維持する。「manual-copy ゆえ既存コピーは自動追従しない」旨を 1 文追記する（FR-08）
- **profile / prompt 追記**: `profiles/supabase-rls/README.md` の「Manual-copy templates」節末尾に、テンプレが変数集約形であること + `rls-permission.md` のマトリクス（role/resource/action）→ テスト変数（テーブル・owner 列・ロール・ポリシー）の対応づけ手順を追記。`prompts/rls-permission.md` の「カスタマイズ」節に同旨のマッピングガイドを追記（プロンプト本文の Step 1〜3 = マトリクス生成ロジックは不変）
- **テスト**（新規 `tests/cli/supabase-rls-template.test.mjs`）: (1) SQL テンプレを読み、`\set` 宣言行を除いた本文に `/\bapp_items\b/` / `/\bowner_id\b/` がヒットしないことを assert（AC-01）。(2) TS テンプレを読み、宣言ブロックを除いた本文に同リテラルがヒットせず、`process.env.RLS_TABLE` を含む宣言が存在することを assert（AC-02）。(3) env fallback: TS の変数解決を単体で（env 有無で）確認（AC-03）。(4) SQL/TS の妥当性は依存を増やさない静的手段で検証する（TS は Node で `import()` せず文字列読取 + 構文的アサート、または既存 `tsc` があれば型チェック、SQL は `\set` 宣言と `plan(6)` 等の必須トークン存在を確認）（AC-04）。grep 検証は「宣言行（`\set` / `const ... = process.env`）を行番号または行頭パターンで除外」する正規表現の設計が肝で、この除外方針を AC-01/AC-02 の一次情報源として本 SPEC に固定する（実装メモではなく AC 側で確定）
- **言語規約**: `supabase/README.md`（英語ベースの既存ドキュメント）への追記は英語、`profiles/supabase-rls/README.md` / `prompts/rls-permission.md`（日本語ドキュメント）への追記は日本語、テンプレ内コメントは既存テンプレのスタイル（SQL/TS は英語コメント、見出しは既存に合わせる）に揃える、テストケース名は日本語 + AC-N 参照、コード識別子（変数名・env var 名）は英語
- exit code / エラー規約: 本 SPEC は CLI のエラー経路を新設しない（テンプレ内容 + docs + テストの変更が主）。`src/cli/` を触らないため `CliError` / `process.exit` に関与しない

### 実装ルール

- `src/cli/` を変更しない（supabase テンプレは manual-copy のまま。CLI 管理化はスコープ外。触れたら設計を疑う）
- `security:sast`（`semgrep scan --config auto`）を変更しない（SPEC-0051 保存。`package.scripts.fragment.json` / `profile-scripts.mjs` に触れたら設計を疑う）
- SQL の識別子注入は `format('%I', :'var')` イディオムを使い、ドル引用符 `$$...$$` の内側に生の変数参照（`:"var"` / `:'var'`）を置かない（SEC-01。psql の変数展開はドル引用符内では機能せず、置くと展開されずリテラル文字列としてサーバに渡り SQL が壊れる。`:'var'` 値展開はドル引用符の外で `format()` の引数として渡す）
- テスト UUID / URL / email の default は非機密のダミー（`0000...0001` / `127.0.0.1` / `.test`）を維持し、実在 secret / 本番値を例示しない（SEC-03）
- `service_role` / 特権キーを使う経路・default・例示を新設しない（SEC-02）
- パラメータ化は本文の識別子参照のみを変え、`plan()` 件数・アサーションの許可/拒否の意味・`describe`/`test` 構造を変えない（NFR-03）
- 本文の `app_items` / `owner_id` を 1 箇所でも変数参照に置換し損ねない（AC-01 / AC-02 の grep で機械検出）
- `rls-permission.md` のマトリクス生成プロンプト本文（Step 1〜3）を変えない（追記はガイド節のみ — FR-07）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- PM invocation / psql 構文 / supabase-js API は実 PM / Supabase CLI / ライブラリ公式ドキュメントと照合してから確定する（src-rules.md AI Output Verification: 幻覚フラグの混入防止）
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `src/cli/managed-files.mjs` / `profile-docs.mjs`（supabase を管理しない — 事前調査で確認）→ 本 SPEC はこれらに触れない。触れる必要が出たら「manual-copy のまま」の前提が崩れた設計ミスとして立ち止まる
- `package-templates/supabase/README.md` の「Copy Paths」節（`cp` 手順）→ 変数集約後もコピー手順自体は不変。変えるのは「Replacement Checklist」節のみ
- `rls_policy.test.sql` の既存 UUID 集約（`set_config('app.test_user_a', ...)`）→ 既にパラメータ化済みなので変えない。テーブル/列の `\set` 集約を**追加**する形にし、UUID の扱いと二重管理にしない
- `magic-link.spec.ts` の既存 env パターン → 見出し整合のみ。既存テストの期待値（フロー・locator）を変えない。もし supabase テンプレ専用テストが既存にあれば、その期待値の active 部分を書き換えない（見出しコメント追加が既存 assert を壊さないことを確認）
- `prompts/rls-permission.md` の Step 1〜3（マトリクス生成）→ 不変。追記は「カスタマイズ」節のマッピングガイドのみで、既存プロンプト本文の grep 期待（もしあれば）を壊さない

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: SQL テンプレの変数集約（`rls_policy.test.sql`）+ `tests/cli/supabase-rls-template.test.mjs` の SQL 検証ケース（変数集約 grep + SQL 妥当性 + `-v` fallback）（FR-01 / FR-02 / SEC-01。AC-01 / AC-03(SQL) / AC-04(SQL)）（依存なし）
  - 完了条件: SQL の本文ハードコード不在テストがパスし、`plan(6)` 件数が保存され、既存テスト全件が無修正で pass
- T2: TS / E2E テンプレの変数集約（`rls.integration.test.ts` / `magic-link.spec.ts`）+ テストの TS 検証ケース（変数集約 grep + env fallback + TS パース/型健全性）（FR-03 / FR-04 / FR-05 / SEC-02。AC-02 / AC-03(TS) / AC-04(TS)）（依存: T1 — T1 が新規作成する `tests/cli/supabase-rls-template.test.mjs` に T2 が TS 検証ケースを追記するため直列。並列不可）
  - 完了条件: TS の本文ハードコード不在 + env fallback テストがパスし、service-role warning が残存、既存テストが無修正で pass
- T3: ドキュメント更新（`supabase/README.md` の Checklist 簡素化 + `profiles/supabase-rls/README.md` / `prompts/rls-permission.md` のマッピングガイド追記）（FR-06 / FR-07 / SEC-03。AC-05 / AC-06）（依存: T1 / T2 — 確定した変数名・注入方法を docs 化するため）
  - 完了条件: AC-05 / AC-06 の grep がヒットし、`service_role` 非使用注意書き残存・prompt 本体不変をレビュー確認、既存 preflight が壊れない

T1 → T3 は直列（テンプレ変数確定 → docs 化）。T2 は T1 と同一テスト基盤を共有するため T1 と近接だが、SQL / TS は互いに素なファイルのため PLAN で並行可否を確定する。T1/T2 を 1 タスクに統合しない理由: SQL（`format('%I', :'var')` による識別子注入 = SEC-01 の Gate 3 観点）と TS（env fallback + service_role 非使用 = SEC-02 の Gate 3 観点）は検証観点が異なり、独立コミットで観測しやすいため分ける。ただし File Scope が各 10 ファイル未満なので、PLAN 起票時に統合が合理的なら再検討してよい。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- `src/cli/` の変更の禁止 — supabase テンプレは manual-copy のまま（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- 本文への `app_items` / `owner_id` リテラル直書きの残存の禁止 — 設定変数ブロックに集約し本文は変数参照（検出: AC-01 / AC-02 の grep で本文ハードコード 0 件）
- ドル引用符 `$$...$$` 内での生の変数参照（`:"var"` / `:'var'`）の禁止 — psql の変数展開はドル引用符内では機能しないため、識別子注入は `format('%I', :'var')`（`:'var'` 値展開をドル引用符の外で `format()` に渡す）を使う（検出: AC-01 の `format(` + `%I` + `:'table_name'` / `:'owner_column'` 参照形存在確認 + AC-04 の SQL 妥当性 + レビュー — SEC-01）
- `service_role` / 特権キーを使う経路・default・例示の新設の禁止（検出: AC-05 の service-role 非使用注意書き残存 + テンプレ内 anon key + user session 経路の維持のレビュー — SEC-02）
- 実在 secret / 本番 URL / 本番 email の例示混入の禁止 — 非機密ダミー（`0000...0001` / `127.0.0.1` / `.test`）を維持（検出: レビュー + テンプレ / README の grep — SEC-03）
- `plan()` 件数・アサーションの許可/拒否の意味・テスト構造の変更の禁止 — 変数化は識別子参照のみ（検出: AC-04 の検証意図保存 + 既存テストの無修正 pass — NFR-03）
- `security:sast`（`semgrep scan --config auto`）の変更の禁止（検出: `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認 — SPEC-0051 保存）
- `rls-permission.md` のマトリクス生成プロンプト本文（Step 1〜3）の変更の禁止 — 追記はガイド節のみ（検出: AC-06 のレビューで prompt 本体無変更確認 — FR-07）
- 新規 npm 依存（SQL/YAML パーサ・fixture ローダ）の追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー — NFR-02）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) 各 RLS テストテンプレにおいて、スキーマ依存の識別子（テーブル名・所有者列名）は「ファイル冒頭の設定変数ブロック 1 箇所」でのみ default 宣言され、本文にはリテラル直書きが存在しない（変数集約の完全性）
- [INV-02] (Gate 2) env / `-v` を一切指定しない場合のテンプレの対象（テーブル・列・UUID）は、本 SPEC 適用前の旧テンプレと常に同一である（default 値による後方互換の保存）
- [INV-03] (Gate 2) パラメータ化の前後で、pgTAP の `plan()` 件数・各アサーションの許可/拒否の意味・`describe`/`test` 構造は常に一致する（検証意図の保存 — 変わるのは識別子の参照方法のみ）
- [INV-04] (Gate 3) SQL テンプレでスキーマ識別子を埋め込む変数参照は常に `format('%I', :'var')` イディオム（`:'var'` 値展開をドル引用符 `$$...$$` の外で `format()` に渡し `%I` で識別子化）であり、ドル引用符内に生の変数参照（`:"var"` / `:'var'`）を置く形は現れない（psql の変数展開がドル引用符内で機能しないことを踏まえた正しい識別子注入）
- [INV-05] (Gate 3) RLS correctness の検証経路は常に anon key + 実ユーザー session であり、`service_role` / 特権サーバキーを使う経路・default・例示はテンプレに存在しない（service_role 非使用の保存）
- [INV-06] (Gate 4) supabase テンプレは常に manual-copy 配布物であり、CLI（`init`/`update`/`doctor`）の managed file 経路（SPEC-0056 3-way）に載らない（テンプレ変更は既存コピーに追従しない — 境界の保存）

### Pre-conditions
- [PRE-01] (Gate 2) テンプレの本文が変数を参照する前に、参照する全変数がファイル冒頭の設定変数ブロックで default 宣言（SQL: `\set` / TS: `const ... ?? default`）されている（未宣言変数の参照が無い）
- [PRE-02] (Gate 3) 変数化で新設する接続情報の注入先には、特権キー（`service_role`）の default / 例示が含まれない（SEC-02 の前提）

### Post-conditions
- [POST-01] (Gate 2) パラメータ化後の新テンプレは、default 値のまま有効な SQL / TS であり、かつ env / `-v` で対象を差し替えても有効な SQL / TS である（新形式の妥当性 — AC-04 / AC-03）
- [POST-02] (Gate 2) 既にコピー済みの旧ハードコード形テンプレは、本 SPEC 適用後も有効な SQL / TS のまま動作し、テンプレ変更の影響を受けない（manual-copy による非追従性 — FR-08）

### Assumptions
- [ASM-01] (Gate 横断) psql は変数の値展開（`:'var'`）と実行時変数上書き（`-v var=value`）を標準機能として提供し、`format('%I', ...)` は PostgreSQL 標準関数である。psql の変数展開はドル引用符文字列（`$$...$$`）内では機能しないため、`:'var'` はドル引用符の外で `format()` の引数として渡す（Supabase CLI の `supabase test db` が用いる psql を含む。公式 psql "SQL Interpolation" ドキュメントで確認済み）
- [ASM-02] (Gate 横断) 利用者が設定変数ブロックに注入するテーブル名・列名は、利用者が信頼する自スキーマの識別子である（信頼境界の外部入力ではない。ただし `format('%I', ...)` を用いることで、予約語やスペースを含む識別子でもクエリ構造を壊さない — SEC-01）
- [ASM-03] (Gate 横断) supabase テンプレは CLI が管理しない manual-copy 配布物であり、テンプレ内容の変更は SPEC-0056 の managed file hash / 3-way update 経路を通らない（事前調査で `src/cli/managed-files.mjs` / `profile-docs.mjs` に supabase 参照が無いことを確認済み — INV-06 の前提）
- [ASM-04] (Gate 横断) 本リポの CI は実 Postgres / Supabase / ブラウザを起動せず、テンプレの検証は静的（構文健全性・変数集約・env 解決）に限る（NFR-01。実 RLS 挙動は利用者環境の前提）

## 関連ID

- PLAN-ID: [PLAN-0063](../plans/PLAN-0063-rls-parameterized.md)
- TASK-ID: [TASK-0227](../tasks/TASK-0227-sql-template-parameterize.md)（SQL テンプレ変数集約 + 新規テスト作成 — T1）, [TASK-0228](../tasks/TASK-0228-ts-e2e-template-parameterize.md)（TS/E2E テンプレ変数集約 + env fallback + テスト追記 — T2）, [TASK-0229](../tasks/TASK-0229-docs-checklist-mapping-guide.md)（docs 簡素化 + マッピングガイド — T3）
- 参考: SPEC-0056（managed file hash 3-way — manual-copy が対象外である境界の前提）, SPEC-0057（overlay / `ai-check.local.sh` — env 上書きのみでテンプレ変数注入機構が無い裏付け）, SPEC-0058（`.ai-check.yaml` — gate/step 設定でありテンプレ変数注入ではない裏付け）, SPEC-0051（`security:sast` = `semgrep scan --config auto` を変えない — RLS correctness は本テンプレが主担当）
