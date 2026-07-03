# SPEC-0060: profile 合成（base + addon）の合成規則の仕様化と回帰固定

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0060 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0005（profiles の出自）、SPEC-0020（profile state）、SPEC-0043（supabase-rls addon の出自）、SPEC-0030（profile doc 移行 — `getProfileDocFiles` の出自）、SPEC-0056（managed files 列挙 — `getManagedFiles` の profile 依存部分） |
| 権限レベル | platform |

## 背景・目的

CLI は `--profile react-nextjs+supabase-rls` のような **base + addon** の profile 合成を受け付けるが、その合成規則（マージ順・同名キー競合時の挙動・複数 addon の扱い）は**実装の偶然に依存しており、仕様として明文化されていない**。事前調査（2026-07-03、`src/cli/` 現行実装）で確認した現状は次のとおり:

- **パーサ（`src/cli/profile.mjs` `parseProfiles`）は複数 addon 構文を既に許容している**。入力は `[,+]` で分割されるため `base+addon1+addon2` 形式は構文レベルで通り、`base` 1 件（ちょうど 1 つでなければ CliError）、`addons`（宣言順を保持した配列）、重複指定は CliError、未知名は CliError、という規則が既に実装されている。ただしこの規則はテストで固定されておらず、docs にも「複数 addon 可」の記載が無い
- **scripts のマージ（`src/cli/profile-scripts.mjs` `getProfileScripts`）は base → addon 宣言順の `Object.assign` であり、同名 script キーは後勝ち（addon が base を silent に上書き）**。現在 addon は `supabase-rls` のみで、その script キー（`test:db` / `test:integration:rls`）はどの base のキーとも衝突しないため、上書きは一度も発火していない = 競合時挙動は「未定義（実装の偶然）」である。加えて `ADDON_CHECK_STEPS` により addon の step が `ai:check` の末尾に `&&` 連結で追記され、`appendScriptStep` が重複 step を排除する
- **support scripts（`getProfileSupportScripts`）**は base の support scripts + package manager 別 security support scripts の合成のみで、addon は support scripts を一切寄与しない（これも仕様として明文化されていない）
- **profile docs（`src/cli/profile-docs.mjs` `getProfileDocFiles`）**は共通 docs + base README + addon README（宣言順）の追記型合成、**managed files（`src/cli/managed-files.mjs` `getManagedFiles`）**の profile 依存部分は `getProfileDocFiles` 経由のみである
- 既存テストでは `tests/cli/managed-files.test.mjs` が 8 profile × ci 3 × claudeHooks 2 × reviewTemplates 2 の 96 組合せで「managed 一覧に overlay / config が現れない」ことのみを検証しており、**合成結果そのもの（scripts / support scripts / doc files / managed files の内容）を固定する回帰ガードは存在しない**

将来 addon を追加する際（依頼 #6 系の custom profile も含む）、この未定義な競合挙動の上に規則が事後的に「できてしまう」ことが最大のリスクである。本 SPEC は次の 4 点を行う:

1. **合成規則の正式仕様化**: base 1 つ + addon 0 個以上、scripts のマージ順は base → addon 宣言順、**同名 script キーの競合はエラー**（現行の「silent 後勝ち」は一度も発火していない未定義挙動のため、安全側 = fail-fast に確定する。現在の全組合せで競合は存在しないため、観測可能な CLI 挙動は不変）
2. **複数 addon の受け入れ準備**: パーサが既に許容する `base+addon1+addon2` 構文の規則（宣言順マージ・重複指定エラー・同名キー競合エラー）をテストで固定し、将来 addon 追加時に規則が変わらないことを保証する
3. **合成結果のスナップショット固定**: 全 base（4）× addon 部分集合（現状 {} / {supabase-rls} の 2）= 8 組合せについて `getProfileScripts()` / `getProfileSupportScripts()` / `getProfileDocFiles()` / `getManagedFiles()` の合成結果を committed fixture と照合する回帰ガードを追加する
4. **docs/cli.md への合成規則の明文化**（マージ順・競合時挙動・addon 一覧・複数 addon 構文）

## 対象ユーザー

