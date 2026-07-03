# SPEC-0062: CI 統合の深化（monorepo paths-filter / matrix、Semgrep SARIF、SHA pin ガイド）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0062 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0051（`ai:check:secure` の 4-step chain + `security:sast` = `semgrep scan --config auto` を確立、かつ「GitHub code scanning SARIF upload」を明示スコープ外化 — 本 SPEC で解禁）、SPEC-0056（managed file hash + update の 3-way 処理 — CI テンプレ改変の後方互換の前提）、SPEC-0032（CI workflow の package-manager 別描画 — `renderedCiWorkflow` の契約）、SPEC-0061（`--workspace` による対象パッケージ指定 — matrix / paths filter 例が接続する対象）、SPEC-0040（`ai:check` と `ai:check:secure` を混在させない・workflow contract を変更しない原則） |
| 権限レベル | platform |

## 背景・目的

v0.3.0 で hosted reusable workflow / Composite Action を、v0.1.0 以降で copy example の direct / reusable workflow を配布してきたが、CI テンプレは **単一パッケージ・push/PR 全体起動・security 診断は CI に載せない** 前提で止まっている。事前調査（2026-07-03、`package-templates/ci-examples/` と `src/cli/ci-workflows.mjs` 現行実装）で確認した現状は次のとおり:

- **direct workflow（`ai-check.yml` / `ai-check-fast.yml`）は monorepo を意識しない**。`on: pull_request` で全体が起動し、変更パッケージに絞る `paths` filter も、複数 Node バージョン / 複数 workspace を回す `matrix` も無い。`grep -rn "paths:\|matrix:\|strategy:" package-templates/ci-examples/` はヒット 0 件
- **reusable workflow（`ai-quality-reusable.yml`）は `working-directory` input で monorepo を部分対応済み**（コマンド実行ディレクトリの切替のみ。変更検知やパッケージ選択は無い）。SPEC-0061 で追加した `--workspace <pkg-dir>` は「init が生成する gate scripts の配置」だけを扱い、**CI 起動を対象パッケージに絞る仕組みは存在しない**（SPEC-0061 スコープ外節が「CI テンプレの monorepo 対応は別 SPEC」と明記）
- **package manager キャッシュは既にある**（direct: `actions/setup-node` の `cache: <pm>` / bun は `oven-sh/setup-bun`。reusable: `cache: ${{ inputs.package-manager }}`）。本 SPEC で追加は不要
- **Semgrep は CI テンプレに一切載っていない**。`security:sast` = `semgrep scan --config auto`（`package.scripts.fragment.json` / `src/cli/profile-scripts.mjs` `COMMON_SECURITY_SUPPORT_SCRIPTS`）は `ai:check:secure` chain の 1 step だが、配布 CI（direct）が呼ぶのは `ai:check` / `ai:check:fast` のみで `ai:check:secure` を呼ばない。Semgrep の結果を **SARIF で GitHub Code Scanning に載せる経路は皆無**（`grep -rn -i "sarif\|codeql\|security-events\|upload-sarif" package-templates/ci-examples/` はヒット 0 件。`package-templates/prompts/security-scan.md` 等には CodeQL triage の参考リンクが既存するが CI テンプレ本体の SARIF 実装とは無関係。リポ全体でも SPEC-0051 line 38 のスコープ外宣言のみ）
- **CI テンプレは managed file**（`src/cli/managed-files.mjs` `getManagedFiles` が `ciWorkflowFiles(ci)` を登録、`render: () => renderedCiWorkflow(fileName, packageManager)`）。SPEC-0056 の 3-way 更新下にあり、**テンプレ内容を変えると hash が変わる**。未改変利用者は `local == baseline` で upstream に自動追従、改変済み利用者は `local != baseline && local != upstream` で `skip-modified`（`--force-managed` で明示上書きのみ）。この後方互換性を本 SPEC の第一級要件とする
- **SHA pin ガイドは docs に存在するが浅い**。`docs/github-actions.md` は「Organizations with stricter supply-chain policies can SHA-pin these actions after copying the examples」と一文で触れるのみ。`package-templates/ci-examples/README.md` §7 も「major version pin ではなく SHA pin に変更する。Dependabot 等で自動更新」と方針のみ。**具体手順（`@v5` → `@<40桁 SHA> # v5` の変換方法・確認方法）が無い**。`@v0.3.0` タグ pin ガイド（hosted workflow / Composite Action 向け）は `docs/github-actions.md` にあるが、これは「本リポの workflow / action を pin する」話で、「テンプレ内の third-party action（`actions/checkout@v5` 等）を SHA pin する」話とは別レイヤ

本 SPEC は「**CI テンプレを monorepo 前提でも使える起点に拡充し、Semgrep SARIF を opt-in で解禁し、SHA pin 手順を docs 化する**」レイヤを追加する。3 つの独立した拡張を 1 SPEC にまとめる理由: いずれも「配布 CI テンプレ（managed file）と CI 関連 docs の拡充」という同一の観測面・同一の後方互換制約（SPEC-0056 3-way）を共有し、テンプレ 1 ファイルの中に paths filter / matrix / SARIF の各例が同居しうるため、分割すると同一ファイルへの複数 SPEC 由来変更が競合する。

事前調査に基づき、次の設計に確定する:

> **設計: 既定挙動を壊さない「例の追加」に徹する。**
> (1) **SARIF は opt-in の別 job / 別ステップ**として direct workflow に追加する。既定はコメントアウトした雛形（無効）で、`security-events: write` permission と `github/codeql-action/upload-sarif` の upload をコメント解除で有効化する形にする。`security:sast`（package script）= `semgrep scan --config auto` は **変えない**（SPEC-0051 FR-02 保存）。SARIF は CI 側で `semgrep scan --sarif --output=semgrep.sarif` を別途走らせる（package script と別経路）。
> (2) **paths filter / matrix は direct workflow のコメント例**として追加する。既定の `on:` トリガーと job 構成は現行のまま（無効な例をコメントで示し、利用者が有効化する）。SPEC-0061 の `--workspace` と「workspace 対象ディレクトリのみを paths filter の対象にする」例で接続する。
> (3) **SHA pin は docs の手順追記**として整備する（`docs/github-actions.md` に third-party action の SHA pin 具体手順、`package-templates/ci-examples/README.md` §7 に手順リンクとテンプレ内対象一覧）。
>
> いずれも「既定挙動を変えない追加」に限定する理由: CI テンプレは SPEC-0056 3-way の managed file であり、既定の active な YAML 構造（job 名・step・トリガー）を変えると、未改変利用者にも意味のある挙動変化が upstream 追従で降ってくる。コメント雛形なら「利用者が明示的にコメント解除するまで挙動不変」で、opt-in の完全性（INV-01）を保てる。ただしコメント追加でも hash は変わるため、後方互換の観測は「未改変 = 自動追従（コメントが増えるだけ）／改変済み = skip-modified」の 2 系列で FR / AC に固定する。

## 対象ユーザー

