# TASK-0014: 実行スタック AC 機械検証 + 整合手動レビュー

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0014 |
| SPEC-ID   | SPEC-0003 |
| PLAN-ID   | PLAN-0003 |
| ステータス | Done |
| 担当Agent | Test / Review |
| 並列可否  | No（最終） |
| 依存TASK  | TASK-0011, TASK-0012, TASK-0013 |
| 見積     | 25m |

## 責務

SPEC-0003 AC-01..AC-14 の機械検証と、hook command と scripts コマンドの整合の手動レビュー。

## 入力

- SPEC-0003 §受け入れ条件 AC-01..AC-14
- SPEC-0003 §Properties INV-01..INV-04
- PLAN-0003 §Quality Gate マッピング
- TASK-0011..0013 の成果物（合計 7 ファイル）

## 出力

- AC-01..AC-14 全 pass の確認
- hook ⇄ scripts ⇄ npm scripts のコマンド整合確認

## File Scope

検証のみ（書き込みなし）。読み込み許可: `package-templates/scripts/`, `package-templates/.claude/`, `package-templates/package.scripts.fragment.json`, `specs/SPEC-0003*.md`, `plans/PLAN-0003*.md`

## 禁止事項

- 検証中の書き換え
- SPEC / PLAN の変更
- AC 失敗の見逃し

## 完了条件

### Phase 1: 機械検証（SPEC-0003 AC-01..AC-14 全 pass）

具体的なコマンドは SPEC-0003 §受け入れ条件 を参照。Verify Agent は全 14 AC を順次実行する。

### Phase 2: 整合手動レビュー

- [ ] hook fragment の `pnpm ai:check:fast` ⇄ scripts/ai-check-fast.sh の `${PM} ai:check:fast` ⇄ package.scripts.fragment.json の `ai:check:fast` キーが対応
- [ ] hook fragment の `pnpm ai:check` ⇄ scripts/ai-check.sh の `${PM} ai:check` ⇄ package.scripts.fragment.json の `ai:check` キーが対応
- [ ] scripts/README.md と .claude/README.md の参照リンクが有効（相対パス）
- [ ] test-rules.md の Playwright Locator 5 種が philosophy/test-pyramid.md と整合

### Phase 3: Architecture Gate（Properties INV-01..INV-04）

- [ ] INV-01: 全 7 ファイルが `package-templates/` 配下のみ
- [ ] INV-02: スクリプトに任意コード実行パターンなし
- [ ] INV-03: secret 直書きなし
- [ ] INV-04: hook ⇄ scripts ⇄ npm scripts のコマンド一致

### 失敗時の対応

- AC 失敗 → 該当 TASK（0011..0013）を再オープン
- 整合性矛盾 → findings を実行ログに記録、該当 TASK 再オープン
- 連続 3 回失敗 → human escalation

## Done Definition

SPEC-0003 AC-01..AC-14 全 pass + Phase 2/3 全 pass。

## SPEC/PLAN 継承事項

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate | PLAN-0003 §Quality Gate | Gate 1 / 2 / 3 / 4 一括検証 |
| テスト種別 | PLAN-0003 §必要な検証 | structural + syntax + functional + security + architecture + 手動 review |
| カバレッジ | SPEC-0003 §NFR-05 | N/A |
| commit-msg hook | SPEC-0003 §契約 | 検証結果コミット時に TASK-0014 |
| Error Resolution | SPEC-0003 §Error Resolution | AC 失敗時、該当 TASK 再オープン |
| failures.md / anti-patterns.md | PLAN-0003 §Knowledge Management | 検証で発見した失敗パターンを失敗ログ |
| 採用メトリクス | PLAN-0003 §採用メトリクス | TASK 完了 + 全 AC pass で SPEC-0003 Approved 化 |
| 段階移行 | PLAN-0003 §段階移行 | TASK 完了 → PLAN Completed → SPEC Approved → Phase 0 サブ成果物 5/7 |
| ロールバック | PLAN-0003 §ロールバック | Level 2: 全 7 ファイル一括復元 |

## 実行ログ

| フィールド | 内容 |
|---|---|
| RUN-ID | （実行時） |
| 開始 | （TBD） |
| 完了 | （TBD） |
| 結果 | （TBD） |
| Gate結果 | structural / functional / security / architecture: TBD |