- 将来 addon profile を追加する本リポ maintainer — 合成規則が SPEC + テストで固定され、追加時に規則を再発明・暗黙変更しない
- `--profile base+addon` を使う CLI 利用者 — docs で合成規則（何がマージされ、競合時どうなるか）を確認できる。既存の観測可能な挙動は不変
- Review Agent / CI — 意図しない合成結果の変化（script 内容・doc 一覧・managed 一覧の変化）をスナップショットテストで機械検出する

**parseProfiles の base 個数検証（実装根拠）**: `src/cli/profile.mjs` `parseProfiles` は分割結果のうち base 分類に一致する要素数をカウントし、0 件（addon 単独指定）または 2 件以上（base 重複）で CliError を投げる実装が既に存在する（AC-02 (a)(b) の根拠）。

## スコープ（含む）

- 合成規則の正式仕様化（本 SPEC 契約節）: profile 文法（`,` / `+` 区切り、base ちょうど 1 + addon 0 個以上、宣言順保持、重複・未知名はエラー）、scripts 合成（base → addon 宣言順、`ADDON_CHECK_STEPS` の `ai:check` への追記 + 重複 step 排除、同名 script キー競合は CliError）、support scripts 合成（base + security のみ、addon 寄与なし）、doc files 合成（共通 + base README + addon README 宣言順）
- `src/cli/profile-scripts.mjs` の最小変更: addon マージ時の同名 script キー検出を追加し、base のキーまたは先行 addon のキーと衝突した場合に衝突キー・衝突元を含む CliError を投げる（唯一の挙動変更。現行の全 profile 組合せでは発火しない）
- `parseProfiles` の複数 addon 構文・エラー系のテスト固定（実装変更なし。現行規則をテストで固定する）
- スナップショット回帰ガード: 全 base × addon 組合せ（現状 8）× 4 関数（`getProfileScripts` / `getProfileSupportScripts` / `getProfileDocFiles` / `getManagedFiles`）の合成結果を committed fixture（JSON）と完全一致で照合する新規テスト。組合せ列挙は `supportedProfiles` の分類から機械生成し、addon 追加時に fixture 未更新なら自動で fail する
- `docs/cli.md` への合成規則節の追加（マージ順・競合時挙動・addon 一覧・`base+addon1+addon2` 構文・`,` / `+` 等価）

## スコープ外（明示的に除外）

- 新 addon の追加（`supabase-rls` 以外）— 本 SPEC は規則の固定のみ。addon 追加は個別 SPEC
- custom profile の外部定義（利用者定義 profile、依頼 #6）— 別 SPEC
- monorepo 対応（依頼 #5）— 別 SPEC
- profile README（`package-templates/profiles/*/README.md`）の内容改訂 — doc files 合成の**一覧**のみが対象で、中身は対象外
- `parseProfiles` の文法変更（区切り文字追加・addon 単独指定の許容等）— 現行文法の固定のみ
- `getProfileScripts` 等の返り値スキーマ変更・script 内容の変更 — 合成規則の固定であって script 改訂ではない
- `dependency-installer.mjs` の profile 別依存一覧 — 合成対象が単純結合（addon `supabase-rls` は空配列）で競合概念が無いため、本 SPEC の規則固定の対象外

## 要件

