# PLAN-0062: CI 統合の深化（monorepo paths/matrix・Semgrep SARIF・SHA pin ガイド）の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0062 |
| SPEC-ID   | [SPEC-0062](../specs/SPEC-0062-ci-monorepo-sarif.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（配布 CI テンプレ `package-templates/ci-examples/github-actions/{ai-check.yml, ai-check-fast.yml}` への opt-in コメント雛形追加。および必要時のみ `src/cli/ci-workflows.mjs` の PM 別置換非干渉担保。active な YAML 挙動は不変 = NFR-01 / INV-01）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/ci-workflows.test.mjs` 新規 + `tests/cli/{update,managed-files}.test.mjs` への CI テンプレ 3-way / managed 判定の追加ケースのみ。既存ケースの期待値は変更しない）
- [x] docs（`docs/github-actions.md` — SHA pin 具体手順 / SARIF opt-in / monorepo 節、`package-templates/ci-examples/README.md` — §7 SHA pin 参照 / monorepo 節 / SARIF 節）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `package-templates/ci-examples/github-actions/ai-check.yml` | 末尾に opt-in コメント雛形を additive 追加。(1) `# --- Semgrep SARIF (opt-in) ---` 見出し + `semgrep scan --sarif --output=semgrep.sarif --config auto` の scan ステップ + `github/codeql-action/upload-sarif@<pin>` の upload ステップ + `security-events: write` permission 併記（FR-01 / FR-02 / SEC-01 / SEC-03）。(2) `# --- monorepo: paths filter (opt-in) ---` の `on.pull_request.paths` / `on.push.paths` 雛形 + OPS-02 の required check 全スキップ回避案内（FR-03）。(3) `# --- monorepo: matrix (opt-in) ---` の `strategy.matrix`（`node: [20, 22]` / `workspace: [packages/app, packages/api]`）雛形（FR-04）。既存 active な `on:` / `permissions:` / `jobs:` の行は不変（PRE-01） |
| `package-templates/ci-examples/github-actions/ai-check-fast.yml` | paths filter のコメント雛形のみ additive 追加（FR-03）。SARIF / matrix は追加しない（FR-01 fast への SARIF 禁止 / 境界ケース1）。active 行は不変 |
| `src/cli/ci-workflows.mjs` | **原則無変更**。追加コメントが `renderDirectWorkflow` の置換対象文字列（`PNPM_SETUP_BLOCK` 全体 / `pnpm ai:check` / `pnpm ai:check:fast`）を含まない限り、既存置換ロジックは無修正で 4 PM 描画が通る（FR-05 / 異常系3）。Semgrep コマンドは PM 非依存（`semgrep scan ...`）で置換対象にならない。matrix 例は `${{ matrix.workspace }}` 等の変数を使いリテラルの PM コマンドを避ける。**万一** コメント内に置換対象文字列を置かざるを得ない場合のみ最小変更で対応するが、本 SPEC の設計は「置換対象を増やさない」ため通常は差分ゼロ |
| `docs/github-actions.md` | (a) third-party action の SHA pin 具体手順節を新設（対象 action 一覧・`@<40桁 SHA> # v5` 形式・SHA の調べ方（`gh api` / GitHub UI）・Dependabot 併用・`@v0.3.0` タグ pin との違い — FR-08 / SEC-02 / OPS-03）。(b) SARIF opt-in の有効化手順と `security-events: write` の必要性（FR-09 / SEC-01）。(c) monorepo での paths filter / matrix / `--workspace` 接続と required check 全スキップ回避（FR-09 / OPS-02）。既存 `@v0.3.0` pin 説明は変えない（既存実装との衝突点） |
| `package-templates/ci-examples/README.md` | §7（version pin）に SHA pin 手順への docs リンク + テンプレ内 third-party action 対象一覧を追記。monorepo 節（paths filter / matrix / `--workspace` 接続）と SARIF opt-in 節を追記（FR-09 / AC-08）。日本語で記述（利用者向け） |
| `tests/cli/ci-workflows.test.mjs`（新規） | PM 別描画不変性（4 PM × 2 direct file の `renderedCiWorkflow` が YAML 妥当 + active 構造不変 = AC-01）、SARIF 3 要素の存在 / fast への SARIF 不在（AC-02）、`security:sast` 無変更（AC-03）、paths filter 例 + OPS-02 案内 + matrix 例の存在（AC-04）を集約（NFR-04） |
| `tests/cli/update.test.mjs`（既存） | CI テンプレ（`.github/workflows/ai-check.yml`）の 3-way 追加ケースのみ: 未改変 = auto-follow（local == baseline）= AC-05、改変済み = skip-modified + `--force-managed` で `.bak-<version>` 後上書き = AC-06。既存 3-way ケースの期待値は変えない |
| `tests/cli/managed-files.test.mjs`（既存） | `isManagedCiWorkflowContent` が更新後テンプレの 4 PM 変種を managed と判定する追加ケースのみ（AC-05 の managed 判定部分）。既存ケースの期待値は変えない |

`package-templates/package.scripts.fragment.json`（`security:sast` = `semgrep scan --config auto` を保持）/ `src/cli/profile-scripts.mjs`（L62 に同値） / `.github/workflows/ai-quality.yml` / `ai-quality/action.yml` / `src/cli/managed-files.mjs` / `install-state.mjs` / `update.mjs` / `package-templates/profiles/` は変更しない（SPEC File Scope / スコープ外節 / INV-02 / INV-05）。`ai-quality-reusable.yml` / `ai-quality-call.yml` の YAML 本体は input 追加なしのため変更しない（monorepo 運用は docs / README の `working-directory` 例で対応 — SPEC スコープ含む節）。

> 補記（AC-03 の検証）: `package-templates/package.scripts.fragment.json`（L9 に `"security:sast": "semgrep scan --config auto"`）と `src/cli/profile-scripts.mjs`（L62 に同値）はいずれも実在し、SARIF opt-in は CI テンプレ側の別ステップ追加であって package script を一切変更しない。AC-03 は両ファイルの当該行が無変更であることを機械検証する（両ファイルとも `git diff` がゼロ）。

## 実装方針

1. **テンプレ確定 → テスト固定 → docs 化の直列**（SPEC T1→T2→T3→T4 を踏襲）。テンプレ側（SARIF と paths/matrix）を先に確定し、`node --test tests/cli/ci-workflows.test.mjs` + 既存全件で active 構造不変を機械確認してから docs 化する。docs は確定挙動を文書化する（SPEC T4 依存順序 / 確定前の仕様を先に書かない）。
2. **T1 の分割確定（Evaluator 申し送りへの回答）**: SPEC T1（SARIF + paths + matrix を `ai-check.yml` に同居）を **T1a（SARIF, TASK-0222）/ T1b（paths + matrix, TASK-0223）に分割する**。分割根拠は下記「T1 分割判断」節に確定記載。両者は `ai-check.yml` の **互いに素なコメントブロック**（SARIF 見出しブロック vs monorepo 見出しブロック）を触り、逐次追記でも競合しない。テストは両テンプレ確定後に 1 タスク（TASK-0224）で固定する。
3. **PM 別描画の非干渉を実装ルールで担保（FR-05 / 異常系3）**: 追加コメントに `pnpm ai:check` / `pnpm ai:check:fast` / `PNPM_SETUP_BLOCK` に一致する文字列を置かない。Semgrep は PM 非依存の `semgrep scan ...` で書き、matrix の PM 依存箇所は `${{ matrix.* }}` 変数で書く。これにより `renderDirectWorkflow` を無変更に保ち、4 PM 描画の YAML 妥当性を AC-01 で機械確認する。
4. **外部 action / Semgrep フラグの実ドキュメント照合（PRE-02 / src-rules.md AI Output Verification / リスク1）**: `github/codeql-action/upload-sarif` の `sarif_file` 入力とバージョン、Semgrep の `--sarif --output` 構文を TASK-0222 実装時に公式ドキュメントで照合してから確定する（幻覚フラグ混入防止）。照合した version / 入力名を雛形コメントに残す。
5. **3-way 後方互換は既存ロジックの再利用（FR-06 / FR-07 / ASM-03）**: CI テンプレ内容変更に伴う hash 変化は SPEC-0056 の既存 3-way 経路（`managed-files.mjs` / `install-state.mjs` / `update.mjs`）で処理される。本 SPEC は判定本体を変えず、`tests/cli/update.test.mjs` に「未改変 auto-follow / 改変済み skip-modified」の CI テンプレ版ケースを追加して継続確認する（既存の `scripts/ai-check.sh` 等の 3-way ケースと同一パターンを CI file に適用）。
6. **依存ゼロ維持（NFR-02）**: 追加は CI action の YAML 参照（`github/codeql-action/upload-sarif`）とテンプレ内コメントのみで `package.json` の runtime / dev 依存を変えない。テストは既存の軽量 YAML 妥当性検証手段（`tests/cli` が既に使う手段。actionlint 等の外部依存は入れない — NFR-03）に揃える。
7. **依存 SPEC の再確認（リスク7）**: 本 PLAN 起票時に SPEC-0056（3-way）/ SPEC-0061（`--workspace`）の最新状態を確認した。SPEC-0061 は `--workspace <pkg-dir>` を単一指定で受理し gate scripts をルート、step scripts をパッケージに配置する契約（PLAN-0061 / TASK-0218〜0221）で、本 SPEC の paths/matrix 例が接続する対象パス（例: `packages/app/**`）と整合する。SPEC-0056 の 3-way は `.github/workflows/ai-check.yml` を managed file として既に扱っており（`tests/cli/managed-files.test.mjs` L51 / `update.test.mjs` で確認）、本 SPEC のテンプレ変更は既存経路で処理される。両契約に本 SPEC を破る変更は確認されなかった。

代替案比較:
- **既定 active 化案（SARIF / paths / matrix を既定有効にする）**: 不採用。CI テンプレは SPEC-0056 3-way の managed file であり、active な YAML 構造を変えると未改変利用者にも意味のある挙動変化が upstream 追従で降る。opt-in コメント雛形なら「利用者が明示解除するまで挙動不変」で INV-01 を保てる（SPEC 設計節の確定どおり）。
- **SARIF を package script に統合（`security:sast` に `--sarif` を足す）案**: 不採用。SPEC-0051 FR-02（`semgrep scan --config auto` 保存）を破り、`ai:check:secure` chain と CI SARIF 経路を混ぜる。CI 側で `semgrep` を直接呼ぶ別経路とし package script を変えない（FR-02 / INV-02）。
- **T1 を 1 タスク維持案**: 不採用（下記「T1 分割判断」節）。

## T1 分割判断（Evaluator 申し送りへの確定回答）

**確定: SPEC T1 を T1a（SARIF = TASK-0222）と T1b（paths + matrix = TASK-0223）に分割する。**

分割根拠（肥大化 + 責務差の 2 軸）:

1. **レビュー責務が異なる（Gate 配分が別）**: SARIF ブロックは **Gate 3: Security** の観点を持つ — 外部 action（`github/codeql-action/upload-sarif`）への信頼境界越え（PRE-02 の公式ドキュメント照合 / SEC-02 / 知識管理節 AP-06 Human-Only Guard）、`security-events: write` の least-privilege（SEC-01 / INV-04）、secret 非混入（SEC-03）。paths/matrix ブロックは **Gate 2: Functional / monorepo 構造**の観点（FR-03 / FR-04 / OPS-02 の required check 回避 = 純粋に YAML 構造とワークフロー起動の話）で、外部 action 照合も permission 設計も伴わない。同一タスクに混ぜると security レビューと monorepo レビューが 1 コミットに同居し、レビュー単位が肥大化する。
2. **OPS-01 が SARIF を単独で観測対象にしている**: SPEC OPS-01 は「SARIF 有効化失敗」を `sage/failures.md` で単独トラッキング（原因タグ『sarif: 有効化失敗』）する。SARIF を独立タスク = 独立コミットにすることで、この観測面と実装単位が 1:1 に対応し traceability が明確になる。
3. **File Scope が互いに素**: TASK-0222 は `ai-check.yml` の SARIF 見出しブロックのみ、TASK-0223 は `ai-check.yml` の monorepo 見出しブロック + `ai-check-fast.yml` の paths ブロックのみを触る。逐次追記でも同一行の競合が起きず、分割してもマージコンフリクトのリスクがない。
4. **依存順序の明確化**: TASK-0223（paths/matrix）は TASK-0222（SARIF）に依存させ直列化する。理由は両者が同一ファイル（`ai-check.yml`）に追記するため、コミット順を固定して「SARIF ブロック → monorepo ブロック」の追記順序を決定的にし、`ci-workflows.mjs` の非干渉確認を各コミットで行うため。並列化しない（同一ファイルへの並行追記を避ける — CLAUDE.md「同一 worktree で並行実行しない」の精神）。

反証の検討（1 タスク維持の可能性）: 「3 例とも同一ファイルへの逐次コメント追記でレビュー単位が実質同じ」という 1 タスク維持論は成立しうるが、上記 1（security vs functional の Gate 差）と 2（OPS-01 の単独観測）が「実質同じレビュー単位ではない」ことを示す。特に外部 action の公式ドキュメント照合（PRE-02）は SARIF 固有の verification ステップであり、これを monorepo コメント追加と束ねると「SARIF の照合漏れ」が「paths/matrix の変更」に紛れて見落とされるリスクがある。したがって分割を確定する。

paths と matrix を **さらに** 分割しない理由: paths（FR-03）と matrix（FR-04）はいずれも「monorepo 対応の active 挙動を変えないコメント例」で同一の Gate 2 / 同一レビュー観点・同一 File Scope（`ai-check.yml` の monorepo ブロック、+ paths のみ `ai-check-fast.yml`）に属し、外部依存も security 観点も持たない。分割すると同一見出しブロックへの逐次追記で File Scope が重複するため、T1b（TASK-0223）に統合する。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0222 | `ai-check.yml` への Semgrep SARIF opt-in コメント雛形（scan / upload-sarif / permission の 3 要素）追加 + `ci-workflows.mjs` 非干渉担保（SPEC T1a）。外部 action / Semgrep フラグの公式ドキュメント照合を含む | Implementation | 3h | - | No（TASK-0223 が同一ファイルに追記） |
| TASK-0223 | `ai-check.yml` への monorepo paths filter / matrix opt-in コメント雛形追加 + `ai-check-fast.yml` への paths filter コメント雛形追加 + OPS-02 案内 + `ci-workflows.mjs` 非干渉担保（SPEC T1b） | Implementation | 3h | TASK-0222 | No |
| TASK-0224 | テスト追加 — PM 別描画不変性 + SARIF/paths/matrix 要素存在 + fast への SARIF 不在 + `security:sast` 無変更 + YAML 妥当性（`tests/cli/ci-workflows.test.mjs` 新規）+ CI テンプレ 3-way 後方互換（`tests/cli/update.test.mjs`）+ managed 判定（`tests/cli/managed-files.test.mjs`）（SPEC T2） | Implementation + Test | 4h | TASK-0223 | No |
| TASK-0225 | `docs/github-actions.md` の SHA pin 具体手順 + SARIF opt-in 手順 + monorepo 節（SPEC T3） | Implementation | 2h | TASK-0223 | No |
| TASK-0226 | `package-templates/ci-examples/README.md` の monorepo / SARIF / §7 SHA pin 参照節（SPEC T4） | Implementation | 1h | TASK-0225 | No |

- **AC 対応**:
  - TASK-0222 → AC-02（`ai-check.yml` に SARIF 3 要素: `semgrep scan --sarif` / `github/codeql-action/upload-sarif` / `security-events: write` が存在）、AC-01（SARIF 追加後も 4 PM × `ai-check.yml` 描画が YAML 妥当・active 構造不変）、FR-01 / FR-02 / SEC-01 / SEC-03 / PRE-02 / INV-04。
  - TASK-0223 → AC-04（`ai-check.yml` / `ai-check-fast.yml` に paths filter 例 + OPS-02 案内、`ai-check.yml` に matrix 例が存在）、AC-02 の fast 側（`ai-check-fast.yml` に SARIF 不在）、AC-01（paths/matrix 追加後も 4 PM × 2 file 描画が YAML 妥当・active 構造不変）、FR-03 / FR-04 / OPS-02。
  - TASK-0224 → AC-01（4 PM × 2 file の `renderedCiWorkflow` YAML 妥当 + active 構造不変を機械固定）、AC-02（SARIF 3 要素存在 + fast 不在の grep 検証）、AC-03（`package-templates/package.scripts.fragment.json` L9 と `src/cli/profile-scripts.mjs` L62 の `security:sast` = `semgrep scan --config auto` が両方無変更）、AC-04（paths/matrix/案内の grep 検証）、AC-05（未改変 auto-follow + `isManagedCiWorkflowContent` managed 判定）、AC-06（改変済み skip-modified + `--force-managed` で `.bak-<version>`）。
  - TASK-0225 → AC-07（`docs/github-actions.md` に SHA pin 具体手順の 4 点 + `security-events: write` 記載 + SHA pin 例が存在）。
  - TASK-0226 → AC-08（`ci-examples/README.md` に monorepo / SARIF / §7 SHA pin 参照の 3 節が存在、リンク先が `docs/github-actions.md`）。
  - AC-01（全テストパス = NFR-01 後方互換）は全 TASK 共通の完了条件（テンプレ変更後・docs 変更後いずれも既存 `node --test tests/cli/*.test.mjs` が pass する）。
- **NFR-04 分岐対応**: SARIF 3 要素存在 = TASK-0222（雛形）/ TASK-0224（テスト）、fast への SARIF 不在 = TASK-0223（雛形）/ TASK-0224（テスト）、paths / matrix 存在 = TASK-0223（雛形）/ TASK-0224（テスト）、SHA pin 例存在 = TASK-0225（docs）/ TASK-0224（テンプレ非対象・docs は AC-07 の grep）、PM 別描画不変性（4 PM × 2 direct file）= TASK-0224、3-way 後方互換（未改変 / 改変済み）= TASK-0224。
- **直列理由**: TASK-0222（SARIF ブロック）→ TASK-0223（monorepo ブロック）は同一 `ai-check.yml` への追記順序固定のため直列（T1 分割判断 4）。TASK-0224（テスト）はテンプレ 2 タスク確定後に固定するため TASK-0223 依存。TASK-0225（docs）は確定テンプレ挙動を文書化するため TASK-0223 依存（テストと並行実行可能だが、docs 内容がテンプレ確定に依存するため TASK-0223 を先行させる）。TASK-0226（README）は docs リンク先確定後のため TASK-0225 依存（SPEC T4 依存順序）。

依存グラフ: TASK-0222 → TASK-0223 → TASK-0224 → TASK-0225 → TASK-0226（TASK-0224 と TASK-0225 は File Scope が素で理論上並列可能だが、本 Round はレビュー単位を単純化するため直列運用を採用すると確定する）。

AC-01（全テストパス）は各 TASK の完了条件に個別記載され、Round 全体の最終確認は `tasks/done-def-SPEC-0062-round-1.md` の Functional Gate で行う。

知識管理: 各 TASK 実装中の想定外エラーは担当 Agent が TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX 形式で記録する（`sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。SARIF 有効化失敗を記録する際は症状欄冒頭に原因タグ『sarif: 有効化失敗』を付し、既存 `cause` enum（trust-boundary / code-reading / spec-misinterpretation / not-applicable / other）の該当値と併記する（OPS-01）。「managed file の内容変更は hash 変化として SPEC-0056 3-way が処理し schema を上げない」は SPEC-0056 で確立した既知パターンの再適用であり、新規パターンとして記録しない。本 PLAN は CLAUDE.md / `.claude/rules/` / `sage/` を変更しない（sage-managed 保護対象のため、将来変更が必要と判明した場合は human approval を得たうえで別 TASK を起票する）。

## リスク

- リスク1（SPEC リスク1）: `github/codeql-action/upload-sarif` の入力（`sarif_file` 等）や Semgrep `--sarif` フラグが将来変わる → 軽減策: 雛形はコメント（利用者が有効化時に公式ドキュメントで確認する前提）で配布し、実装時（TASK-0222）に `github/codeql-action/upload-sarif` の実ドキュメントで `sarif_file` 入力とバージョンを照合する（src-rules.md AI Output Verification / PRE-02）。docs（TASK-0225）に「有効化時は Semgrep / codeql-action の公式ドキュメントで最新の入力を確認する」旨を付す。
- リスク2（SPEC リスク2）: コメント雛形追加でも managed file の hash が変わり、未改変利用者は auto-follow でコメント差分が降り、改変済み利用者は skip-modified 通知が出る → 軽減策: これは SPEC-0056 の設計どおりの正常挙動で受容する（未改変は active 挙動不変・コメント増加のみ = NFR-01、改変済みは既存 `--diff` / `--force-managed` UX で処理）。docs / release notes に告知する（TASK-0225 / TASK-0226）。
- リスク3（SPEC リスク3）: paths filter を安易に有効化した利用者が required check の pending 問題（異常系2）を踏む → 軽減策: 雛形コメント（TASK-0223）+ docs（TASK-0225）+ OPS-02 で回避策を先回り案内。既定は paths filter 無効（全体起動）のため踏むのは明示有効化した利用者に限る。AC-04 で案内文存在を grep 検証。
- リスク4（SPEC リスク4）: SARIF permission を job / workflow どちらに置くか迷い、利用者が過剰に workflow 全体へ `security-events: write` を広げる → 軽減策: 雛形（TASK-0222）は SARIF job / step にスコープした最小 permission の書き方を第一に示し（SEC-01 / INV-04）、コメントで「SARIF を使う job にのみ付与する」旨を明記。
- リスク5（SPEC リスク5）: 3 拡張を同一ファイルに詰め込み `ai-check.yml` のコメントが肥大化し可読性が落ちる → 軽減策: 各 opt-in ブロックを見出しコメント（`# --- Semgrep SARIF (opt-in) ---` / `# --- monorepo: paths filter (opt-in) ---` / `# --- monorepo: matrix (opt-in) ---`）で区切り（TASK-0222 / TASK-0223）、詳細手順は docs（TASK-0225）に寄せてテンプレ内は「有効化の起点」に留める。active 行数は現行から増やさない（PRE-01）。T1 分割（TASK-0222 / TASK-0223）自体もこの肥大化への構造的軽減策。
- リスク6（SPEC リスク6）: 機構撤去が必要になる → 軽減策: 追加はすべてコメント雛形 + docs 追記で、コメントを削れば active 挙動は現行に戻る（未改変利用者は次 update でコメントが消える方向に auto-follow）。package script / hosted contract は不変（INV-02 / INV-05）のため撤去の影響範囲が CI テンプレ + docs に閉じる。手順: TASK-0222〜0226 の commit を `git revert` 後 `node --test tests/cli/*.test.mjs` で復旧確認。
- リスク7（SPEC リスク7）: 依存 SPEC-0056 / SPEC-0061 の契約が変わる → 軽減策: 本 PLAN 起票時に両 SPEC の最新状態を確認済み（実装方針 7）。SPEC-0061 の `--workspace` 単一指定契約と SPEC-0056 の CI file managed 判定・3-way に本 SPEC を破る変更は無い。実装中に契約変更が判明した場合は FR-03/FR-04 のコメント例 / FR-06/FR-07 の 3-way 記述を該当 TASK で同期する。
- 実装リスク8: `tests/cli/ci-workflows.test.mjs` を新規作成する際、既存 `managed-files.test.mjs` / `init.test.mjs` / `update.test.mjs` に分散している CI 描画期待値と二重管理になる → 軽減策: 新規ファイルは「PM 別描画不変性・要素存在・YAML 妥当性」の CI 描画専用検証に集約し、3-way は `update.test.mjs`、managed 判定は `managed-files.test.mjs` に置く（責務で分ける）。既存ファイルの CI 関連期待値は変更せず追加ケースのみ足す（TASK-0224 完了条件に転記）。

## 必要な検証

- [x] unit test（SARIF 3 要素存在 / fast への SARIF 不在 = AC-02 / FR-01、`security:sast` 無変更 = AC-03 / FR-02 / INV-02、paths / matrix 例 + OPS-02 案内存在 = AC-04 / FR-03 / FR-04、PM 別描画 YAML 妥当性 = AC-01 / INV-03、NFR-04 の各分岐。`tests/cli/ci-workflows.test.mjs`）
- [x] integration test（4 PM × 2 direct file の `renderedCiWorkflow` active 構造不変 + 既存 `node --test tests/cli/*.test.mjs` 全件 pass = AC-01 / NFR-01 / INV-01 / PRE-01、未改変 auto-follow + `isManagedCiWorkflowContent` managed 判定 = AC-05 / FR-06 / POST-01、改変済み skip-modified + `--force-managed` で `.bak-<version>` = AC-06 / FR-07 / POST-02。`tests/cli/{update,managed-files}.test.mjs` 追加ケース）
- [x] build（`make validate` / `npm pack --dry-run` が壊れない — 配布物追加は `ci-examples/*.yml` / docs / README の既存 `package.json` `files` パターン内。`tests/` は pack 非同梱）
- [x] security scan（Gate 3: AC-07 の `security-events: write` 記載 + SHA pin 例存在 = SEC-01 / SEC-02、SARIF permission が SARIF ブロックとセットでコメント化 = INV-04 のレビュー、SARIF に secret 非混入の注意書き = SEC-03、外部 action の公式ドキュメント照合 = PRE-02、`rg "TODO|FIXME"` 新規マーカー不在、`bash scripts/sage-validate.sh` 範囲、新規 npm 依存なし = NFR-02（`tests/cli/package.test.mjs` の dependencies 検査））
- [x] e2e test（**N/A**: 理由 = 観測面は「テンプレ YAML の内容」で、実 GitHub Actions runner は本リポ CI で回さない（NFR-05）。SARIF が実際に Code Scanning に載る動作は利用者環境の GitHub 機能（Advanced Security / public repo）に依存し（ASM-01）、雛形の正しさは静的検証（要素存在・YAML 妥当性）+ 公式ドキュメント照合で担保する。実行時動作の e2e はスコープ外節に明記）
- [x] architecture boundary check（Gate 4: File Scope 外の無変更確認 — `package-templates/package.scripts.fragment.json`（security:sast 無変更）/ `profile-scripts.mjs`（INV-02）/ `.github/workflows/ai-quality.yml` / `ai-quality/action.yml`（INV-05 / SPEC-0040 hosted contract 保存）/ `managed-files.mjs` / `install-state.mjs` / `update.mjs`（3-way 判定本体不変 = ASM-03）/ `package-templates/profiles/` の diff がゼロ。`ci-workflows.mjs` は原則差分ゼロ、置換対象文字列を増やさないことのレビュー = FR-05）

## 段階採用 / ロールバック

- 影響ゼロ: SARIF / paths / matrix はすべて opt-in コメント雛形（既定無効）で、コメント解除しない限り active な CI 挙動（トリガー・job 名・実行 step・exit 条件）は本 SPEC 適用前と完全に同一（INV-01 / NFR-01 / PRE-01。AC-01 の active 構造不変検証が継続確認）。未改変利用者の update は auto-follow でコメントが増えるのみ（POST-01）、改変済み利用者は skip-modified で保護される（POST-02）。
- ロールバック: 追加はコメント雛形 + docs 追記のみのため、コメントを削れば active 挙動は現行に戻る（TASK-0222〜0226 の commit を `git revert` 後 `node --test tests/cli/*.test.mjs` で復旧確認）。未改変利用者は次 update でコメントが消える方向に auto-follow する。package script（`security:sast`）/ hosted workflow / Composite Action contract は不変（INV-02 / INV-05）のため撤去の影響範囲が CI テンプレ + docs に閉じる。
- 観測: v1 リリース後 1 リリースサイクル、SARIF opt-in の失敗事例（`security-events: write` 付与漏れ / `upload-sarif` の pin ずれで upload 失敗）を観測（OPS-01）。原因タグ『sarif: 有効化失敗』の `sage/failures.md` 3 回累積で雛形コメント改善を別 SPEC / lite lane 起票（判定: 次マイナーバージョン PLAN 起票時に `grep -c 'sarif: 有効化失敗' sage/failures.md` で機械確認）。paths filter の required check pending 事例が累積した場合も同様に別 SPEC で手当て（OPS-02）。SHA pin 陳腐化は docs で Dependabot（`package-ecosystem: github-actions`）を推奨案内（OPS-03。Dependabot 設定ファイル自体は配布しない = 利用者リポの設定）。
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（`security:sast` 変更禁止・active 挙動変更禁止・PM 別置換対象文字列禁止・fast への SARIF 追加禁止・hosted contract 変更禁止・3-way ロジック本体変更禁止・未検証外部 action / フラグ禁止・無条件 permission 拡張禁止・File Scope 外変更禁止・TASK-ID 欠落コミット禁止）は AC-01〜AC-08 + 既存 dependencies 検査 + File Scope hook + レビューの機械 / 手動ガードで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを主軸に採用）、CLAUDE.md / `.claude/rules/ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり。配布 CI の一次情報源は `docs/github-actions.md` / `ci-examples/README.md` で、本 SPEC の追記がそれを担う）。

ロールバック後の利用者影響: 既に SARIF / paths / matrix をコメント解除して有効化した利用者環境の workflow YAML は利用者のコミット下にあり、本パッケージのロールバックでは変更されない（配布物の revert は利用者リポの committed YAML に遡及しない）。旧テンプレに戻す update を受けた未改変利用者はコメント雛形が消える方向に auto-follow し、active 挙動は変わらない。SHA pin した利用者の pin は利用者コミット下で保持される。