- monorepo で CI を組む利用者 — direct workflow の paths filter 例をコメント解除し、SPEC-0061 の `--workspace` で入れた対象パッケージのパスに絞って CI を起動できる。matrix 例で複数 Node バージョン / 複数 workspace を回せる
- security を PR で可視化したい利用者 — SARIF opt-in をコメント解除し、Semgrep の finding を GitHub の Security タブ（Code Scanning）に載せられる。`security-events: write` permission の必要性が雛形コメントに明示される
- supply-chain policy が厳しい組織 — docs の SHA pin 手順に従い、テンプレ内の `actions/checkout@v5` 等を `@<SHA> # v5` に変換できる
- 既存の CI テンプレ利用者（未改変） — update で新テンプレに自動追従する。増えるのはコメント雛形のみで、active な CI 挙動は不変
- 既存の CI テンプレ利用者（改変済み） — update で skip-modified となり、既存の改変が保護される。新機能は `--diff` で確認し手動で取り込むか、`--force-managed` で明示的に upstream 化する
- Review Agent / CI — テンプレ YAML の妥当性・必須要素の存在がテスト（YAML パース + grep）で固定される

## スコープ（含む）

- **direct workflow（`ai-check.yml` / `ai-check-fast.yml`）への opt-in 例の追加**:
  - paths filter 例（コメント）: 変更パッケージのみで起動する `on.pull_request.paths` / `on.push.paths` の雛形。SPEC-0061 の workspace 対象ディレクトリ（例: `packages/app/**`）に絞る書き方を含む
  - matrix 例（コメント）: `strategy.matrix` による複数 Node バージョン（例: `[20, 22]`）または複数 workspace（例: `[packages/app, packages/api]`）の雛形。`working-directory` / `--workspace` との接続を含む
  - SARIF opt-in 例（コメント）: `ai-check.yml`（full 側のみ。fast には載せない）に、`semgrep scan --sarif --output=semgrep.sarif` を走らせるステップ + `github/codeql-action/upload-sarif` で upload するステップ + job/workflow の `permissions: security-events: write` の雛形
- **reusable workflow（`ai-quality-reusable.yml` / `ai-quality-call.yml`）の monorepo ドキュメント整合**: 既存 `working-directory` input で workspace ディレクトリを指す運用例を docs / README に追記（YAML 本体は input 追加なしで対応可能なため、reusable の YAML 変更は最小限に留める。matrix は caller 側で書く例を README に示す）
- **`docs/github-actions.md` への追記**: (a) third-party action の SHA pin 具体手順（`@v5` → `@<40桁 commit SHA> # v5`、SHA の調べ方、Dependabot 併用）、(b) Semgrep SARIF opt-in の有効化手順と `security-events: write` permission の必要性、(c) monorepo での paths filter / matrix 運用の指針
- **`package-templates/ci-examples/README.md` への追記**: §7（version pin）に SHA pin 手順への参照とテンプレ内 third-party action の対象一覧、monorepo 節（paths filter / matrix / `--workspace` 接続）、SARIF opt-in 節
- **CI 描画コード（`src/cli/ci-workflows.mjs`）の対応**: direct workflow に追加するコメント例が package-manager 別描画（`renderDirectWorkflow` の置換）と衝突しないことの担保。SARIF ステップ内に PM 依存コマンド（`pnpm ai:check` 等）を **置かない**（Semgrep は PM 非依存の別経路）ことで、`renderedCiWorkflow` の既存置換ロジックを変えずに済ませる
- **`isManagedCiWorkflowContent` / managed file hash の後方互換テスト**: テンプレ変更後、4 PM 変種の再描画が `renderedCiWorkflow` と一致し続けること（未改変判定の維持）、および update の 3-way が「未改変 = auto-follow / 改変済み = skip-modified」を正しく分岐することを既存 + 追加テストで固定
- **テスト追加**: テンプレ YAML の妥当性（パース可能）、SARIF ステップ / permission / SHA pin 例の要素存在（grep）、PM 別描画の不変性、3-way 後方互換

## スコープ外（明示的に除外）

- **GitLab CI / CircleCI / Bitbucket Pipelines テンプレート** — 別 SPEC（roadmap「Beyond v0.4.0」の候補）。本 SPEC は GitHub Actions のみ
- **SARIF 以外の結果アップロード先**（外部 SaaS ダッシュボード・Slack 通知・独自 artifact 集約等）— 対象外。SARIF → GitHub Code Scanning の 1 経路のみを opt-in で解禁する
- **Semgrep ルールセット自体の同梱**（organization-specific rules / カスタム `.semgrep.yml` の配布）— 別 SPEC（`#12`。SPEC-0051 スコープ外「organization-specific Semgrep rules」の継続）。本 SPEC は `--config auto`（既定）での SARIF 出力のみ
- **CLI が SARIF を解釈する機能**（`ai-check-template run` が SARIF をパース・集約する等）— 対象外。SARIF は GitHub Actions ステップが直接生成・upload し、CLI は関与しない
- **`security:sast` package script の変更** — `semgrep scan --config auto` を維持（SPEC-0051 FR-02 保存）。SARIF は CI ステップの別経路（`semgrep scan --sarif --output`）で、package script を変えない
- **既定挙動の変更** — SARIF・paths filter・matrix はすべて opt-in の追加例（既定はコメント無効）。active な CI 挙動（トリガー・job 構成・実行コマンド）は現行のまま
- **hosted reusable workflow（`.github/workflows/ai-quality.yml`）/ Composite Action（`ai-quality/action.yml`）本体への機能追加** — 本 SPEC はこれらの YAML contract を変更しない（SPEC-0040 の「workflow contract を変更しない」原則を継続）。SARIF / matrix は caller 側 / copy example 側で書く指針を docs に示すに留める
- **Semgrep 等スキャナの自動 install** — 対象外（SPEC-0051 スコープ外「scanner dependencies の自動 install」の継続）。SARIF ステップの雛形は install を含まず、利用者が有効化時に用意する
- **install state schema の変更** — 本 SPEC は state の形状を変えない（CI テンプレ内容変更に伴う managed file hash の値変化は SPEC-0056 の既存経路で処理され、schema 変更を要さない）
- **`--workspace` の複数指定 / CLI の CI 生成ロジックの workspace 対応** — SPEC-0061 のスコープ。本 SPEC は「CI テンプレのコメント例で `--workspace` 対象パスに接続する書き方を示す」だけで、CLI が CI に workspace を注入する機能は追加しない

## 要件

### 機能要件

