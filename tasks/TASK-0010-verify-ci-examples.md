# TASK-0010: ci-examples + 計画ドキュメント整合の機械検証 + 手動レビュー

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0010 |
| SPEC-ID   | SPEC-0002 |
| PLAN-ID   | PLAN-0002 |
| ステータス | Done |
| 担当Agent | Test / Review |
| 並列可否  | No（最終 TASK、TASK-0006..0009 全完了後に実行） |
| 依存TASK  | TASK-0006, TASK-0007, TASK-0008, TASK-0009 |
| 見積     | 20m |

## 責務

`package-templates/ci-examples/` 配下の 3 ファイル + 計画ドキュメント 3 ファイル更新に対し、SPEC-0002 の受け入れ条件 AC-01..AC-10 を機械検証で実行し、計画 vs 実装の整合を手動レビューする。

## 入力

- SPEC-0002 §受け入れ条件 AC-01..AC-10
- SPEC-0002 §Properties INV-01..INV-04, PRE-01..PRE-02, POST-01..POST-03, ASM-01..ASM-03
- PLAN-0002 §Quality Gate マッピング
- TASK-0006..0009 の成果物（新規 3 ファイル + 更新 3 ファイル）

## 出力

- 検証ログ（RUN-XXXX.yaml に記録）
- AC-01..AC-10 全 pass の確認
- 計画 vs 実装整合レビュー結果（PASS / FAIL with findings）

## File Scope（変更許可範囲）

- 作成: なし（検証のみ）
- 変更: なし
- 削除: なし
- 読み込み許可:
  - `package-templates/ci-examples/**`
  - `README.md`
  - `package-templates/README.md`
  - `.claude/rules/ai-check-template.md`
  - `specs/SPEC-0002*.md`
  - `plans/PLAN-0002*.md`

**変更禁止**:
- すべての対象ファイル（検証は read-only）
- 検証中に欠陥を発見した場合: 本 TASK で修正せず、該当 TASK（0006..0009）を再オープン

## 禁止事項

- 検証中にファイルを書き換える（Verify Agent は read-only）
- SPEC-0002 / PLAN-0002 を変更する
- AC 失敗を見逃して TASK を Done にする
- 整合レビューを目視のみで済ます（findings を文書化）

## 完了条件

### Phase 1: 機械検証（SPEC-0002 AC-01..AC-10 全 pass）

- [ ] AC-01: 4 ファイルすべて存在
  ```
  ls package-templates/ci-examples/README.md
  ls package-templates/ci-examples/github-actions/ai-check.yml
  ls package-templates/ci-examples/github-actions/ai-check-fast.yml
  ```
- [ ] AC-02: 2 つの YAML が `name:` キーを持つ
  ```
  grep -c "^name:" package-templates/ci-examples/github-actions/*.yml
  # → 2
  ```
- [ ] AC-03: 2 つの YAML が `jobs:` キーを持つ
  ```
  grep -c "^jobs:" package-templates/ci-examples/github-actions/*.yml
  # → 2
  ```
- [ ] AC-04: ci-examples README に H1 が存在
  ```
  head -1 package-templates/ci-examples/README.md | grep -q "^# "
  ```
- [ ] AC-05: `ai-check.yml` が `pnpm ai:check`（fast 以外）を呼ぶ
  ```
  grep -E "pnpm ai:check($|[^:])" package-templates/ci-examples/github-actions/ai-check.yml
  ```
- [ ] AC-06: secret 直書きパターンが空
  ```
  grep -iE "(api[-_]?key|secret|token|password)\s*[:=]\s*['\"]" package-templates/ci-examples/ \
    | grep -v '\${{ secrets\.' \
    # 出力なし
  ```
- [ ] AC-07: gakuten 固有語が全 6 対象ファイルに含まれない
  ```
  grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" \
    package-templates/ci-examples/ README.md package-templates/README.md .claude/rules/ai-check-template.md
  # 出力なし
  ```
