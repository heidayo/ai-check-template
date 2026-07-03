# TASK-0224: CI テンプレ描画不変性・要素存在・3-way 後方互換のテスト追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0224 |
| SPEC-ID   | SPEC-0062 |
| PLAN-ID   | PLAN-0062 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0223 のテンプレ確定に依存。TASK-0225 とは互いに素な File Scope のため並列可だが安全側で直列運用推奨） |
| 依存TASK  | TASK-0223 |
| 見積     | 4h |

## 責務

TASK-0222 / TASK-0223 で確定した CI テンプレ変更を機械テストで固定する（SPEC T2）。(1) PM 別描画不変性 + SARIF/paths/matrix 要素存在 + fast への SARIF 不在 + `security:sast` 無変更 + YAML 妥当性を `tests/cli/ci-workflows.test.mjs`（新規）に集約する。(2) CI テンプレ（`.github/workflows/ai-check.yml`）の 3-way 後方互換（未改変 auto-follow / 改変済み skip-modified）を `tests/cli/update.test.mjs` に追加する。(3) `isManagedCiWorkflowContent` の更新後 4 変種一致を `tests/cli/managed-files.test.mjs` に追加する。

## 入力

- SPEC-0062 AC-01 / AC-02 / AC-03 / AC-04 / AC-05 / AC-06、FR-05 / FR-06 / FR-07、NFR-03 / NFR-04 / NFR-05、INV-03、POST-01 / POST-02、異常系3 / 異常系4、既存実装との衝突点、実装メモ「後方互換テスト」、PLAN-0062 実装リスク8
- テスト対象と検証内容:
  1. **AC-01（PM 別描画不変性・YAML 妥当性）**: `renderedCiWorkflow(fileName, pm)` を 4 PM（pnpm / npm / yarn / bun）× 2 direct file（`ai-check.yml` / `ai-check-fast.yml`）で描画し、(a) 既存の軽量 YAML 妥当性検証手段（`tests/cli` が既に使う手段。actionlint 等の外部依存を入れない — NFR-03）でパース可能、(b) active な job 構造（`jobs:` 直下の step 列と実行コマンド）が本 SPEC 適用前と同一（追加はコメント雛形のみ）であることを確認する
  2. **AC-02（SARIF 3 要素存在 / fast 不在）**: `ai-check.yml`（4 PM 描画いずれでも）に `semgrep scan --sarif` / `github/codeql-action/upload-sarif` / `security-events: write` の 3 要素が grep でヒットする（既定コメント状態のためコメント行にヒットしてよい）。`ai-check-fast.yml` に SARIF 要素が不在であることを grep で検証（FR-01）
  3. **AC-03（`security:sast` 無変更）**: `src/cli/profile-scripts.mjs` に `semgrep scan --config auto` がヒットし、SARIF 経路が package script を変えていないことを検証（FR-02 / INV-02 / SPEC-0051 FR-02）。**補記**: `package-templates/package.scripts.fragment.json`（L9）と `src/cli/profile-scripts.mjs`（L62）はいずれも `"security:sast": "semgrep scan --config auto"` を持ち実在する。AC-03 は両ファイルの当該行が無変更であることを検証する（SARIF は CI テンプレ側の別ステップで package script を変えない）
  4. **AC-04（paths / matrix / 案内存在）**: `ai-check.yml` / `ai-check-fast.yml` に `paths:` を含むコメント雛形と workspace ディレクトリ glob 例が存在し、OPS-02 の required check 全スキップ回避の案内文が同ファイルまたは docs に存在する。`ai-check.yml` に `strategy:` / `matrix:` を含む matrix 例が存在する（grep で検証 = FR-03 / FR-04）
  5. **AC-05（未改変 auto-follow + managed 判定）**: 未改変の CI テンプレ（更新後テンプレの 4 PM 変種のいずれか）を持つ target への `update`（フラグなし）が `local == baseline` 経路で auto-follow し、`isManagedCiWorkflowContent('ai-check.yml' | 'ai-check-fast.yml', content)` が更新後 4 変種を managed と判定する（FR-06 / POST-01。既存 `tests/cli/update.test.mjs` の `scripts/ai-check.sh` 等 3-way ケースと同一パターンを CI file に適用）
  6. **AC-06（改変済み skip-modified + `--force-managed`）**: 利用者が改変した CI テンプレ（`local != baseline` かつ `local != 新 upstream`）を持つ target への `update`（フラグなし）が `skip-modified` で既存改変を保護し、`--force-managed` 指定時のみ `.bak-<version>` を書いてから上書きする（FR-07 / POST-02。既存 3-way ケースを CI file に適用）