- [FR-01] SARIF opt-in ステップの追加（`ai-check.yml`）: full workflow に、有効化するとコメント解除で機能する SARIF 雛形を追加する。雛形は (a) `semgrep scan --sarif --output=semgrep.sarif`（または `--config auto` 併記）を走らせるステップ、(b) `github/codeql-action/upload-sarif@<pin>` で `sarif_file: semgrep.sarif` を upload するステップ、(c) job または workflow レベルの `permissions: security-events: write`（+ 既存 `contents: read`）の 3 要素を含む。既定はコメントアウト（無効）で、コメント解除のみで有効化できる。`ai-check-fast.yml` には SARIF を追加しない（fast の意義を保つ）
- [FR-02] SARIF は package script と独立: SARIF ステップは `security:sast`（= `semgrep scan --config auto`）を **呼ばない**。CI 側で `semgrep` を直接呼ぶ別経路とし、`ai:check:secure` chain / `package.scripts.fragment.json` / `profile-scripts.mjs` を変更しない（SPEC-0051 FR-02 保存）。理由コメントを雛形に付す（「package script は `--config auto`、CI SARIF は `--sarif` で別途出力」）
- [FR-03] paths filter 例の追加（`ai-check.yml` / `ai-check-fast.yml`）: 変更パッケージのみで起動する `on.pull_request.paths` / `on.push.paths` の雛形をコメントで追加する。SPEC-0061 の workspace 対象ディレクトリ（例: `packages/app/**`）に絞る書き方と、「全スキップ時に required check が pending にならないための工夫」（異常系2・OPS-02 参照）への言及を含む。既定の `on:` トリガー（現行の全体起動）は変えない
- [FR-04] matrix 例の追加（`ai-check.yml`）: `strategy.matrix` で複数 Node バージョン（例: `node: [20, 22]`）または複数 workspace ディレクトリ（例: `workspace: [packages/app, packages/api]`）を回す雛形をコメントで追加する。`matrix.node` を `node-version` に、`matrix.workspace` を `working-directory` / SPEC-0061 の `--workspace` 相当のパスに接続する書き方を含む。既定の単一 job 構成は変えない
- [FR-05] PM 別描画との非干渉: 追加するコメント例（SARIF / paths / matrix）は、`renderDirectWorkflow`（`ci-workflows.mjs`）の PM 別置換（`PNPM_SETUP_BLOCK` → `SETUP_BLOCKS[pm]` / `pnpm ai:check` → `scriptCommand(pm, ...)`）と衝突しない。すなわち、コメント内に `pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK` に一致する文字列を置かない（置換の誤適用を防ぐ）。4 PM すべてで `renderedCiWorkflow` が YAML として妥当な出力を返す
- [FR-06] managed file 後方互換（未改変 = auto-follow）: テンプレ変更後、`renderedCiWorkflow(fileName, pm)` の 4 PM 変種が更新後の内容と一致し、未改変利用者の update は `local == baseline` 経路で新テンプレに自動追従する（SPEC-0056 3-way の update 経路）。`isManagedCiWorkflowContent` は更新後テンプレの 4 変種を「managed」と正しく判定する
- [FR-07] managed file 後方互換（改変済み = skip-modified）: CI テンプレを利用者が改変済み（`local != baseline` かつ `local != 新 upstream`）の場合、update は `skip-modified` で既存改変を保護し、`--force-managed` 指定時のみ `.bak-<version>` を書いてから上書きする（SPEC-0056 INV-01 の継続。本 SPEC はこの挙動を変えない）
- [FR-08] docs の SHA pin 手順（`docs/github-actions.md`）: third-party action（`actions/checkout` / `actions/setup-node` / `pnpm/action-setup` / `oven-sh/setup-bun` / `actions/upload-artifact` / `github/codeql-action`）を `@v5` 等の major pin から `@<40桁 commit SHA> # v5` に変換する具体手順（対象 action 一覧・SHA の調べ方・`# vX` コメント併記・Dependabot での自動更新）を追記する。`@v0.3.0` タグ pin（hosted workflow / action 向け）との違い（third-party action の SHA pin は別レイヤ）を明記する
- [FR-09] docs / README の monorepo・SARIF 節: `docs/github-actions.md` と `package-templates/ci-examples/README.md` に (a) monorepo での paths filter / matrix / `--workspace` 接続、(b) SARIF opt-in の有効化手順と `security-events: write` の必要性、(c) reusable workflow の `working-directory` による workspace 運用例、を追記する。ci-examples/README.md §7 に SHA pin 手順（docs へのリンク + 対象一覧）を追記する

### 非機能要件

- [NFR-01] 後方互換（既定挙動不変）: SARIF / paths / matrix はすべてコメント雛形（既定無効）で追加し、コメント解除しない限り active な CI 挙動（トリガー・job 名・実行 step・exit 条件）は本 SPEC 適用前と同一である（検証: 追加後テンプレをコメント除去せず `on:` / `jobs:` の active 部分が現行と構造同一であることをレビュー + パーステスト = AC-01）。update の 3-way は未改変 = auto-follow / 改変済み = skip-modified の 2 系列で不変（AC-05 / AC-06）。本 SPEC の追加は SAGE hook プロファイル（minimal/standard/strict）と独立で全プロファイル共通の配布内容となる（プロファイル別の出し分けはしない）
- [NFR-02] 新規 npm 依存ゼロ: 本 SPEC は CI アクション（`github/codeql-action/upload-sarif` 等）の YAML 参照を追加するのみで、`package.json` の runtime / dev dependencies を変えない（CI アクションは npm 依存ではない）。テンプレ描画コードは既存の `ci-workflows.mjs` に閉じ、新規パーサ・新規ライブラリを入れない（検証: `tests/cli/package.test.mjs` の dependencies 検査）
- [NFR-03] YAML 妥当性: 追加後の全 CI テンプレ（`ai-check.yml` / `ai-check-fast.yml` / `ai-quality-reusable.yml` / `ai-quality-call.yml`）および 4 PM 描画結果は、YAML パーサ（`node:` 標準に無いため、テストは actionlint 相当の外部依存を入れず、既存テストが使う軽量 YAML パース or 構造検証と同じ手段）でパース可能である。コメント雛形はコメント解除しても構文が妥当な YAML になる形で書く（テスト対象は既定=コメント状態、雛形の解除後妥当性はレビューで確認）
- [NFR-04] 新規追加要素は各々テストで固定: SARIF ステップの 3 要素（scan / upload-sarif / permission）の存在、paths filter 例の存在、matrix 例の存在、SHA pin 例の存在を grep 検証する。PM 別描画の不変性（4 PM × 2 direct file）と 3-way 後方互換（未改変 / 改変済み）を各 1 ケース以上で固定する
- [NFR-05] 観測面の明示: CI テンプレは配布物であり、実行環境（GitHub Actions runner）は本リポの CI で回さない。したがって observable なのは「**テンプレ YAML の内容**」であり、テストは「テンプレ YAML が妥当・必要な要素（SARIF ステップ / permission / SHA pin 例 / paths / matrix）を含む」ことの静的検証に限る。SARIF が実際に Code Scanning に載る動作検証はスコープ外（利用者環境の GitHub 機能に依存するため、雛形の正しさは公式ドキュメント照合で担保 = 実装ルール参照）。本 SPEC は静的検証（要素存在・パース可能性）を観測面とするため一般的なコードカバレッジ閾値（行/分岐 %）は適用対象外とし、網羅性は AC-01〜AC-08 の個別テストケース充足で担保する