### 機能要件
- [FR-01] profile 文法の固定: `parseProfiles` は `,` または `+` 区切りの profile 列を受け付け、(a) base profile がちょうど 1 つでなければ CliError、(b) 同一名の重複指定は CliError、(c) 未知の profile 名は supported 一覧付き CliError、(d) addon は 0 個以上を宣言順のまま `addons` 配列として返す — の現行規則をテストで固定する（実装変更なし）。複数 addon 構文 `base+addon1+addon2` が構文レベルで受理されることを、テスト専用の合成ロジック検証（FR-02 参照）で確認する
- [FR-02] scripts 合成規則: `getProfileScripts` は (a) base の scripts を起点に、(b) addon を**宣言順**にマージし、(c) addon の `ADDON_CHECK_STEPS` を `ai:check` の末尾に `&&` 連結で追記（既に含まれる step は追記しない）、(d) **addon の script キーが base または先行 addon のキーと同名の場合、衝突キー名・base/addon 名を含む CliError で fail-fast する**（silent 上書きの禁止。現行実装の `Object.assign` 後勝ちを安全側に確定する変更）。(d) は現行の全 profile 組合せでは発火しないため、既存の観測可能な CLI 挙動は不変
- [FR-03] support scripts 合成規則: `getProfileSupportScripts` は base の support scripts + package manager 別 security support scripts のみで構成され、addon は support scripts を寄与しない — の現行規則をテストで固定する（実装変更なし。将来 addon が support scripts を持つ場合は本 SPEC の改訂を要する）
- [FR-04] doc files / managed files 合成規則: `getProfileDocFiles` は共通 docs + base README + addon README（宣言順）を返し、`getManagedFiles` の profile 依存部分は `getProfileDocFiles` 経由のみである — の現行規則をテストで固定する（実装変更なし）
- [FR-05] スナップショット回帰ガード: 全 base × addon 部分集合の組合せ（現状 4 × 2 = 8）について、`getProfileScripts()` / `getProfileSupportScripts()`（packageManager は `pnpm` 固定。package manager 変換は既存テストの責務）/ `getProfileDocFiles()` の `relativePath` 列 / `getManagedFiles()` の state key 列を、リポジトリに commit した fixture JSON と `deepStrictEqual` で照合するテストを追加する。組合せは `supportedProfiles` の base / addon 分類から機械列挙し、addon が増えたのに fixture が無い場合はテストが fail する（暗黙の合成変化・fixture 更新漏れの両方を検出）
- [FR-06] `docs/cli.md` に profile composition 節を追加する: 文法（`+` / `,` 等価、base 1 + addon 0 個以上）、マージ順（base → addon 宣言順）、`ai:check` への addon step 追記規則、同名キー競合 = エラー、現行 addon 一覧（`supabase-rls`）を記載する

### 非機能要件
- [NFR-01] 後方互換: 現行のすべての supported profile 組合せ（8 通り）に対し、`init` / `doctor` / `update` の観測可能な挙動（生成される scripts・doc files・managed files・exit code）は本 SPEC 適用前と同一である（検証: FR-05 の fixture を**実装変更前の出力から生成**して commit し、変更後も全件一致すること。既存 `tests/cli/*.test.mjs` が無修正期待値部分で pass し続けること）
- [NFR-02] 新規依存を追加しない: スナップショット照合は `node:assert` の `deepStrictEqual` + commit 済み fixture JSON で行い、スナップショットライブラリ（jest 系・`node:test` の実験的 snapshot API 含む）を導入しない。`package.json` の runtime dependencies ゼロを維持する（検証: `tests/cli/package.test.mjs` の dependencies 検査）
- [NFR-03] スナップショットテストの実行時間は全組合せ合計で 2 秒未満（計測条件: CI (ubuntu-latest, Node 20+) 上の `node --test tests/cli/profile-composition.test.mjs` の所要時間。合成は純関数呼び出しのみでファイル I/O は fixture 読み込みと render 検証に限る）。閾値超過は CI で WARN（非ブロッキング。計測は `time node --test tests/cli/profile-composition.test.mjs` の real 秒数を確認し、2 秒超過時に run log へ記録する）
- [NFR-04] 新規コードパス（同名キー競合検出）は競合あり / なし / 複数 addon の各分岐に最低 1 テストケースを対応させる（分岐網羅はテストケース列挙で担保、カバレッジツール導入不要 — SPEC-0056 AC-03 と同方針）

### セキュリティ要件
- [SEC-01] 本 SPEC の変更は profile 合成の純関数と docs のみで、コマンド実行・ネットワークアクセス・ファイル書き込み経路（init/update の書き込みは既存のまま）を追加しない。fixture は合成結果（script 文字列・相対パス）のみを含み、secret / token / 絶対パス / 環境値を含まない（検証: fixture 内容のレビュー + AC-06 の grep 検査）
- [SEC-02] 同名キー競合の CliError メッセージには衝突キー名と profile 名のみを含め、script のコマンド内容全文は含めない（エラーメッセージ経由でのコマンド断片流出面を増やさない。競合はテンプレート定義起因であり利用者入力は含まれないが、公開面を最小に保つ）