- [ ] AC-08: `ai-check-fast.yml` が `pnpm ai:check:fast` を呼ぶ
  ```
  grep -q "pnpm ai:check:fast" package-templates/ci-examples/github-actions/ai-check-fast.yml
  ```
- [ ] AC-09: 計画ドキュメント 3 ファイルすべてに `ci-examples` 言及
  ```
  grep -l "ci-examples" README.md package-templates/README.md .claude/rules/ai-check-template.md | wc -l
  # → 3
  ```
- [ ] AC-10: `ci-examples` が `package-templates/` 配下にのみ存在
  ```
  find . -type d -name "ci-examples" -not -path "./node_modules/*" -not -path "./.git/*"
  # → ./package-templates/ci-examples のみ
  ```

### Phase 2: 計画 vs 実装整合手動レビュー

- [ ] SPEC-0002 §スコープ（含む）の 7 項目と実装ファイルの対応が取れている（漏れなし）
- [ ] SPEC-0002 §実装メモ §推奨 YAML 骨格と TASK-0006 / TASK-0007 の YAML 内容が semantically 一致
- [ ] PLAN-0002 §採用案 5 TASK 構成と起票された TASK-0006..0010 が一致
- [ ] 計画ドキュメント 3 ファイルの説明文（ci-examples セクション）が semantically 一致（食い違いなし）
- [ ] philosophy ドキュメント（`formal-name-match.md` / `test-pyramid.md`）への参照が ci-examples README で機能している

### Phase 3: Architecture Gate（Properties INV-01..INV-04）

- [ ] INV-01: `find package-templates/ci-examples` の結果が 3 ファイル、かつ `find templates/ sage/ .sage/ -name "ai-check*.yml" 2>/dev/null` が空
- [ ] INV-02: AC-07 で機械検証済
- [ ] INV-03: AC-06 で機械検証済
- [ ] INV-04: `grep -rE "templates/hooks|\.github/workflows" package-templates/ci-examples/` が空（CI 不問の独立性確保）

### 失敗時の対応

- AC のいずれかが失敗 → 該当 TASK（0006..0009）を再オープン、修正後再検証
- 整合性レビューで矛盾発見 → findings を本 TASK の実行ログに記録、該当 TASK を再オープン
- 同一 TASK が連続 3 回失敗 → `same_fail_abort_threshold: 3` で human escalation

## Done Definition（ラウンド単位）

参照: SPEC-0002 受け入れ条件 AC-01..AC-10 全件 pass + 本 TASK §完了条件 Phase 1..3 全件 pass。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0002 および PLAN-0002 から以下を継承する。本 TASK は最終検証 TASK のため、特に検証側の継承を重視する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0002 §Quality Gate マッピング | 本 TASK で全 Gate (1, 2, 3, 4) を一括検証 |
| テスト種別 | PLAN-0002 §必要な検証 | structural test + security scan + architecture boundary check + 手動 review |
| カバレッジ閾値 | SPEC-0002 §非機能要件 NFR-04 | N/A。代替指標は AC-09（計画ドキュメント整合） |
| commit-msg hook | SPEC-0002 §契約 | 検証結果コミット時に TASK-0010 を含める |
| Error Resolution | SPEC-0002 §Error Resolution 手順 | AC 失敗時、該当 TASK を再オープン |
| failures.md / anti-patterns.md 連携 | PLAN-0002 §Knowledge Management | 検証で発見した失敗パターンを failures.md に記録 |
| 採用メトリクス | PLAN-0002 §採用メトリクス | TASK 完了 + AC-01..AC-10 全 pass で SPEC-0002 を Approved 化 |
| 段階移行 | PLAN-0002 §段階移行 | TASK-0010 完了 → PLAN-0002 Completed → SPEC-0002 Approved → Phase 0 サブ成果物 2/7 |
| ロールバック手順 | PLAN-0002 §ロールバック手順 | Level 2: AC 複数失敗時、`git checkout HEAD -- package-templates/ci-examples/ README.md package-templates/README.md .claude/rules/ai-check-template.md` |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: TBD / architecture: TBD |