### セキュリティ要件

- [SEC-01] 最小権限の明示: SARIF opt-in 雛形は `permissions: security-events: write` を **SARIF ステップを有効化する場合にのみ** 追加する形で示す（既定の `contents: read` に対する additive）。雛形コメントに「SARIF upload には `security-events: write` が必須。有効化しないなら追加しない（least-privilege）」旨を明記し、無条件で権限を広げない。permission 欠如時の挙動は異常系1 に定義する
- [SEC-02] SHA pin による supply-chain 強化: FR-08 の SHA pin 手順は「third-party action の tag は可変（同一 tag が別 commit を指しうる）であり、SHA pin で内容を固定する」という supply-chain の根拠を docs に明記する。SHA pin を強制はしないが（copy example の汎用性のため）、strict policy 組織向けの推奨経路として提示する。テンプレ自体の既定は major pin（現行）を維持し、SHA pin は docs 手順 + 雛形例で解禁する
- [SEC-03] SARIF 経路に secret を混入させない: SARIF 雛形は Semgrep の finding（コードパターン）のみを出力し、環境変数・secret を SARIF や artifact に含めない。雛形コメントに「SARIF は public repo では Security タブ経由で閲覧範囲が決まる。finding にパスや周辺コードが含まれる点に留意」旨を注意書きする（利用者が private value を CI ログ / SARIF に載せない判断を促す）

### 運用要件

- [OPS-01] SARIF 有効化失敗の段階観測: v1 リリース後 1 リリースサイクル、SARIF opt-in の失敗事例を観測する。「SARIF ステップを有効化したが `security-events: write` の付与漏れ / `upload-sarif` の pin ずれで upload が失敗する」事例が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'sarif: 有効化失敗（固定文字列タグ。表記ゆれ禁止）' sage/failures.md` で機械的に件数確認する。failures.md 記録時は既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）のうち該当値と併記し、症状欄冒頭に検索用補助タグ『sarif: 有効化失敗』を付す。原因タグは cause enum を置き換えず補助的に追加する）、雛形コメントの改善（permission 記述の目立たせ・upload-sarif の pin 更新手順の追記）を別 SPEC / lite lane で起票する
- [OPS-02] paths filter による required check の green 保証: paths filter で「変更パッケージ外の PR」が全 job スキップになると、GitHub の required status check が never-run で pending のままマージブロックされる問題を、雛形コメントで明示的に案内する（回避策: paths filter を使う場合は「常に green を返す fallback job」を required check に指定する、または GitHub の "required workflow" ではなく job 単位の必須化を避ける等の GitHub 標準手法をコメントで示す）。この案内の存在を AC-04 で grep 検証する。実運用での踏み外し事例が累積したら OPS-01 と同様に別 SPEC で手当てする
- [OPS-03] SHA pin 陳腐化の観測: SHA pin した third-party action はセキュリティ更新に追従しないため、docs で Dependabot（`.github/dependabot.yml` の `package-ecosystem: github-actions`）による自動 SHA 更新を推奨する。本 SPEC は Dependabot 設定ファイルを配布しない（利用者リポの設定であり本パッケージの managed file にしない）が、手順として案内する

## File Scope

| 区分 | ファイル |
|---|---|
| 変更（CI テンプレ） | `package-templates/ci-examples/github-actions/ai-check.yml`（SARIF opt-in / paths filter / matrix の各コメント例を追加）, `package-templates/ci-examples/github-actions/ai-check-fast.yml`（paths filter のコメント例のみ追加。SARIF / matrix は追加しない） |
| 変更（CI 描画） | `src/cli/ci-workflows.mjs`（追加コメント例が PM 別置換と衝突しないことの担保が必要な場合のみ最小変更。置換対象文字列を増やさない方針 — FR-05） |
| 変更（ドキュメント） | `docs/github-actions.md`（SHA pin 具体手順 / SARIF opt-in / monorepo 節）, `package-templates/ci-examples/README.md`（§7 SHA pin 参照 / monorepo 節 / SARIF 節） |
| 変更 / 新規（テスト） | `tests/cli/ci-workflows.test.mjs`（**新規可**。PM 別描画不変性 + SARIF/paths/matrix 要素存在 + YAML 妥当性。現状 CI 描画専用テストは存在せず `managed-files.test.mjs` / `init.test.mjs` / `update.test.mjs` に分散しているため、新規ファイルに集約するか既存へ追加するかは PLAN で確定する）, `tests/cli/update.test.mjs`（既存。CI テンプレ 3-way 後方互換: 未改変 auto-follow / 改変済み skip-modified の追加ケースのみ）, `tests/cli/managed-files.test.mjs`（既存。`isManagedCiWorkflowContent` の更新後変種一致） |

上記以外への変更は本 SPEC のスコープ外。特に **`package.scripts.fragment.json`・`src/cli/profile-scripts.mjs`（`security:sast` = `semgrep scan --config auto` を変えない — FR-02 / SPEC-0051 FR-02）**、`.github/workflows/ai-quality.yml`・`ai-quality/action.yml`（hosted contract を変えない — スコープ外節）、`src/cli/managed-files.mjs`・`src/cli/install-state.mjs`・`src/cli/update.mjs`（3-way ロジック本体を変えない。CI テンプレ内容変更に伴う hash 変化は既存経路で処理される — スコープ外節）、`package-templates/profiles/` 配下は **変更しない**。テストファイルは実在しない場合 File Scope 内で新規作成してよい（`tests/cli/ci-workflows.test.mjs` 等が既存かは PLAN 起票時に確認する）。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスし、CI テンプレ変更後も 4 PM（pnpm / npm / yarn / bun）× 2 direct file（`ai-check.yml` / `ai-check-fast.yml`）の `renderedCiWorkflow` 出力が YAML としてパース可能で、active な job 構造（`jobs:` 直下の step 列と実行コマンド）が本 SPEC 適用前と同一である（追加はコメント雛形のみ = NFR-01 / NFR-03 の後方互換検証）【種別: unit + integration】
- [ ] AC-02: `ai-check.yml`（4 PM 描画いずれでも）に SARIF opt-in の 3 要素が存在する — (a) `semgrep scan --sarif` を含む scan ステップ雛形、(b) `github/codeql-action/upload-sarif` の upload ステップ雛形、(c) `security-events: write` の permission 雛形 —（`grep` で 3 要素の存在を検証。既定はコメント状態のため grep はコメント行にヒットしてよい）。`ai-check-fast.yml` には SARIF 要素が存在しない（FR-01。grep で不在を検証）【種別: unit】
- [ ] AC-03: `security:sast` = `semgrep scan --config auto` が `package.scripts.fragment.json` と `src/cli/profile-scripts.mjs` で無変更である（`grep -q 'semgrep scan --config auto'` がヒットし、SARIF 経路が package script を変えていないことを検証 = FR-02 / SPEC-0051 FR-02 保存）【種別: unit】
- [ ] AC-04: `ai-check.yml` / `ai-check-fast.yml` に paths filter 例（`paths:` を含むコメント雛形と workspace ディレクトリ glob 例）が存在し、OPS-02 の「required check が全スキップで pending にならない工夫」への案内が同ファイルまたは docs に存在する（grep で `paths:` 例と案内文の存在を検証）。`ai-check.yml` に matrix 例（`strategy:` / `matrix:` を含むコメント雛形）が存在する（grep で検証 = FR-03 / FR-04）【種別: unit】
- [ ] AC-05: 未改変の CI テンプレを持つ target への `update`（フラグなし）が、更新後テンプレ（4 PM 変種のいずれか）に一致する既存ファイルを `local == baseline` 経路で auto-follow し、`isManagedCiWorkflowContent` が更新後 4 変種を managed と判定する（テストで検証 = FR-06。SPEC-0056 3-way の未改変経路の継続確認）【種別: integration】
- [ ] AC-06: 利用者が改変した CI テンプレ（`local != baseline` かつ `local != 新 upstream`）を持つ target への `update`（フラグなし）が `skip-modified` で既存改変を保護し、`--force-managed` で `.bak-<version>` 書き込み後に上書きする（テストで検証 = FR-07。SPEC-0056 INV-01 の継続確認）【種別: integration】
- [ ] AC-07: `docs/github-actions.md` に third-party action の SHA pin 具体手順が存在する — 対象 action 一覧（`actions/checkout` 等）、`@<SHA> # vX` 形式の例、SHA の調べ方、`@v0.3.0` タグ pin との違いの 4 点が同節に含まれることをレビューで確認し、`grep` で `security-events: write` の記載・SHA pin 例（40 桁 hex または `# v` コメント併記の記述）の存在を検証（FR-08 / FR-09 / SEC-01 / SEC-02）【種別: docs】
- [ ] AC-08: `package-templates/ci-examples/README.md` に (a) monorepo（paths filter / matrix / `--workspace` 接続）、(b) SARIF opt-in、(c) §7 の SHA pin 手順参照、の 3 節が存在する（`grep` で monorepo・SARIF・SHA pin の各キーワードの存在を検証し、リンク先が docs/github-actions.md であることをレビュー確認 = FR-09）【種別: docs】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | unit | Gate 2: Functional |
| AC-03 | unit | Gate 2: Functional |
| AC-04 | unit | Gate 2: Functional |
| AC-05 | integration | Gate 2: Functional |
| AC-06 | integration | Gate 2: Functional |
| AC-07 | docs | Gate 1: Structural（+ Gate 3: Security の SHA pin / permission 観点） |
| AC-08 | docs | Gate 1: Structural |