### 運用要件
- [OPS-01] 将来 addon を追加する SPEC は、(a) `supportedProfiles` への追加、(b) FR-05 fixture の組合せ追加、(c) 同名キー競合が無いこと（FR-02 (d) が発火しないこと）、を満たさなければ本 SPEC のテストが fail する — という手順ガードとして機能する。docs/cli.md の addon 一覧更新漏れは AC-07 の grep で検出する
- [OPS-02] fixture の意図的更新（script 内容の改訂 SPEC 等）は、当該 SPEC の File Scope に fixture を明記し、diff レビューで合成変化を可視化した上で行う（fixture の無断更新は File Scope 検査 + レビューで検出）
- [OPS-03] 段階観測: v0.5.0 リリース後 1 リリースサイクル、スナップショットテストの fail 事例を観測する。「意図した変更なのに fixture 更新を忘れて fail」が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'profile-composition: fixture更新漏れ' sage/failures.md（failures.md 記録時は説明冒頭に『profile-composition: fixture更新漏れ』等の原因タグを付す）` で機械的に件数確認する）、fixture 再生成スクリプトの整備を別 SPEC で起票する

## File Scope

| 区分 | ファイル |
|---|---|
| 変更（CLI） | `src/cli/profile-scripts.mjs`（addon マージの同名キー競合検出 = CliError 化のみ。合成順・出力は不変） |
| 新規（テスト） | `tests/cli/profile-composition.test.mjs`（parseProfiles 規則固定 + 合成規則 + 競合エラー + スナップショット照合）, `tests/cli/fixtures/profile-composition.json`（8 組合せ × 4 関数の期待値 fixture） |
| ドキュメント | `docs/cli.md`（profile composition 節の追加） |

上記以外への変更は本 SPEC のスコープ外。`src/cli/profile.mjs`・`src/cli/profile-docs.mjs`・`src/cli/managed-files.mjs`・`src/cli/init.mjs`・`src/cli/doctor.mjs`・`src/cli/update.mjs`・`src/cli/dependency-installer.mjs`・`package-templates/` 配下・既存テストファイルは**変更しない**（parseProfiles / profile-docs / managed-files は現行実装をテストで固定する対象であって変更対象ではない。README ja/en は CLI 詳細を docs/cli.md に委譲済みのため対象外）。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存テストの無修正期待値部分を含む = NFR-01 の後方互換検証）【種別: unit + integration】
- [ ] AC-02: `parseProfiles` の現行規則がテストで固定される — (a) `react-nextjs+supabase-rls` と `react-nextjs,supabase-rls` が同一の `{ base, addons }` を返す、(b) base 0 件（addon 単独）・base 2 件は CliError、(c) 同一名重複は CliError、(d) 未知名は supported 一覧付き CliError、(e) 複数 addon 構文が受理され `addons` が宣言順を保持する（テスト専用 addon 名 2 件を注入した合成検証、または現行 addon 1 件での順序保証テストのいずれかで固定）（テストで検証）【種別: unit】
- [ ] AC-03: scripts 合成の規則がテストで固定される — (a) `react-nextjs+supabase-rls` の `getProfileScripts()` で addon の `test:db` / `test:integration:rls` が結果に含まれ、`ai:check` の末尾に addon step が `&&` 連結で追記される、(b) 既に含まれる step は重複追記されない、(c) addon の script キーが base のキーと同名の場合、および 2 番目以降の addon のキーが先行 addon のキーと同名の場合（テスト内でマージテーブルを注入して両方再現）（テスト内でマージテーブルを注入して再現）、衝突キー名を含む CliError が投げられ silent 上書きされない（FR-02 (d)。テストで検証）【種別: unit】
- [ ] AC-04: support scripts / doc files / managed files の合成規則がテストで固定される — (a) `getProfileSupportScripts` の結果キー集合が base + security のみで addon 追加前後で不変、(b) `getProfileDocFiles` が共通 docs + base README + addon README を宣言順で返す、(c) addon 有無で `getManagedFiles` の差分が addon README の profile-doc エントリのみである（テストで検証）【種別: unit】
- [ ] AC-05: 全 base × addon 組合せ（現状 8）× 4 関数の合成結果が `tests/cli/fixtures/profile-composition.json` と `deepStrictEqual` で完全一致し、組合せ列挙が `supportedProfiles` の分類から機械生成される（addon 追加時に fixture 未更新ならテストが fail することを、fixture に存在しない組合せを与えるネガティブケースで検証）（`node --test tests/cli/profile-composition.test.mjs` で検証）【種別: integration】
- [ ] AC-06: fixture JSON に絶対パス・環境依存値・secret 形字句が含まれない（`grep -E '/Users/|/home/|API_KEY|TOKEN|SECRET' tests/cli/fixtures/profile-composition.json` がヒット 0 件）【種別: build】
- [ ] AC-07: `docs/cli.md` に合成規則の記載が存在する（`grep -q 'profile composition' docs/cli.md` がヒットし、マージ順（declaration order）・競合時挙動（error）・addon 一覧（supabase-rls）の 3 点が同節に含まれることをレビューで確認）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | unit | Gate 2: Functional |
| AC-03 | unit | Gate 2: Functional |
| AC-04 | unit | Gate 2: Functional |
| AC-05 | integration | Gate 4: Architecture（合成契約の回帰ガード） |
| AC-06 | build | Gate 3: Security |
| AC-07 | docs | Gate 1: Structural |

AC-03 / AC-05 のテストは `tests/cli/profile-composition.test.mjs` として既存 `node --test tests/cli/*.test.mjs`（AC-01）の実行対象に含まれるため、CI 上は追加の workflow 設定なしに必須チェック化される。

## 異常系

- 想定エラー1: 未知の addon / profile 名（`react-nextjs+unknown-addon` 等）→ `parseProfiles` が supported 一覧付き CliError で非 0 終了する（現行挙動の固定。検証条件は AC-02 (d) を一次情報源とする）。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` 追記
- 想定エラー2: base の複数指定（`react-nextjs+node-cli`）または base 0 件（`supabase-rls` 単独）→ `parseProfiles` が「base ちょうど 1 つ」規則の CliError で非 0 終了する（現行挙動の固定。検証条件は AC-02 (b) を一次情報源とする）
- 想定エラー3: 同一 profile の重複指定（`react-nextjs+supabase-rls+supabase-rls`）→ `parseProfiles` が duplicate CliError で非 0 終了する（現行挙動の固定。検証条件は AC-02 (c) を一次情報源とする）
- 想定エラー4: addon の script キーが base または先行 addon と同名（将来の addon 定義ミス）→ `getProfileScripts` が衝突キー名・衝突元 profile 名を含む CliError で fail-fast し、silent に上書きした scripts を書き出さない（FR-02 (d)。現行組合せでは発火しないためテーブル注入で再現。検証条件は AC-03 (c) を一次情報源とする）
- 境界ケース1: addon 0 個（base 単独）→ 合成は base の scripts / docs をそのまま返し、`ai:check` への追記・マージは発生しない。スナップショットの 4 組合せ（addon なし側）で固定する（検証条件は AC-05 を一次情報源とする）

## 契約

- API: (1) **profile 文法**: `--profile` は `,` / `+` 区切りで base profile ちょうど 1 つ + addon 0 個以上。重複・未知名・base 個数違反は CliError。`parseProfiles` の返り値 `{ base, addons, all }`（addons は宣言順）は本 SPEC で固定され、以後の変更は additive のみ。 (2) **scripts 合成**: base scripts → addon scripts を宣言順にマージ、addon の check step は `ai:check` 末尾に `&&` 追記（重複排除）、同名 script キー競合は CliError（silent 上書き禁止）。 (3) **support scripts**: base + security のみ（addon 寄与なし。addon が support scripts を持つ場合は本 SPEC 改訂が必要）。 (4) **doc files**: 共通 + base README + addon README 宣言順。 (5) fixture `tests/cli/fixtures/profile-composition.json` は上記合成契約の実測固定であり、更新は合成変更 SPEC の File Scope 明記 + diff レビューを必須とする
- DB: なし
- イベント: なし

## リスク

- リスク1: 「同名キー競合 = エラー」の確定が、将来「addon が base の script を意図的に置き換えたい」ケースと衝突する → 軽減策: 置き換えが必要になった時点で override を**明示宣言する仕組み**（例: addon 定義の explicit override 一覧）を SPEC 改訂で追加する。silent 後勝ちを既成事実化するより、エラー起点で明示化を強制する方が安全（fail-fast → 明示 opt-in の順は緩和方向の変更なので後方互換）
- リスク2: fixture が「実装の写経」になり、バグ込みで固定する → 軽減策: fixture は NFR-01 のとおり実装変更前の出力から生成するが、AC-03 / AC-04 の規則テスト（fixture 非依存の意味論テスト）を併設し、fixture 照合だけに依存しない。fixture 生成時に AC-06 の内容検査を通す
- リスク3: script 内容を改訂する将来 SPEC のたびに fixture 更新が必要になり、更新が形骸化（機械的に再生成して diff を見ない）する → 軽減策: OPS-02 で File Scope 明記 + diff レビューを必須とし、OPS-03 で更新忘れ fail の累積を観測して再生成スクリプト整備の判断につなげる
- リスク4: 競合検出の実装が合成順や出力を偶然変えてしまう → 軽減策: NFR-01 の fixture を実装変更**前**に生成・commit し、変更後の全組合せ一致を AC-05 で機械検証する（変更前後の等価性が CI で証明される）
- リスク5: 機構を撤去する必要が生じた場合 → 軽減策: 競合検出は `getProfileScripts` 内の数行 + 新規テスト 2 ファイルのみで、検出ロジックを外せば現行の `Object.assign` 挙動に戻る（現行組合せでは発火しないため撤去しても利用者影響ゼロ）

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: 本 SPEC 固有の禁止事項（silent 上書き禁止・fixture 無断更新禁止）は本 SPEC 内の Forbidden Shortcuts と AC-03 / AC-05 の機械テストで担保され、既存 src-rules.md の一般原則『Silent scope expansion』『Consistency with existing code』の範囲を超える恒久ルールは発生しないため）

- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。同一パターン 3 回累積で `sage/anti-patterns.md` への昇格を検討する
- 「同名キー競合をエラーにする」「合成結果を fixture 固定する」が文章ルールだけだと AP-06（Human-Only Guard）になるため、AC-03 (c) / AC-05 の機械テストをガードとして常設する
- 「実装の偶然（silent 後勝ち）を仕様と誤認して依存する」のは AP-07（Hallucination Propagation）と同型のリスクであり、本 SPEC の fail-fast 化 + テスト固定がその対策である。テスト期待値は本 SPEC の契約節から導出し、AC-N 参照をテストケースに付す
- fixture 更新漏れ・無断更新は AP-03（Silent Scope Expansion)と関連し、AC-05 の完全一致照合 + OPS-02 の File Scope 明記がその対策である
- 「合成結果を committed fixture で固定する」は SPEC-0059 の `run-result.schema.json` 回帰ガード（additive-only 契約固定）と同型の既知パターンであり、新規パターンではない

**補記**: 本 SPEC 固有の Forbidden Shortcuts（silent 上書き禁止・fixture 経由の暗黙変更禁止）は `.claude/rules/src-rules.md` の一般原則『Silent scope expansion』の具体化であり、新規の恒久ルールではない（AC-03 / AC-05 の機械テストで検出）。

## 実装メモ（Implementation Agent向け）

- 競合検出の実装位置: `getProfileScripts` の addon ループ内。`Object.assign(scripts, ADDON_PROFILE_SCRIPTS[addon])` を「キーごとに `Object.hasOwn(scripts, key)` を確認してから代入」する小関数に置き換える。衝突時は `CliError` に衝突キー名・base 名・addon 名を含める（SEC-02: script のコマンド文字列は含めない）
- `ADDON_CHECK_STEPS` による `ai:check` への追記は**競合ではない**（キーの再代入だが定義済みの合成規則）。競合検出は addon の script テーブルのキーのみを対象にし、`appendScriptStep` 経路は対象外とする実装順に注意（先に競合検査 → マージ → step 追記）
- AC-03 (c) の再現: 現行テーブルでは競合が起きないため、競合検出関数（マージ小関数）を export してテストから直接テーブルを注入するか、`getProfileScripts` の内部テーブルを引数注入可能にする。**export する場合も CLI の観測可能な挙動は不変に保つ**（public CLI surface は変えない）
- fixture 生成: 実装変更前の HEAD で 8 組合せ × 4 関数の出力を JSON 化して commit（NFR-01 / リスク4）。`getProfileDocFiles` は `sourcePath` が絶対パスになるため fixture には `relativePath` 列のみを固定する（AC-06 の絶対パス禁止と整合）。`getManagedFiles` は `managedFileStateKey(file.relativePath)` の列を固定し、render 内容は既存 `managed-files.test.mjs` の render テストに委ねる
- `getManagedFiles` のオプションは `{ packageManager: "pnpm", ci: "direct", claudeHooks: true, reviewTemplates: true }` に固定して profile 軸のみを動かす（ci / hooks 軸の網羅は既存 96 組合せテストの責務。責務重複させない）
- 組合せの機械列挙: `profile.mjs` から `supportedProfiles` を import し、base / addon の分類は fixture 側にも持たせて突き合わせる（`supportedProfiles` に増えたのに fixture に無い → fail、が AC-05 のネガティブ検証）。分類の import 手段が無い場合も `profile.mjs` の Set を export しない（File Scope 外）— `parseProfiles` の成否で base / addon を判別できる（単独で通れば base、`react-nextjs+X` で通れば addon）
- exit code 規約: 既存どおり `CliError` で表現し `process.exit` 直呼びをしない
- 言語規約: docs/cli.md への追記は英語（既存 cli.md に合わせる）、テストケース名は日本語 + AC-N 参照、fixture のキーは英語

### 実装ルール

- 競合時に warning でマージ続行する実装をしない（fail-fast のみ。Forbidden Shortcuts 参照）
- fixture を実装変更**後**の出力から生成しない（NFR-01 / リスク4: 変更前 HEAD の出力が一次情報源）
- スナップショットライブラリ・`node:test` snapshot API を導入しない（NFR-02）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `tests/cli/managed-files.test.mjs` の 96 組合せループは「overlay / config が managed に現れない」検証で、本 SPEC のスナップショット（合成結果の**内容**固定）とは責務が異なる — 既存テストは変更しない（File Scope 外）
- `tests/cli/init.test.mjs` / `update.test.mjs` は profile scripts の一部キーを期待値に含む可能性がある → 本 SPEC は出力不変（NFR-01）のため影響しないはずだが、AC-01 で機械確認する
- `getProfileScripts` は `init.mjs` / `doctor.mjs` / `update.mjs` から呼ばれる → 競合 CliError は現行組合せで発火しないため呼び出し側の変更は不要（発火は将来の addon 定義ミス時のみで、その時点で CLI がエラー終了するのは意図どおり）
- `docs/cli.md` には既に profile 別 scripts の説明節がある → 合成規則節はその近傍に追加し、既存記述と矛盾しないよう相互参照する

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: fixture 生成 + スナップショットテスト（`tests/cli/fixtures/profile-composition.json` + `tests/cli/profile-composition.test.mjs` の AC-02 / AC-04 / AC-05 / AC-06 部分。実装変更前の HEAD 出力から fixture を生成）（依存なし）
  - 完了条件: AC-02 / AC-04 / AC-05 のテストが `node --test tests/cli/profile-composition.test.mjs` でパスし、AC-06 の grep がヒット 0 件
- T2: `src/cli/profile-scripts.mjs` の同名キー競合検出 + 競合テスト（`profile-composition.test.mjs` への AC-03 ケース追加）（依存: T1。fixture が変更前出力で固定済みであることが等価性証明の前提）
  - 完了条件: AC-03 のテストがパスし、T1 のスナップショット全件が無修正で pass し続ける（NFR-01）
- T3: `docs/cli.md` の profile composition 節追加（依存: T2。確定した規則（競合 = エラー）を docs 化するため）
  - 完了条件: AC-07 の grep がヒットし、`make validate` 等既存 preflight が壊れない

T1 と T2 は同一テストファイルを編集するため並列不可（T1 → T2 の直列）。分離しない理由: 競合検出テストは T1 で固定したスナップショット全件が無修正で pass し続けることの確認と一体でなければ等価性証明（NFR-01）が成立しないため。T3 は docs のみで T2 完了後なら独立実行可能。File Scope はテスト 2 ファイル（T1/T2）・`profile-scripts.mjs`（T2）・`docs/cli.md`（T3）で相互に排他。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- addon の同名 script キーを silent に上書き（後勝ち）する実装・warning で続行する実装の禁止 — 競合は CliError で fail-fast のみ（検出: AC-03 (c) のテスト — 注入テーブルで CliError になることの検証）
- fixture（`profile-composition.json`）を実装変更後の出力から再生成して「一致」を偽装することの禁止 — fixture は変更前 HEAD の出力が一次情報源（検出: T1 → T2 のタスク順序 + レビューで fixture commit が実装変更 commit より先行することの確認）
- 合成結果（scripts / support scripts / doc files / managed files）の内容・順序を本 SPEC で変更することの禁止 — 規則の固定のみ（検出: AC-05 の fixture 完全一致 + AC-01 の既存テスト pass 継続）
- `parseProfiles` の文法・エラー条件の変更の禁止（現行規則の固定のみ）（検出: AC-02 のテスト + `profile.mjs` が File Scope 外であることの diff 検査）
- スナップショットライブラリ等の npm 依存追加の禁止（検出: `tests/cli/package.test.mjs` の dependencies 検査）
- fixture に絶対パス・環境依存値を含めることの禁止（検出: AC-06 の grep 検査）
- File Scope（`profile-scripts.mjs` / 新規テスト 2 ファイル / `docs/cli.md`）外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) 合成は決定的である: 同一の profile 文字列・packageManager・オプションに対し、`getProfileScripts` / `getProfileSupportScripts` / `getProfileDocFiles` / `getManagedFiles` は常に同一の結果を返す（時刻・環境・実行順序に依存しない）
- [INV-02] (Gate 2) 合成結果の各 script キーの出自はちょうど 1 つ（base またはいずれか 1 addon）である。複数の出自を持つキーは合成前に CliError となり、結果には決して現れない（silent 上書きの不在）
- [INV-03] (Gate 2) addon の追加は削除を生まない: `base+addons` の合成結果（scripts キー集合・doc files 集合・managed files 集合）は、`base` 単独の合成結果を常に包含する（addon は追記のみで base の要素を消さない。`ai:check` は step 追記による値の伸長のみ）
- [INV-04] (Gate 2) `parseProfiles` の `addons` 順序は入力の宣言順と常に一致し、合成のマージ順・doc README の並び順はこの順序に従う
- [INV-05] (Gate 4) 全 supported 組合せの合成結果は fixture `tests/cli/fixtures/profile-composition.json` と常に完全一致する（回帰ガード AC-05。fixture 更新は合成変更 SPEC の明示スコープでのみ行う）

### Pre-conditions
- [PRE-01] (Gate 2) 合成関数は profile 文字列（または `parseProfiles` 結果）とオプションのみに依存し、対象プロジェクトの `package.json`・環境変数・ネットワークに依存しない（純関数）
- [PRE-02] (Gate 2) 合成は `parseProfiles` の validation（base 1 / 重複なし / 既知名のみ）を通過した入力に対してのみ行われる（不正 profile は合成前に CliError）

### Post-conditions
- [POST-01] (Gate 2) 競合エラー（FR-02 (d)）のとき、部分的にマージされた scripts はいかなる呼び出し元（init / doctor / update）にも返らない（fail-fast、部分合成の不在）
- [POST-02] (Gate 2) `base+addon` の `ai:check` は、base の `ai:check` の全 step を同順で先頭に含み、addon の check step を宣言順で末尾に含む（重複 step は 1 回のみ）

### Assumptions
- [ASM-01] (Gate 横断) 現行の全 supported 組合せ（8 通り）に script キー競合は存在しない（事前調査で確認済み: `supabase-rls` のキー `test:db` / `test:integration:rls` はどの base のキーとも非衝突）。この前提自体を AC-05 のスナップショットが継続検証する
- [ASM-02] (Gate 横断) addon は support scripts を持たない（現行実装の事実）。将来 addon が support scripts を要する場合は本 SPEC の契約 (3) の改訂を先に行う
- [ASM-03] (Gate 横断) `getManagedFiles` の profile 依存は `getProfileDocFiles` 経由のみ（事前調査で確認済み）。この前提の破れは AC-05 の managed files スナップショット差分として現れる

## 関連ID

- PLAN-ID: [PLAN-0060](../plans/PLAN-0060-addon-composition-rules.md)
- TASK-ID: [TASK-0215](../tasks/TASK-0215-composition-fixture-snapshot.md)（T1: fixture 生成 + スナップショット・規則固定テスト）, [TASK-0216](../tasks/TASK-0216-script-key-conflict-clierror.md)（T2: 同名キー競合 CliError 化 + 競合テスト）, [TASK-0217](../tasks/TASK-0217-composition-docs.md)（T3: docs/cli.md profile composition 節）
