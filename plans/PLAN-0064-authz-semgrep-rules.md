# PLAN-0064: supabase-rls addon への authz / RLS 無視検出 Semgrep ルール例同梱の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0064 |
| SPEC-ID   | [SPEC-0064](../specs/SPEC-0064-authz-semgrep-rules.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（配布物 = manual-copy 新規ルール YAML `package-templates/supabase/semgrep/authz-rules.yml` の追加。Semgrep 公式 rule schema 準拠の 3 ルール例（service_role 誤用 / 認可なし RLS クエリ / ガードなし TS route）+ 誤検知配慮コメント。**既定 `security:sast` = `semgrep scan --config auto` は不変** = INV-01 / SPEC-0051 保存。`src/cli/` は一切変更しない = INV-06 / スコープ外節）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/supabase-semgrep-rules.test.mjs` を**新規**作成。`tests/cli/` 配下のため現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs` に自動で含まれ package.json 変更不要。YAML schema 妥当性（`ruby -ryaml`、ruby 不在は SKIPPED + grep 代替）+ ルール meta 健全性 + opt-in 適用手順の存在 + 誤検知配慮の記載を集約する）
- [x] docs（`package-templates/supabase/README.md` に「Semgrep ルール例」節追加、`package-templates/profiles/supabase-rls/README.md` にルール同梱 + opt-in 要約の追記、`package-templates/prompts/security-scan.md` に `authz-rules.yml` 追加適用出力の triage 対象化 + 出発点前提の追記）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `package-templates/supabase/semgrep/authz-rules.yml`（新規） | トップレベル `rules:` の下に 3 ルール例を列挙。(a) `supabase-rls.service-role-client-misuse`（`createClient($URL, $KEY, ...)` + `metavariable-pattern` で `$KEY` が `service_role`/`SERVICE_ROLE_KEY` 由来である疑いを絞る。RLS バイパス疑い）、(b) `supabase-rls.rls-query-without-owner-filter`（`.from(...).select(...)` に所有者フィルタ（`.eq("owner_id"/"user_id", ...)`）や auth コンテキストが付かない形を `patterns` + `pattern-not` で保守的に絞る）、(c) `supabase-rls.route-handler-without-authz-guard`（`export async function GET/POST(...)` 等の TS/Next.js route の典型形に `pattern-inside` を使い、認可 / レート制限ガードが見当たらない疑いを保守的に検出）。各ルールは `id`（一意・namespace 付き）/ `message` / `severity`（Semgrep OSS 有効値 `ERROR`/`WARNING`/`INFO` から選定。検出困難な (c) は `WARNING`/`INFO`）/ `languages`（`[typescript, javascript]`）/ pattern operator を持つ。各ルールに YAML コメントで検出意図・「例（出発点）であり網羅ではない」・`nosemgrep: <id>` 抑制・`paths:`/`pattern-not` チューニング前提を併記（FR-01 / FR-02 / FR-03 / SEC-01 / SEC-03 / INV-03 / INV-05） |
| `package-templates/supabase/README.md` | 既存「SQL identifier injection」節 / `service_role` 非使用注意書き（L101-102 `Do not use service_role ...`）の近傍に「Semgrep ルール例」節を追加。(1)`security:sast` = `semgrep scan --config auto` が変わらないこと、(2)`semgrep scan --config auto --config ./supabase/semgrep/authz-rules.yml` の `--config` **追加**適用コマンド例、(3) ルールが「例（出発点）」で誤検知しうる旨、(4)`nosemgrep: <rule-id>` 抑制、(5)`prompts/security-scan.md` triage への導線を記載。既存 `service_role` 非使用注意書きと整合（英語ベースの既存ドキュメントのため英語で追記 = 言語規約）（FR-04 / FR-06 / SEC-02 / INV-01 / INV-02） |
| `package-templates/profiles/supabase-rls/README.md` | 「Manual-copy templates」節（L71-80）付近に、addon が `supabase/semgrep/authz-rules.yml` を同梱し `--config` 追加で opt-in 適用する旨 + 要約を追記（日本語ドキュメントのため日本語 = 言語規約）（FR-05） |
| `package-templates/prompts/security-scan.md` | 「When To Use」節（L9-14）付近に、`authz-rules.yml` を追加適用した Semgrep 出力も本 triage プロンプトの対象であり、ルールは出発点で誤検知しうる前提で triage する旨を追記（英語で追記）。**既存 triage 本文（Redaction Rules / Findings 表 / decision 分類 fix now / false positive / suppress with owner+expiration / needs human review / Suppression Policy）は不変**（FR-05 / INV-01 のうち triage 契約 (5)） |
| `tests/cli/supabase-semgrep-rules.test.mjs`（新規） | (1) `authz-rules.yml` を読み `ruby -ryaml` でパースして `rules` がリスト・各ルールに `id`/`message`/`severity`/`languages`/pattern operator が揃い、`severity` が `{ERROR, WARNING, INFO}` のいずれかであることを assert。**ruby 不在は `ci-workflows.test.mjs` の `hasRuby()` 先例に倣い SKIPPED とし、grep ベース（`/^\s*rules:/m` / `id:` / `message:` / `severity:` / `languages:` / pattern operator トークン + `severity` 値集合）で代替検証**（AC-01）。(2) ルール件数 3・`id` 一意（namespace 付き）・`languages` が TS/JS・3 意図の id/message を検証（AC-02）。(3) YAML コメントの「例 / 出発点」但し書き + `nosemgrep` + `paths:`/`pattern-not` 言及を grep（AC-03）。(4) README / profile / prompt の追記を grep（AC-04 / AC-05）。読み取り + 静的アサートのみで実 semgrep を回さない（NFR-01 / NFR-02） |

`src/cli/`（`profile-scripts.mjs` / `managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` — ルール YAML を manual-copy のまま保つ）、`package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` を保存 — SPEC-0051 FR-02 / INV-01）、`package-templates/ci-examples/`（SARIF / CI 経路は SPEC-0062）、`package-templates/prompts/rls-permission.md`、`package-templates/supabase/tests/` 配下のテンプレ 3 種（SPEC-0063）、`docs/cli.md`（CLI surface 不変）、`package.json`（新規テストは `tests/cli/` glob 対象のため scripts 変更不要）は変更しない（SPEC File Scope / スコープ外節 / INV-01 / INV-06）。

> 補記（AC-01 の schema 検証設計 = SPEC AC-01 の一次情報源化）: YAML schema 検証は「`ruby -ryaml` でパースして各ルールに 5 必須要素（`id`/`message`/`severity`/`languages`/pattern operator）が揃い、かつ `severity` が Semgrep OSS 有効値集合 `{ERROR, WARNING, INFO}` のいずれかであることを確認する」設計が肝である。**ruby 不在環境では YAML パースを SKIPPED とし、grep ベース（`/^\s*rules:/m` の存在 + 各必須キーの `id:` / `message:` / `severity:` / `languages:` トークン + pattern operator トークン + `severity` 値が有効集合内）で代替検証する**（`ci-workflows.test.mjs` の `hasRuby()` 先例）。この SKIPPED + grep 代替方針は SPEC の AC-01 / NFR-01 / NFR-04 が一次情報源であり、テスト実装はそれに従う。

## 実装方針

1. **ルール YAML 確定 → テスト固定 → docs 化の直列**（SPEC 実装メモ「想定タスク分割と依存順序」T1→T2 を踏襲）。ルール YAML（T1）を先に確定し、同時に新規 `tests/cli/supabase-semgrep-rules.test.mjs` を作成して schema / meta / コメント検証ケースを固定する。次に確定したルール id・ファイルパス・opt-in コマンドを docs 化し（T2）、同一新規テストファイルに docs 検証ケースを**追記**する。docs は確定挙動を文書化する（確定前の仕様を先に書かない = PRE-01）。
2. **T1 → T2 を直列にする根拠（同一新規テストファイルへの追記 + docs が rule id / path に依存）**: T1 が新規作成する `tests/cli/supabase-semgrep-rules.test.mjs` に、T2 が docs 検証ケースを**追記**するため、同一ファイルへの逐次追記となり並列不可。加えて T2 の docs 内容（`nosemgrep: <rule-id>` の実 id、`--config ./supabase/semgrep/authz-rules.yml` の実 path、opt-in コマンド）は T1 のルール確定に依存する（PRE-01）。コミット順を「ルール YAML + テスト作成 → docs 追記 + テスト追記」に固定して決定的にする。
3. **Semgrep pattern の実ドキュメント照合（SEC-01 / PRE-02 / ASM-01 / src-rules.md AI Output Verification / リスク1）**: pattern operator（`pattern` / `patterns` / `pattern-either` / `pattern-regex` / `metavariable-pattern` / `pattern-inside` / `pattern-not`）・`severity` の有効値（`ERROR` / `WARNING` / `INFO`。`HIGH`/`CRITICAL` は AppSec Platform 用でありコミュニティ rule の `severity:` には使えない）・`languages` の綴り（`typescript` / `javascript` / `ts` / `js`）が Semgrep 公式 rule syntax の標準要素であることを、T1 実装時に Semgrep 公式 rule-syntax ドキュメントで照合してから確定する（幻覚フラグ混入防止。**確認日を TASK 実行ログ / レビューに記録する**）。照合した構文をルール YAML コメント + README に残す。
4. **保守的な pattern（誤検知で導入が萎えない / SEC-01 / リスク2）**: 3 ルールは明確なアンチパターンに限定する（FR-02）。(a) は `metavariable-pattern` で `$KEY` を `service_role`/`SERVICE_ROLE_KEY` 由来に絞る。(b) は `pattern-not` で所有者フィルタ付きの正当な形を除外する。(c) は TS/Next.js route の典型形に限定し「これは出発点であり網羅ではない」と明記する（言語非依存・フレームワーク非依存のレート制限検出はしない = スコープ外）。既定 gate に組み込まないことで、過剰検出が全利用者の `security:sast`（`--config auto` のみ）を壊す経路を構造的に作らない（INV-01 / SEC-01）。
5. **静的検証に限定（NFR-01 / ASM-04）**: 本リポ CI は利用者コードに対する実 Semgrep スキャンを回さない。テストは (a) YAML schema 妥当性（`ruby -ryaml` パース + grep 代替。`severity` 値集合検証含む）、(b) ルール meta 健全性（件数 3・id 一意・languages TS/JS）、(c) YAML コメントの誤検知配慮記載、(d) README / profile / prompt の追記 grep、に限る。**実際に Semgrep がアンチパターンを検出する / 誤検知しない挙動の検証はスコープ外**（利用者コード依存 + semgrep バイナリ依存 = NFR-01 / ASM-04）。新規 npm 依存（YAML パーサ・rule linter・semgrep devDependency）はゼロで、`node:` 標準 + 文字列読取 + 正規表現 + `ruby -ryaml`（既存 `ci-workflows.test.mjs` 先例）で検証する（NFR-02）。
6. **依存ゼロ維持（NFR-02）**: ルール同梱・検証は既存前提（semgrep は利用者側 SAST、`ruby -ryaml` は既存 `ci-workflows.test.mjs` の先例、`node:` 標準）のみで行う。`package.json` の runtime / dev dependencies を変えない（検証: `tests/cli/package.test.mjs` の runtime dependencies 検査が継続 pass）。
7. **依存 SPEC の再確認（リスク3 / ASM-03 / INV-01 / INV-06）**: 本 PLAN 起票時に SPEC-0051（`security:sast` = `semgrep scan --config auto`）・SPEC-0056（3-way managed file）・SPEC-0062（SARIF opt-in）の境界を再確認した。事前調査で `src/cli/` に supabase / semgrep 参照が無く（SPEC 事前調査で確認済み）、ルール YAML は manual-copy 配布物であることを確認済み。したがってルール YAML の追加は SPEC-0056 の 3-way 経路を通らず、既定 gate（`security:sast`）を変えない。カスタムルールは opt-in（`--config` 追加）に留める（INV-01）。SPEC-0062 の SARIF 経路（`ci-examples/`）は本 SPEC で触らない。

### 案A vs 案B の比較（SPEC 確定案の再掲と PLAN 判断）

SPEC は**案A（ルール YAML を `package-templates/supabase/semgrep/authz-rules.yml` に「例（出発点）」として同梱し、既定 `security:sast`（`--config auto`）は変えず、利用者が `--config ./supabase/semgrep/authz-rules.yml` を**追加**する opt-in 手順を docs に記載する）**を確定済み。PLAN でもこれを踏襲する。

| 観点 | 案A: opt-in（`--config` 追加）で例示配布（採用） | 案B: 既定 `security:sast` へ組み込み（`--config auto --config <path>`）（不採用） |
|---|---|---|
| SPEC-0051 契約との整合 | ◎ `security:sast` = `semgrep scan --config auto` を不変に保つ（FR-02 / INV-01 保存） | ✗ `security:sast` を書き換え SPEC-0051 FR-02 / INV-01 に反する（契約違反） |
| 既定 CI の安全性 | ◎ 未成熟なカスタムルールが全利用者の CI を壊さない（既定 gate 不変 = SEC-01） | ✗ auto ルールと異なるチューニング要求の未成熟ルールで全利用者の CI を壊すリスク |
| 誤検知への対処余地 | ◎ 利用者が triage（`security-scan.md`）+ `nosemgrep`/`paths:`/`pattern-not` でチューニングして自 gate に取り込むかを選べる | △ 誤検知が既定で降ってくるため利用者が抑制を強制される |
| manual-copy 制約との整合 | ◎ ルール YAML を manual-copy 配布物として同梱するだけ。CLI 管理化不要（INV-06） | △ 既定組み込みには CLI 経路 or profile script 変更が必要で `src/cli/` を触る |
| SPEC-0062 方針との整合 | ◎ SARIF を「opt-in コメント雛形」で解禁したのと同じ「既定を壊さない追加」方針 | ✗ 「既定を壊さない追加」方針から外れる |

**PLAN 判断**: 案A を採用する。案B（既定組み込み）は SPEC-0051 FR-02 / INV-01 に反し、未成熟なカスタムルールで全利用者の CI を壊すリスクを負うため不採用。ただしルール例が dogfooding / 利用者要望で「既定 gate に組み込むほど誤検知が少なく有用」と実証されたら、別 SPEC で `security:sast` への opt-in 組み込み手段（例: `.ai-check.yaml` 経由の追加 config / profile オプション）を additive に検討する（OPS-02）。本 PLAN の opt-in 提供は将来の既定組み込みへの移行余地を塞がない（SPEC 契約 (4)）。

代替案比較（テスト配置）:
- **`tests/templates/` に置く案**: 不採用。現行 `package.json` の `test` = `node --test tests/cli/*.test.mjs` は `tests/cli/` 配下のみを実行対象とするため、`tests/templates/` に置くと glob 非対象で CI 未実行になる。`tests/cli/supabase-semgrep-rules.test.mjs` に置けば package.json 変更なしで既存 test に組み込まれ、`make validate` → validate-cli（Makefile 内 `node --test tests/cli/*.test.mjs`）経由で本リポ CI に自動包含される（SPEC File Scope の配置理由）。
- **既存テストファイルに相乗り案**: 不採用。Semgrep ルール検証は新規の観点（YAML schema・ルール meta・誤検知配慮）で、既存 `tests/cli/*.test.mjs` の責務と混ざる。専用ファイル 1 本に集約して責務を分ける。

## T1/T2 分割・直列判断（Planning Agent 確定）

**確定: SPEC 実装メモの T1（ルール YAML + schema/meta/コメント検証テスト）/ T2（docs 導線追記 + docs 検証テスト）分割を踏襲し、TASK-0230（ルール YAML + テスト作成）→ TASK-0231（docs + テスト追記）に採番する。T1→T2 は直列。**

分割根拠（レビュー観点差 + テスト基盤共有 + docs 依存の 3 軸）:

1. **レビュー責務（Gate 観点）が rule YAML と docs で異なる**: ルール YAML（TASK-0230）は **Gate 2: Functional の Semgrep rule syntax 妥当性（AI Output Verification / PRE-02）** が主観点で、Semgrep 公式 rule-syntax ドキュメント照合（`severity` の有効値含む）を伴う。docs（TASK-0231）は **Gate 3: Security の SEC-02（service_role 非使用）+ Gate 1 の既定 gate 不変（`security:sast` = `--config auto`）= SPEC-0051 保存** が主観点で、外部 rule syntax 照合は伴わない。同一タスクに混ぜると Semgrep 構文レビューと既定 gate 保存 / service_role 非使用レビューが 1 コミットに同居し、レビュー単位が肥大化する。独立コミットにすることで検証観点が 1:1 で観測しやすくなる。
2. **T1→T2 を直列にする決定的理由（テスト基盤共有 + docs 依存）**: T1 が新規作成する `tests/cli/supabase-semgrep-rules.test.mjs` に、T2 が docs 検証ケースを**追記**する。同一新規ファイルへの逐次追記のため並列不可（同一ファイルへの並行追記を避ける — CLAUDE.md「同一 worktree で並行実行しない」の精神）。加えて T2 の docs に書く rule id（`nosemgrep: <rule-id>`）・ファイルパス（`--config ./supabase/semgrep/authz-rules.yml`）は T1 のルール確定に依存する（PRE-01: 未確定値を docs に書かない）。コミット順を「ルール YAML + テスト作成 → docs 追記 + テスト追記」に固定して決定的にする。
3. **File Scope が（本体は）互いに素**: TASK-0230 は `authz-rules.yml`（新規）+ 新規 test（作成）、TASK-0231 は 3 つの docs + 新規 test（追記）を触る。ルール YAML 本体と docs は素で、共有するのはテスト基盤（新規 mjs）のみ。各 File Scope は 10 ファイル未満で AP-02（Big Bang Prompt）の 20 ファイル閾値に抵触しない。

反証の検討（T1/T2 を 1 タスクに統合する可能性）: 「ルール YAML と docs は同じ SPEC の一連の追加」という統合論は成立しうるが、上記 1（Semgrep 構文照合 vs 既定 gate 保存 / service_role 非使用の Gate 観点差）が「実質同じレビュー単位ではない」ことを示す。特に Semgrep 公式 rule-syntax 照合（PRE-02 / ASM-01 / SEC-01 / `severity` の有効値確認）はルール YAML 固有の verification ステップであり、これを docs の既定 gate 保存 / service_role 非使用レビューと束ねると「無効 `severity`（`HIGH`/`CRITICAL`）や幻覚 pattern の照合漏れ」が「docs 追記」に紛れて見落とされるリスクがある。したがって分割を確定する。SPEC 実装メモも「T1 は Gate 2、T2 は Gate 3 と検証観点が異なり独立コミットで観測しやすい」として分割を推奨している。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0230 | ルール YAML（`package-templates/supabase/semgrep/authz-rules.yml`）の作成（3 ルール例 + 誤検知配慮コメント）+ 新規 `tests/cli/supabase-semgrep-rules.test.mjs` 作成（YAML schema 妥当性 + ルール meta 健全性 + 誤検知配慮コメントの検証ケース）。Semgrep 公式 rule syntax（pattern operator / `severity` 有効値 / `languages` 綴り）の照合を含む（SPEC T1） | Implementation | 3h | なし | No（TASK-0231 が同一新規テストファイルに追記） |
| TASK-0231 | ドキュメント更新（`supabase/README.md` の「Semgrep ルール例」節 + `profiles/supabase-rls/README.md` / `prompts/security-scan.md` の導線追記）+ 新規テストへの docs 検証ケース追記（opt-in 適用手順の存在 + 導線）（SPEC T2） | Implementation | 2h | TASK-0230 | No |

### AC 対応

- **TASK-0230** → AC-01（`authz-rules.yml` が存在し `rules:` トップレベル + 各ルールに `id`/`message`/`severity`/`languages`/pattern operator が揃う。`ruby -ryaml` パース or grep 代替。`severity` が `{ERROR, WARNING, INFO}` のいずれか — 無効値 `HIGH`/`CRITICAL` を弾く）、AC-02（ルール件数 3・`id` 一意（namespace 付き）・`languages` TS/JS・3 意図（service_role 誤用 / 認可なし RLS クエリ / route handler）の id/message）、AC-03（各ルールに「例 / 出発点」但し書き + `nosemgrep` 抑制 + `paths:`/`pattern-not` チューニング前提のコメント）。FR-01 / FR-02 / FR-03 / SEC-01 / SEC-03 / INV-03 / INV-05 / PRE-02 / POST-01。
- **TASK-0231** → AC-04（`supabase/README.md` に opt-in 適用手順 — (1)`config auto` 不変 (2)`--config ./supabase/semgrep/authz-rules.yml` 追加コマンド (3) 出発点 / 誤検知しうる旨 (4)`nosemgrep: <rule-id>` 抑制 (5)`security-scan.md` triage 導線。`service_role` 非使用注意書きと整合）、AC-05（`profiles/supabase-rls/README.md` に `authz-rules.yml` 同梱 + opt-in 要約、`prompts/security-scan.md` に `authz-rules.yml` 追加適用出力の triage 対象化 + 出発点前提。既存 triage 分類ロジック無変更）。FR-04 / FR-05 / FR-06 / SEC-02 / INV-01 / INV-02 / POST-02。
- **AC-03 の docs 側**（`nosemgrep` 抑制の README 記載）は AC-04 に含まれ TASK-0231 が担うが、YAML コメント側の `nosemgrep` 記載は TASK-0230 が担う（AC-03 は unit + docs にまたがるため両 TASK に配分）。
- **全テストパス**（既存 `node --test tests/cli/*.test.mjs` 全件無修正 pass = NFR-01 後方互換）は全 TASK 共通の完了条件で、Round 全体の最終確認は `tasks/done-def-SPEC-0064-round-1.md` の Functional Gate で行う。

### NFR-04 分岐対応

各新規追加要素は最低 1 テストケースで固定する:
- YAML schema 妥当性（`rules:` + 各ルールの必須キー + `severity` 有効値）= TASK-0230（ルール YAML + テストケース。ruby 不在は SKIPPED + grep 代替）
- ルール meta 健全性（件数 3・id 一意・languages TS/JS）= TASK-0230
- 誤検知配慮コメント（「例 / 出発点」+ `nosemgrep` + `paths:`/`pattern-not`）= TASK-0230
- opt-in 適用手順の存在（README の `--config` 追加 + `authz-rules.yml` path + `config auto` 不変 + `nosemgrep` + `security-scan` 導線）= TASK-0231
- 導線追記（profile README の `authz-rules.yml` 同梱 + security-scan.md の triage 対象化）= TASK-0231

### 依存グラフ

```
TASK-0230 (ルール YAML + 新規テスト作成)
    │  同一新規テストファイルへの追記 + docs が rule id/path に依存するため直列
    ▼
TASK-0231 (docs 3 ファイル + テスト追記)
```

TASK-0230 → TASK-0231 は直列。TASK-0231 の docs 内容が TASK-0230 のルール確定（rule id・ファイルパス・opt-in コマンド）に依存し（PRE-01）、かつ同一新規テストファイルへの逐次追記のため並列不可。各 TASK は独立コミット（commit message に TASK-ID 必須 = commit-msg hook 強制 = AP-05 対策）。

反証（テストファイル分割による並列化の棄却）: 新規テストを `*-yaml.test.mjs` / `*-docs.test.mjs` に分割すれば TASK-0230/0231 の File Scope は素になり並列化できるが、本 PLAN は採らない。理由: (a) Semgrep ルール検証という単一検証観点を 2 ファイルに分散させると AC-01〜AC-05 の一体レビュー窓口が失われる、(b) 新規ファイル数を増やし単純さ（NFR-02 の最小変更方針）を損なう、(c) docs は依然として rule id / path（T1 確定値）に依存するため PRE-01 の直列制約は解消されない。テスト基盤は 1 ファイルに集約し直列運用する。

## リスク

- リスク1（SPEC リスク1）: Semgrep の rule syntax（pattern operator / `metavariable-pattern` / `severity` の値 / `languages` の綴り）が利用者の semgrep バージョンで期待どおり動かない、または pattern が幻覚で無効構文になる → 軽減策: pattern は Semgrep 公式 rule syntax（`rules:` トップレベル / `id`・`message`・`severity`・`languages`・pattern operator の必須性 / `severity` は Semgrep OSS 有効値 `ERROR`/`WARNING`/`INFO`。`HIGH`/`CRITICAL` は AppSec Platform 用の表示分類でありコミュニティ rule の `severity:` には使えない / `languages` は `typescript`/`javascript`/`ts`/`js`）に照合してから確定する（TASK-0230 実装時に公式 rule-syntax ドキュメントで確認し**確認日を実行ログ / レビューに記録** — src-rules.md AI Output Verification / PRE-02 / ASM-01）。ルールは opt-in で、利用者が自由に編集・除去できる。schema 妥当性は AC-01 で `ruby -ryaml` パース（+ grep 代替）+ `severity` 値集合検証により固定する。**残存リスクの透明化**: 本リポ CI では実 semgrep を回さないため pattern の**意味的**妥当性（実際にアンチパターンを検出する / 誤検知しない）はテストで担保できず、レビュー + 実装者の公式ドキュメント照合（PRE-02）に依存する（AP-06 部分残存リスク。将来 semgrep バイナリが本リポ CI にあれば `semgrep --validate` を additive に追加可能 — 知識管理要約に明記）。
- リスク2（SPEC リスク2）: ルールが過剰検出し、利用者の `--config` 追加適用で大量の誤検知が出て導入が萎える → 軽減策: 明確なアンチパターンに限定し（FR-02。(a) は `metavariable-pattern` で service_role 由来に絞る、(b) は `pattern-not` で所有者フィルタ付きを除外、(c) は TS/Next.js route の典型形に限定）、`pattern-not` / `paths:` でのチューニング前提と `nosemgrep` 抑制を明記（FR-03 / AC-03）。既定 gate に組み込まないため全利用者の CI は壊れない（SEC-01 / INV-01）。誤検知事例は OPS-01 で観測し、閾値超過でルール絞り込み / 除去を別 SPEC 化する。
- リスク3（SPEC リスク3）: 実装者が便利さから `security:sast` を `--config auto --config <path>` に変えて既定に組み込む → 軽減策: SPEC-0051 FR-02 / INV-01 保存を Forbidden Shortcuts + AC-04（`config auto` 不変記載）+ File Scope 外変更検出（`templates/hooks/check-file-scope.sh`）で機械ガードする。`package.scripts.fragment.json` / `profile-scripts.mjs` に触れたら設計ミスとして立ち止まる（触れる必要が出たら「opt-in で追加」の前提が崩れた設計ミス — 既存実装との衝突点）。
- リスク4（SPEC リスク4）: ルール (a) の記述で `service_role` を使う「正しい例」を混入させ、検出したいアンチパターンを推奨してしまう → 軽減策: ルールは service_role 誤用を**検出する側**で、YAML / docs に service_role 使用の推奨・実値を書かない（SEC-02 / INV-04）。pattern が参照する env 名（`SUPABASE_SERVICE_ROLE_KEY` 等）は名前のみで値は書かない（SEC-03）。既存テンプレの anon key + user session 経路（「service-role bypass warning」）との整合を AC-04 レビューで確認する。
- リスク5（SPEC リスク5）: ルール YAML が「網羅的な authz チェック」と誤解され、利用者がこれだけで安全と思い込む → 軽減策: 「例（出発点）であり網羅ではない」を YAML コメント + README（FR-03 / FR-04 / AC-03）に明記する（AC-03 の但し書き存在検証でガード）。RLS correctness の主担当はテンプレ（pgTAP / integration）であり Semgrep は補助、という SPEC-0051 / SPEC-0063 の責務分界を README で示す。
- リスク6（SPEC リスク6）: 機構を撤去する必要が生じた場合 → 軽減策: 変更はルール YAML + docs + 新規テストに閉じ（`src/cli/` / 既定 gate 不変 = INV-01 / INV-06）、ルール YAML を除去し docs の該当節を戻せば現行に戻る。opt-in ゆえ `--config` を追加していない利用者への影響はゼロ。手順: TASK-0230〜0231 の commit を **逆順**（TASK-0231 → TASK-0230）で `git revert` し `node --test tests/cli/*.test.mjs` で復旧確認（`tests/cli/supabase-semgrep-rules.test.mjs` への逐次追記のため revert 順序が重要）。
- 実装リスク7: 新規 `tests/cli/supabase-semgrep-rules.test.mjs` の grep 代替（ruby 不在時）が緩すぎて無効 YAML を見逃す、または厳しすぎて有効 YAML を誤って fail させる → 軽減策: grep 代替は「`/^\s*rules:/m` の存在 + 各ルールの `id:` / `message:` / `severity:` / `languages:` トークン数が件数と整合 + pattern operator トークン存在 + `severity` 値が有効集合内」で構成し、`ruby -ryaml` パス時（正）と grep 代替時（ruby 不在）で同一の AC-01 結論に到達するよう設計する。この SKIPPED + grep 代替方針は SPEC AC-01 / NFR-01 / NFR-04 が一次情報源（`ci-workflows.test.mjs` の `hasRuby()` 先例踏襲）。TASK-0230 で確立する。

## 必要な検証

- [x] unit test（YAML schema 妥当性 = AC-01 / FR-01 / NFR-01（`ruby -ryaml` パース + ruby 不在 SKIPPED + grep 代替 + `severity` 値集合検証）、ルール meta 健全性 = AC-02 / FR-02（件数 3・id 一意・languages TS/JS）、誤検知配慮コメント = AC-03 / FR-03 / SEC-01。`tests/cli/supabase-semgrep-rules.test.mjs` 新規）
- [x] integration test（YAML パース健全性 = AC-01、docs 追記の存在 = AC-04 / AC-05、既存 `node --test tests/cli/*.test.mjs` 全件無修正 pass = NFR-01 後方互換 / INV-01 / INV-02 / INV-03 / PRE-01 / POST-01 / POST-02。新規テスト + 既存全件）
- [x] security scan（Gate 3: ルール YAML / README / prompt に `service_role` 使用の推奨・実値・実在 secret / 本番 URL / 本番 email が無い = SEC-02 / SEC-03 / INV-04、env 名は名前のみ、例示は非機密プレースホルダ（`app_items` / `127.0.0.1` / `.test`）。ルールは opt-in で既定 gate 不変 = SEC-01 / INV-01。`bash scripts/sage-validate.sh` 範囲、`rg "TODO|FIXME"` 新規マーカー不在、新規 npm 依存なし = NFR-02（`tests/cli/package.test.mjs` の dependencies 検査）。Semgrep 公式 rule-syntax 照合済み確認 = PRE-02 / ASM-01）
- [x] e2e test（**N/A**: 理由 = 観測面は「ルール YAML ファイルの内容」と「README / prompt の追記内容」で、本リポ CI では利用者コードに対する実 Semgrep スキャンを回さない（NFR-01 / ASM-04）。実際の検出 / 誤検知挙動は利用者環境 + semgrep バイナリ依存でスコープ外節に明記。ルールの正しさは静的検証（YAML schema 妥当性・meta 健全性・docs の記載）+ Semgrep 公式 rule-syntax 照合で担保する。pattern の**意味的**妥当性はレビュー + 実装者照合に依存する残存リスクを知識管理要約に透明化する）
- [x] architecture boundary check（Gate 4: File Scope 外の無変更確認 — `src/cli/`（`profile-scripts.mjs` / `managed-files.mjs` / `init.mjs` / `update.mjs` / `doctor.mjs` — manual-copy 境界保存 = INV-06 / ASM-03）/ `package-templates/package.scripts.fragment.json` / `src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` 不変 = SPEC-0051 / INV-01 / スコープ外節）/ `package-templates/ci-examples/`（SARIF / CI 経路は SPEC-0062）/ `package-templates/prompts/rls-permission.md` / `package-templates/supabase/tests/` テンプレ 3 種（SPEC-0063）/ `package.json`（新規テストは `tests/cli/` glob 対象のため scripts 無変更）/ `docs/cli.md`（CLI surface 不変）/ 他 profile README の diff がゼロ。本リポ root `CLAUDE.md` / `.claude/rules/` / `sage/` 無変更）

## 知識管理要約

- 各 TASK 実装中の想定外エラーは担当 Agent が TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX 形式で記録する（`sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。ルール誤検知の事例（明確なアンチパターンでないコードを誤検出 / 利用者が `nosemgrep`・`paths:` で抑制せざるを得なかった）を記録する際は症状欄冒頭に原因タグ『semgrep: authz ルール誤検知』（固定文字列・表記ゆれ禁止）を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01。原因タグは cause enum を置き換えず補助的に追加する。判定: 次マイナーバージョン PLAN 起票時に `grep -c 'semgrep: authz ルール誤検知' sage/failures.md` で機械確認、3 回累積で `pattern-not`/`paths:` 追加による絞り込みまたはルール除去を別 SPEC 起票）。
- 「`security:sast` = `semgrep scan --config auto` を既定として保存し、カスタムルールは opt-in（`--config` 追加）で提供する」は SPEC-0051（FR-02 / INV-01）・SPEC-0062（SARIF を opt-in コメント雛形で解禁）で確立した「既定を壊さない追加」パターンの継続であり、新規パターンではない。破ると未成熟なカスタムルールが全利用者の CI を壊すため、Forbidden Shortcuts / AC-04 で既定 gate 不変をガードする（INV-01）。
- 「manual-copy 配布物は SPEC-0056 の 3-way managed file 経路の対象外」は SPEC-0063 で確認済みの既知境界。ルール YAML も同一境界に置き、CLI 管理化しない（`src/cli/` 不変 = INV-06 / ASM-03）。破ると「ルールを変えたのに利用者に届く/届かない」の期待違いが起きる。
- 「Semgrep pattern は幻覚で無効構文になりうる」は AI Output Verification の対象。pattern を公式 rule syntax に照合し（PRE-02、確認日を記録）、AC-01 の schema 妥当性検証（`ruby -ryaml` パース + grep 代替 + `severity` 値集合検証）でガードする。**残存リスクの透明化（AP-06 部分残存）**: 本リポ CI では実 semgrep を回さないため pattern の**意味的**妥当性（実際にアンチパターンを検出する / 誤検知しない）はテストで担保できず、レビュー + 実装者の公式ドキュメント照合（PRE-02）に依存する。将来 semgrep バイナリが本リポ CI で利用可能になれば `semgrep --validate`（ルール自体の構文検証）を additive に追加してこの残存リスクを縮小できる（別 SPEC で検討可能。本 SPEC の opt-in / 静的検証方針を破らない additive 変更）。
- 本 PLAN は CLAUDE.md 本体 / `.claude/rules/*.md` / `sage/` を変更しない（SPEC 知識管理節のとおり。理由: authz / RLS 向け Semgrep ルール例の同梱は配布物 `package-templates/supabase/` の内容追加で本リポの開発運用ルールに影響しない。配布物の一次情報源は `package-templates/supabase/README.md` / `profiles/supabase-rls/README.md` / `package-templates/.claude/README.md` で CLAUDE.md / `ai-check-template.md` は既に参照型。CLI surface 不変なので `docs/cli.md` も対象外。sage-managed 保護対象のため将来変更が必要と判明した場合は human approval を得て別 TASK 起票）。
- テスト期待値は SPEC 契約節から導出し、AC-N 参照をテストケース名に付す（テストケース名は日本語 = 言語規約）。

## 段階採用 / ロールバック

- 影響ゼロ（後方互換）: `--config` を追加しない利用者の観測可能な挙動（`security:sast` = `semgrep scan --config auto`、`ai:check:secure` の 4-step chain）は本 SPEC 適用前と同一である（INV-02 / POST-02）。ルール YAML の追加は `package-templates/supabase/semgrep/` の新規ファイルと 3 docs の追記に閉じ、`src/cli/` / `package.scripts.fragment.json` を変えない（INV-01 / INV-06 / POST-02）。ルール YAML は npm 同梱される（`package.json` `files` に `package-templates/` を含むため）が、既定挙動には影響しない（opt-in）。
- 段階採用: ルールは opt-in（`--config ./supabase/semgrep/authz-rules.yml` 追加）でのみ適用される。利用者は triage（`security-scan.md`）+ `nosemgrep`/`paths:`/`pattern-not` でチューニングして自 gate に取り込むかを選べる。TS/JS 以外のコードベース（Python / Go 等）ではルールの `languages`（TS/JS）により対象外となり、誤って他言語に適用されない（境界ケース1 / AC-02）。semgrep バイナリ不在環境では `--config` 追加コマンド自体が動かないが、これは既定 `security:sast` も同様で本 SPEC の新規問題ではない（SPEC-0051 スコープ外「scanner の自動 install」の既知前提 / 境界ケース2）。
- ロールバック: 追加はルール YAML（新規）+ docs 追記 + 新規テストのみのため、ルール YAML を除去し docs の該当節を戻せば現行に戻る（TASK-0230〜0231 の commit を **逆順**（TASK-0231 → TASK-0230）で `git revert` し `node --test tests/cli/*.test.mjs` で復旧確認。`tests/cli/supabase-semgrep-rules.test.mjs` への逐次追記のため revert 順序が重要）。`src/cli/` を触らない（INV-01 / INV-06）ため撤去の影響範囲がルール YAML + docs + 新規テストに閉じる。`security:sast`（SPEC-0051）/ `ci-examples/`・SARIF（SPEC-0062）/ 他 profile / CLI surface は不変。
- ロールバック後の利用者影響: 既に `authz-rules.yml` を自プロジェクトにコピーして `--config` に追加した利用者環境のファイルは利用者のコミット下にあり、本パッケージのロールバックでは変更されない（manual-copy ゆえ配布物の revert は利用者リポの committed ファイルに遡及しない = INV-06）。opt-in ゆえ `--config` を追加していない利用者への影響は元からゼロ。
- 観測: v1 リリース後 1 リリースサイクル、「明確なアンチパターンでないコードを誤検出した」「利用者が `nosemgrep`/`paths:` で抑制せざるを得なかった」事例を `sage/failures.md`（原因タグ『semgrep: authz ルール誤検知』）で観測する（OPS-01）。3 回累積で `pattern-not`/`paths:` 追加による絞り込みまたはルール除去を別 SPEC 起票。ルール例が dogfooding / 利用者要望で「既定 gate に組み込むほど誤検知が少なく有用」と実証されたら、別 SPEC で `security:sast` への opt-in 組み込み手段（`.ai-check.yaml` 経由の追加 config / profile オプション）を additive 検討する（OPS-02。案A opt-in は案B 既定組み込みへの移行余地を塞がない = 契約 (4)）。
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（`security:sast` 変更禁止・`src/cli/` 変更禁止・無効 Semgrep 構文コミット禁止・`service_role` 混入禁止・secret 例示禁止・既定 gate への過剰検出ルール混入禁止・「例（出発点）」但し書き省略禁止・`ci-examples/` / SARIF 変更禁止・`rls-permission.md` / supabase テンプレ 3 種変更禁止・npm 依存追加禁止・File Scope 外変更禁止・TASK-ID 欠落コミット禁止）は AC-01〜AC-05 + 既存 dependencies 検査 + File Scope hook + レビューの機械/手動ガードで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを主軸に採用。ただし pattern の意味的妥当性はレビュー依存の残存リスクを知識管理要約に透明化）、CLAUDE.md / `ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり）。