AC-01〜AC-06 のテストは `tests/cli/{ci-workflows,update,managed-files}.test.mjs` 上に置かれ、既存 `node --test tests/cli/*.test.mjs`（AC-01）の実行対象に含まれるため、CI 上は追加の workflow 設定なしに必須チェック化される。AC-07 / AC-08 は docs の静的検証（grep + レビュー）で、preflight（`npm pack` 内容検査等）を壊さないことを含めて確認する。

## 異常系

- 想定エラー1（SARIF permission 欠如）: 利用者が SARIF scan / upload ステップをコメント解除したが `security-events: write` を付与し忘れた場合 → GitHub Actions の `upload-sarif` ステップが権限不足で fail する（本パッケージのコードは関与しない。GitHub 側の実行時エラー）。雛形はこれを防ぐため permission ブロックを scan / upload とセットでコメント化し、コメントに「upload には `security-events: write` が必須。これを外すと upload が 403 で失敗する」旨を明記する（対処は利用者側 = SEC-01。検証条件は AC-02 (c) の permission 雛形存在を一次情報源とする）
- 想定エラー2（paths filter で全スキップ → required check pending）: monorepo で paths filter を効かせた結果、変更が対象外パスに限られる PR で全 job がスキップされ、GitHub の required status check が never-run で pending のままマージがブロックされる → 雛形コメント + docs で「常に成功する fallback job を required に指定する」等の GitHub 標準回避策を案内する（OPS-02。検証条件は AC-04 の案内文存在を一次情報源とする）
- 想定エラー3（PM 別描画の破損）: 追加したコメント例が偶然 `pnpm ai:check` / `PNPM_SETUP_BLOCK` に一致する文字列を含み、`renderDirectWorkflow` の置換で二重置換 / 誤置換が起きる → コメント例に置換対象文字列を置かない実装ルールで防ぐ。4 PM 描画結果が YAML 妥当であることを AC-01 で検出する（FR-05。検証条件は AC-01 を一次情報源とする）
- 想定エラー4（改変済みテンプレの意図せぬ上書き）: 利用者が CI テンプレを改変済みなのに、本 SPEC のテンプレ変更で update が誤って auto-follow して改変を消す → SPEC-0056 3-way が `local != baseline && local != upstream` を skip-modified に倒すため発生しない。本 SPEC はこの経路を変えないことを AC-06 で固定する（FR-07。検証条件は AC-06 を一次情報源とする）
- 想定エラー5（SHA pin の誤コピー）: docs 手順に従って SHA pin する際、tag と異なる commit の SHA を貼る / `# vX` コメントを付け忘れて後で識別不能になる → docs 手順に「SHA の調べ方（`gh api` / GitHub UI の tag → commit）」と「`# vX` コメント併記」を明記して誤りを減らす（FR-08。検証条件は AC-07 を一次情報源とする）
- 境界ケース1（fast workflow への SARIF 誤混入）: SARIF を `ai-check-fast.yml` にも入れると fast の意義（10 分以内・軽量）が崩れる → FR-01 で fast への SARIF 追加を禁止し、AC-02 で fast に SARIF 要素が不在であることを検証する
- 境界ケース2（コメント解除後の YAML 破損）: 利用者がコメント雛形の一部だけを解除して YAML 構造が壊れる → 雛形は「ブロック単位でコメント解除すれば妥当」な粒度で書き、部分解除の危険をコメントで注意する（実装ルール。テストは既定=コメント状態を対象とする = NFR-03）

## 契約

- API: (1) **CI テンプレ内容（配布物）**: direct workflow に SARIF / paths / matrix の opt-in コメント雛形を additive に追加。active な YAML contract（トリガー・job 名・実行コマンド）は不変。SARIF ステップは PM 非依存（Semgrep を直接呼ぶ）で、`renderedCiWorkflow` の PM 別置換対象を増やさない。 (2) **`security:sast` package script**: `semgrep scan --config auto` を維持（SPEC-0051 FR-02 保存。SARIF は CI 側の別経路）。 (3) **managed file hash / 3-way update**: CI テンプレ内容変更に伴う hash 変化は SPEC-0056 の既存 3-way 経路で処理され、schema / ロジックを変えない。未改変 = auto-follow / 改変済み = skip-modified。 (4) **hosted workflow / Composite Action contract**: `.github/workflows/ai-quality.yml` / `ai-quality/action.yml` の input / step contract は不変（SPEC-0040 継続）。
- DB: なし
- イベント: なし