- テストケース名は日本語 + AC-N / FR-N / INV-N 参照コメント（AP-07 対策）
- 既存の CI 関連期待値（`managed-files.test.mjs` L48-52 の managed paths リスト等）は変更せず、追加ケースのみ足す（PLAN-0062 実装リスク8 / 既存実装との衝突点）

## 出力

- `tests/cli/ci-workflows.test.mjs`（新規）: AC-01（4 PM × 2 file の YAML 妥当性 + active 構造不変）/ AC-02（SARIF 3 要素存在 + fast 不在）/ AC-03（`security:sast` 無変更）/ AC-04（paths / matrix / 案内存在）
- `tests/cli/update.test.mjs`（追記）: AC-05（CI テンプレ未改変 auto-follow）/ AC-06（CI テンプレ改変済み skip-modified + `--force-managed` で `.bak-<version>`）の追加ケースのみ。既存 3-way ケースの期待値は変えない
- `tests/cli/managed-files.test.mjs`（追記）: AC-05 の `isManagedCiWorkflowContent` 更新後 4 変種一致の追加ケースのみ。既存ケースの期待値は変えない

## File Scope（変更許可範囲）

- 作成: `tests/cli/ci-workflows.test.mjs`
- 変更: `tests/cli/update.test.mjs`, `tests/cli/managed-files.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- テストを通すために実装（テンプレ / `ci-workflows.mjs` / 3-way ロジック）を歪めることの禁止 — テストは確定済みテンプレ挙動を固定する。実装を変える必要が生じたら TASK-0222 / TASK-0223 に戻す（src-rules.md「Fix implementation to pass existing tests」の逆方向禁止）
- 既存 CI 関連テストの期待値（managed paths リスト・既存 3-way ケース・PM 別描画の active 部分）を書き換えることの禁止 — 追加ケースのみ足す（NFR-01 / PLAN-0062 実装リスク8。検出: レビューで既存期待値の diff ゼロ確認）
- 外部 YAML パーサ（actionlint 等）を新規 npm 依存として追加することの禁止 — 既存の軽量検証手段に揃える（NFR-02 / NFR-03。検出: `tests/cli/package.test.mjs` の dependencies 検査）
- SPEC-0056 3-way ロジック本体（`managed-files.mjs` / `install-state.mjs` / `update.mjs`）を変更することの禁止 — テストは既存経路を再利用（ASM-03。検出: File Scope 外 = `templates/hooks/check-file-scope.sh`）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、テストケース名の英語化禁止（日本語 + AC-N 参照必須 — AP-07）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-01: `renderedCiWorkflow` の 4 PM × 2 direct file 出力が YAML 妥当かつ active 構造不変であるテストがパスする（NFR-03 / INV-03 / PRE-01）
- [ ] AC-02: `ai-check.yml` の SARIF 3 要素存在 + `ai-check-fast.yml` の SARIF 不在の grep 検証がパスする（FR-01）
- [ ] AC-03: `package-templates/package.scripts.fragment.json` L9 と `src/cli/profile-scripts.mjs` L62 の `semgrep scan --config auto` が両方無変更であることを検証するテストがパスする（FR-02 / INV-02）
- [ ] AC-04: paths filter 例 + OPS-02 案内 + matrix 例の grep 検証がパスする（FR-03 / FR-04）
- [ ] AC-05: 未改変 CI テンプレの update auto-follow + `isManagedCiWorkflowContent` 更新後 4 変種一致のテストがパスする（FR-06 / POST-01）
- [ ] AC-06: 改変済み CI テンプレの update skip-modified + `--force-managed` で `.bak-<version>` 書き込み後上書きのテストがパスする（FR-07 / POST-02）
- [ ] `node --test tests/cli/ci-workflows.test.mjs` がパスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストが無修正で pass する（AC-01 / NFR-01）
- [ ] 既存の CI 関連テストの期待値 diff がゼロで、追加ケースのみである（レビューで確認）
- [ ] 追加テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] NFR-04 の各分岐（SARIF 3 要素 / fast 不在 / paths / matrix / PM 別描画不変性 / 3-way 未改変 / 3-way 改変済み）に最低 1 テストケースが対応している
- [ ] commit message に TASK-0224 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0062-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