## リスク

- リスク1: `github/codeql-action/upload-sarif` の API / 入力（`sarif_file` 等）や Semgrep の `--sarif` フラグが将来変わる → 軽減策: 雛形はコメント（利用者が有効化時に公式ドキュメントで確認する前提）で配布し、docs に「有効化時は Semgrep / codeql-action の公式ドキュメントで最新の入力を確認する」旨を付す。実装時は src-rules.md AI Output Verification に従い、`github/codeql-action/upload-sarif` の実ドキュメントで `sarif_file` 入力とバージョンを照合する（幻覚フラグの混入防止）
- リスク2: コメント雛形の追加でも managed file の hash が変わり、大量の既存利用者の update が「未改変なら auto-follow で差分（コメント増加）が降る」/「改変済みなら skip-modified 通知が出る」 → 軽減策: これは SPEC-0056 の設計どおりの正常挙動であり受容する。未改変利用者への差分は「コメントが増えるだけで active 挙動不変」（NFR-01）。改変済み利用者は skip-modified の既存 UX（`--diff` / `--force-managed`）で処理でき、破壊はない。docs / release notes に「本更新で CI テンプレにコメント例が追加され、未改変利用者は update で自動追従、改変済みは skip-modified になる」旨を告知する
- リスク3: paths filter を安易に有効化した利用者が required check の pending 問題（異常系2）を踏む → 軽減策: 雛形コメント + docs + OPS-02 で回避策を先回り案内する。既定は paths filter 無効（全体起動）のため、踏むのは明示的に有効化した利用者に限られる
- リスク4: SARIF opt-in の permission 追加を「job レベル」か「workflow レベル」かで迷い、利用者が過剰に workflow 全体へ `security-events: write` を広げる → 軽減策: 雛形は SARIF job / step にスコープした最小 permission の書き方を第一に示し（SEC-01）、コメントで「SARIF を使う job にのみ付与する」旨を明記する
- リスク5: 本 SPEC の 3 拡張（SARIF / paths-matrix / SHA pin）を同一ファイルに詰め込むことで `ai-check.yml` のコメントが肥大化し可読性が落ちる → 軽減策: 各 opt-in ブロックを見出しコメント（`# --- SARIF (opt-in) ---` 等）で区切り、詳細手順は docs に寄せてテンプレ内は「有効化の起点」に留める。テンプレの active 行数は現行から大きく増やさない
- リスク7: 依存する SPEC-0056（3-way ロジック）/ SPEC-0061（`--workspace`）は本 SPEC 起票時点で実装途上のため、契約が変わる可能性がある → 軽減策: 本 SPEC の PLAN 起票時に両 SPEC の最新ステータスを再確認し、`--workspace` 契約や 3-way 判定に変更があれば本 SPEC の該当箇所（FR-03/FR-04 のコメント例、FR-06/FR-07 の 3-way 記述）を PLAN 段階で同期する
- リスク6: 機構を撤去する必要が生じた場合 → 軽減策: 追加はすべてコメント雛形 + docs 追記で、コメントを削れば active 挙動は現行に戻る（未改変利用者は次 update でコメントが消える方向に auto-follow する）。package script / hosted contract は不変のため撤去の影響範囲が CI テンプレ + docs に閉じる

## 知識管理

- 本 SPEC は CLAUDE.md 本体・`.claude/rules/*.md` の改訂を要しない（理由: CI テンプレ / docs の拡充は配布物の変更であり、本リポの開発運用ルールに影響しない。配布 CI の一次情報源は `docs/github-actions.md` と `package-templates/ci-examples/README.md` で、CLAUDE.md は既に参照型（fixed-list を持たない）ため追記不要。roadmap の「Beyond v0.4.0」候補に GitLab/CircleCI があり本 SPEC がその手前の GitHub Actions 深化に当たるが、roadmap 更新は本 SPEC の File Scope 外 — 必要なら別途 maintainer が更新する）
- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素に従う）。OPS-01 の原因タグ『sarif: 有効化失敗』を該当時に付す
- 「managed file の内容変更は hash 変化として SPEC-0056 3-way が処理し、schema を上げない」は SPEC-0056 で確立した既知パターンであり、新規パターンではない。破ると改変済み利用者の CI が無警告上書きされる事故は SPEC-0056 のテストが継続検出する
- 「配布 CI の SARIF ステップに埋め込む外部 action 参照（`github/codeql-action/upload-sarif`）」は third-party への信頼境界越えであり、SEC-02（SHA pin 推奨）と実装時のドキュメント照合（src-rules.md AI Output Verification）で扱う。雛形の正しさは AC-02 の要素存在テスト + レビューでの公式ドキュメント照合でガードする（AP-06 Human-Only Guard の回避）
- テスト期待値は本 SPEC の契約節から導出し、AC-N 参照をテストケース名に付す

**アンチパターン照合の補記**: 想定タスク分割 T1〜T4 は各 File Scope が 10 ファイル未満で AP-02（Big Bang Prompt）の 20 ファイル閾値に抵触しない。commit message への TASK-ID 必須（commit-msg hook）は AP-05（Invisible Development）の防止策と一致する。File Scope 外変更（特に `package.scripts.fragment.json` / hosted workflow）は `templates/hooks/check-file-scope.sh` で検出される（AP-03）。

## 実装メモ（Implementation Agent向け）

- **SARIF 雛形の置き場**（`ai-check.yml`）: 既存の末尾コメント（Playwright artifact / diagnostic logs のコメント例）と同じスタイルで、`# --- Semgrep SARIF (opt-in) ---` の見出しコメント + scan / upload-sarif / permission の 3 ブロックをコメント化して追加する。permission は workflow 冒頭の既存 `permissions: contents: read` に対し「SARIF を使う場合の追記例」として `#   security-events: write` をコメントで併記する（既存 permission ブロックの active 行は変えない）
- **SARIF ステップの中身**: `semgrep scan --sarif --output=semgrep.sarif --config auto`（package script `security:sast` の `--config auto` と同じ config を使うが、CI では `--sarif --output` を足した別呼び出し。`pnpm security:sast` を呼ばない — FR-02）+ `uses: github/codeql-action/upload-sarif@<pin>` with `sarif_file: semgrep.sarif`。`semgrep` の install（`pip install semgrep` 等）はコメントで案内するがステップ本体には含めない（scanner 自動 install しない — スコープ外節）
- **PM 別置換との非干渉**（FR-05 / 異常系3）: `renderDirectWorkflow`（`ci-workflows.mjs`）は `PNPM_SETUP_BLOCK` 全体と `pnpm ai:check` / `pnpm ai:check:fast` を置換する。SARIF / paths / matrix のコメント例に **これらの文字列を含めない**。Semgrep コマンドは PM 非依存（`semgrep scan ...`）なので置換対象にならず安全。matrix 例で PM コマンドを書く場合は `${{ matrix.workspace }}` 等の変数を使い、リテラルの `pnpm ai:check` を避ける
- **paths filter 例**: `on.pull_request.paths` / `on.push.paths` をコメントで示す。SPEC-0061 の workspace（例: `packages/app`）に絞る場合は `paths: ['packages/app/**']`。全スキップ問題（異常系2 / OPS-02）の回避コメントを併記する
- **matrix 例**: `strategy.matrix` で `node: [20, 22]`（`node-version: ${{ matrix.node }}` に接続）または `workspace: [packages/app, packages/api]`（`working-directory: ${{ matrix.workspace }}` / SPEC-0061 の `--workspace` 相当に接続）。`fail-fast: false` の考慮もコメントで触れる
- **後方互換テスト**（AC-01 / AC-05 / AC-06）: `renderedCiWorkflow` の 4 PM 出力を snapshot 的に検証する既存テストがあれば、追加コメント分だけ期待値が変わる。変更は「active 構造不変・コメント追加のみ」であることをテストコメントで明示し、SPEC-0056 の 3-way テスト（`tests/cli/update.test.mjs`）に「未改変 auto-follow / 改変済み skip-modified」の CI テンプレ版ケースを追加する（既存 3-way ロジックを再利用し、新規実装しない）
- **docs SHA pin 手順**（FR-08）: 対象 action 一覧（`actions/checkout@v5` / `actions/setup-node@v5` / `pnpm/action-setup@v4` / `oven-sh/setup-bun@v2` / `actions/upload-artifact@v4` / `github/codeql-action/*`）を表で示し、各々を `@<40桁 SHA> # v5` に変換する手順・SHA の取得方法（`gh api repos/<owner>/<repo>/git/refs/tags/<tag>` 等）・Dependabot 併用を書く。`@v0.3.0` タグ pin（本リポの hosted workflow / action 向け、既存 docs）との違い（それは「本リポの成果物を pin」、SHA pin は「テンプレ内の third-party action を pin」）を明記する
- **言語規約**: `docs/github-actions.md` への追記は英語（既存 cli.md / github-actions.md に合わせる）、`package-templates/ci-examples/README.md`（利用者向け日本語ドキュメント）への追記は日本語、CI テンプレ内コメントは既存 `ai-check.yml`（日本語コメント）に合わせて日本語、テストケース名は日本語 + AC-N 参照、コード識別子は英語
- exit code / エラー規約: 本 SPEC は CLI のエラー経路を新設しない（テンプレ内容 + docs の変更が主）。`ci-workflows.mjs` に変更が入る場合も既存の `CliError` / 描画契約を守り、`process.exit` 直呼びをしない

### 実装ルール

- `security:sast`（`semgrep scan --config auto`）を変更しない（FR-02 / SPEC-0051 FR-02。`package.scripts.fragment.json` / `profile-scripts.mjs` に触れたら設計を疑う）
- SARIF / paths / matrix はすべてコメント雛形で追加し、active な CI 挙動（トリガー・job・実行コマンド）を変えない（NFR-01。既存テストの active 構造期待値を書き換えたら設計を疑う）
- コメント例に `pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK` に一致する文字列を置かない（FR-05 / 異常系3。PM 別置換の誤適用防止）
- `github/codeql-action/upload-sarif` と Semgrep `--sarif` の入力は実 PM / action 公式ドキュメントと照合してから確定する（src-rules.md AI Output Verification: 幻覚フラグの混入防止）
- hosted workflow（`.github/workflows/ai-quality.yml`）/ Composite Action（`ai-quality/action.yml`）の YAML contract を変更しない（スコープ外節 / SPEC-0040 継続）
- SPEC-0056 の 3-way ロジック（`managed-files.mjs` / `install-state.mjs` / `update.mjs` の判定本体）を変更しない。CI テンプレ内容変更に伴う hash 変化は既存経路で処理される
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `renderDirectWorkflow`（`ci-workflows.mjs`）の置換ロジック → 追加コメントが置換対象文字列を含まない限り無変更で通る。含めざるを得ない場合のみ最小変更で対応し、4 PM 描画の YAML 妥当性を AC-01 で機械確認する
- `isManagedCiWorkflowContent`（`ci-workflows.mjs`）は 4 PM 変種の membership 判定 → テンプレ変更後、4 変種が更新後内容と一致し続けることを AC-05 / managed-files テストで固定する。変種生成ロジック自体は変えない
- `tests/cli/ci-workflows.test.mjs`（存在すれば）の PM 別描画期待値 → コメント追加分で期待値が変わるため、active 構造不変を明示したうえで期待値を更新する（既存 active 部分の期待値は変えない）
- `tests/cli/update.test.mjs` の 3-way ケース → CI テンプレの未改変 auto-follow / 改変済み skip-modified を追加ケースとして足す。既存 3-way ケースの期待値は変えない
- `docs/github-actions.md` / `ci-examples/README.md` の既存 §7（version pin）→ SHA pin 手順は既存の「方針のみ」記述を「具体手順」に拡充する。既存の hosted workflow `@v0.3.0` pin 説明は変えず、third-party action SHA pin を別節として追加する

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: `ai-check.yml` / `ai-check-fast.yml` への SARIF / paths / matrix コメント雛形追加 + `ci-workflows.mjs` の非干渉担保（必要時のみ）（FR-01〜FR-05 / SEC-01 / SEC-03。AC-02 / AC-04 のテンプレ側）（依存なし）
  - 完了条件: `renderedCiWorkflow` の 4 PM × 2 file が YAML 妥当（AC-01）、SARIF/paths/matrix 要素が grep でヒット（AC-02 / AC-04）、既存テスト全件が active 構造不変で pass
- T2: テスト追加 — PM 別描画不変性 + SARIF/paths/matrix 要素存在 + YAML 妥当性（`tests/cli/ci-workflows.test.mjs`）+ 3-way 後方互換（`tests/cli/update.test.mjs` / `managed-files.test.mjs` の追加ケース）（AC-01 / AC-02 / AC-03 / AC-04 / AC-05 / AC-06）（依存: T1）
  - 完了条件: AC-01〜AC-06 の全テストがパスし、既存 3-way / 描画テストが無修正で pass
- T3: `docs/github-actions.md` の SHA pin 具体手順 + SARIF opt-in + monorepo 節（FR-08 / FR-09 / SEC-01 / SEC-02 / OPS-02 / OPS-03。AC-07）（依存: T1。確定したテンプレ挙動を docs 化するため）
  - 完了条件: AC-07 の grep がヒットし、レビューで 4 点（対象一覧 / SHA 形式 / 調べ方 / タグ pin との違い）を確認、既存 preflight が壊れない
- T4: `package-templates/ci-examples/README.md` の monorepo / SARIF / §7 SHA pin 参照節（FR-09。AC-08）（依存: T3。docs へのリンク先を確定してから参照するため）
  - 完了条件: AC-08 の grep がヒットし、リンク先が docs/github-actions.md であることをレビュー確認、既存 preflight が壊れない

T1 → T2 は直列（テンプレ確定 → テスト固定）。T3 は T1 完了後に独立実行可能、T4 は T3 完了後（docs リンク先確定後）。T1 を SARIF / paths / matrix で分割しない理由: 3 例は同一ファイル（`ai-check.yml`）に同居し、分割すると同一ファイルへの逐次コミットで File Scope が重複するため一括を維持する（ただし PLAN 起票時に `ai-check.yml` の変更が肥大化するなら SARIF と paths/matrix でサブタスク分割を再検討する）。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- `security:sast`（`semgrep scan --config auto`）の変更の禁止 — SARIF は CI 側の別経路（検出: AC-03 の `grep -q 'semgrep scan --config auto'` + `package.scripts.fragment.json` / `profile-scripts.mjs` の無変更確認）
- active な CI 挙動（トリガー・job・実行コマンド）の変更の禁止 — SARIF / paths / matrix はコメント雛形のみ（検出: AC-01 の active 構造不変 + 既存描画テストの active 部分無修正 pass）
- コメント例に PM 別置換対象文字列（`pnpm ai:check` 等）を置くことの禁止（検出: AC-01 の 4 PM 描画 YAML 妥当性 + レビュー）
- SARIF を `ai-check-fast.yml` に追加することの禁止（検出: AC-02 の fast への SARIF 不在検証）
- hosted workflow（`ai-quality.yml`）/ Composite Action（`action.yml`）の contract 変更の禁止（検出: File Scope 外 = `templates/hooks/check-file-scope.sh` + レビュー）
- SPEC-0056 3-way ロジック本体（`managed-files.mjs` / `install-state.mjs` / `update.mjs` の判定）の変更の禁止 — CI テンプレ hash 変化は既存経路で処理（検出: File Scope 外 + AC-05 / AC-06 の 3-way 挙動不変）
- 検証済みでない外部 action / Semgrep フラグ（実ドキュメント未照合の `upload-sarif` 入力・`--sarif` 構文等）のコミットの禁止（検出: レビューで公式ドキュメントの参照確認 — src-rules.md AI Output Verification）
- `security-events: write` を SARIF 有効化と無関係に無条件で広げることの禁止（検出: AC-02 の permission 雛形が SARIF ブロックとセットでコメント化されていることのレビュー = SEC-01）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 2) SARIF / paths filter / matrix をコメント解除しない限り、CI テンプレの active な挙動（トリガー・job 名・実行 step・exit 条件）は本 SPEC 適用前と常に同一である（opt-in の完全性）
- [INV-02] (Gate 2) `security:sast` の値は常に `semgrep scan --config auto` であり、SARIF 経路が package script（`package.scripts.fragment.json` / `profile-scripts.mjs`）を変更することはない（SPEC-0051 FR-02 の保存）
- [INV-03] (Gate 2) `renderedCiWorkflow(fileName, pm)` の 4 PM 変種は常に YAML として妥当であり、`isManagedCiWorkflowContent` はテンプレ変更後もこの 4 変種を managed と判定する（PM 別描画の健全性と managed 判定の保存）
- [INV-04] (Gate 3) SARIF 雛形において `security-events: write` permission は SARIF scan / upload ステップと同じブロック内でコメント化され、SARIF を有効化しない利用者の permission は `contents: read`（現行）のまま広がらない（least-privilege の保存）
- [INV-05] (Gate 4) hosted workflow（`ai-quality.yml`）/ Composite Action（`action.yml`）の input / step contract は本 SPEC の全経路で不変である（SPEC-0040 の contract 保存）

### Pre-conditions
- [PRE-01] (Gate 2) CI テンプレへの追加は既存の active YAML 構造を保持したうえでコメントブロックとして行われ、追加前後で active 部分の差分が生じない（追加はコメントのみ）
- [PRE-02] (Gate 3) SARIF 雛形に埋め込む外部 action 参照（`github/codeql-action/upload-sarif`）と Semgrep `--sarif` フラグは、コミット前に公式ドキュメントと照合済みである（src-rules.md AI Output Verification）

### Post-conditions
- [POST-01] (Gate 2) テンプレ変更後、未改変の CI テンプレを持つ利用者の `update`（フラグなし）は `local == baseline` 経路で新テンプレに auto-follow し、active な CI 挙動は変わらない（コメントが増えるのみ — SPEC-0056 3-way の未改変経路）
- [POST-02] (Gate 2) テンプレ変更後、改変済みの CI テンプレを持つ利用者の `update`（フラグなし）は `skip-modified` で既存改変を保護し、`--force-managed` 指定時のみ `.bak-<version>` を書いてから上書きする（SPEC-0056 INV-01 の継続）

### Assumptions
- [ASM-01] (Gate 横断) SARIF の GitHub Code Scanning への実際の掲載は利用者の GitHub リポジトリ機能（Advanced Security / public repo の Code Scanning）に依存し、本パッケージはテンプレ雛形の正しさ（要素存在・構文妥当・公式ドキュメント整合）までを保証する（NFR-05）。掲載可否は利用者環境の前提
- [ASM-02] (Gate 横断) `github/codeql-action/upload-sarif` は Semgrep 由来 SARIF を含む任意ツールの SARIF を受理する（GitHub 公式が Semgrep 連携を SARIF 経由で案内している前提。実装時に公式ドキュメントで確認する）
- [ASM-03] (Gate 横断) CI テンプレ内容の変更は SPEC-0056 の managed file hash 経路で処理され、schema / 3-way ロジックの変更を要さない（事前調査で確認済み: hash は content 由来、CI file は `render()` で per-PM 描画され baseline と比較される）
- [ASM-04] (Gate 横断) third-party action の tag（`@v5` 等）は可変で同一 tag が別 commit を指しうるため、SHA pin が supply-chain 固定の標準手段である（GitHub 公式のハードニングガイダンスの前提 — SEC-02）

## 関連ID

- PLAN-ID: PLAN-0062
- TASK-ID: TASK-0222（SARIF opt-in 雛形 = T1a）, TASK-0223（monorepo paths/matrix 雛形 = T1b）, TASK-0224（テスト = T2）, TASK-0225（`docs/github-actions.md` = T3）, TASK-0226（`ci-examples/README.md` = T4）
- Done Definition: `tasks/done-def-SPEC-0062-round-1.md`
- T1 分割判断: SPEC T1 を T1a（SARIF, TASK-0222）/ T1b（paths+matrix, TASK-0223）に分割（根拠: SARIF は Gate 3 security 観点 = 外部 action 照合 / permission least-privilege / secret 非混入を持ち、OPS-01 が SARIF を単独観測するため独立コミット化。paths/matrix は Gate 2 monorepo 観点で分離。両者は `ai-check.yml` の互いに素なコメントブロックで競合しない。詳細は PLAN-0062「T1 分割判断」節）
- 参考: SPEC-0051（SARIF スコープ外宣言の解禁元 — line 38「GitHub code scanning SARIF upload」）, SPEC-0056（managed file hash 3-way 後方互換の前提）, SPEC-0061（`--workspace` — paths filter / matrix 例の接続先）
