# TASK-0005: philosophy docs 全 AC 機械検証 + 用語整合手動レビュー

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0005 |
| SPEC-ID   | SPEC-0001 |
| PLAN-ID   | PLAN-0001 |
| ステータス | Done |
| 担当Agent | Test / Review |
| 並列可否  | No（最終 TASK、TASK-0001..0004 全完了後に実行） |
| 依存TASK  | TASK-0001, TASK-0002, TASK-0003, TASK-0004 |
| 見積     | 30m |

## 責務

`package-templates/docs/philosophy/` 配下の 4 ファイルに対し、SPEC-0001 の受け入れ条件 AC-01..AC-08 を機械検証で実行し、加えて 4 文書間の用語意味整合を手動レビューする。

## 入力

- SPEC-0001 §受け入れ条件 AC-01..AC-08
- SPEC-0001 §Properties INV-01, INV-02, INV-03, POST-01, POST-02, POST-03
- PLAN-0001 §Quality Gate マッピング
- TASK-0001..0004 の成果物（4 ファイル）

## 出力

- 検証ログ（RUN-XXXX.yaml に記録）
- AC-01..AC-08 全 pass の確認
- 用語整合レビュー結果（PASS / FAIL with findings）

## File Scope（変更許可範囲）

- 作成: なし（検証のみ）
- 変更: なし（検証中に欠陥発見時は該当 TASK を再オープン、本 TASK では修正しない）
- 削除: なし
- 読み込み許可: `package-templates/docs/philosophy/*.md`, `specs/SPEC-0001*.md`, `plans/PLAN-0001*.md`

**変更禁止**:
- すべての philosophy doc ファイル（検証は read-only）
- 検証中に欠陥を発見した場合: 本 TASK で修正せず、該当 TASK（0001..0004）を再オープンして修正させる

## 禁止事項

- 検証中に philosophy doc を書き換える（Verify Agent は read-only）
- SPEC-0001 / PLAN-0001 を変更する
- AC 失敗を見逃して TASK を Done にする
- 用語整合レビューを目視のみで済ませる（findings を文書化）

## 完了条件

### Phase 1: 機械検証（AC-01..AC-08 全 pass）

- [ ] AC-01: `ls package-templates/docs/philosophy/{formal-name-match,test-pyramid,given-when-then,qa-techniques}.md` 全成功
- [ ] AC-02: `head -1 package-templates/docs/philosophy/*.md | grep -c "^# "` が 4 を返す
- [ ] AC-03: `grep -l "^## 出典" package-templates/docs/philosophy/*.md | wc -l` が 4 を返す
- [ ] AC-04: `grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/docs/philosophy/` の出力が空（終了コード 1）
- [ ] AC-05: `grep -l "形名参同" package-templates/docs/philosophy/*.md | wc -l` が 4 を返す
- [ ] AC-06: `wc -l package-templates/docs/philosophy/*.md | awk 'NR<=4 && ($1<100 || $1>600){exit 1}'` が終了コード 0
- [ ] AC-07: `grep -l "Draft v0.1" package-templates/docs/philosophy/*.md | wc -l` が 4 を返す
- [ ] AC-08: 主要概念カバー検証コマンド全成功（SPEC-0001 AC-08 の 4 つの grep を順次実行）

### Phase 2: 用語整合手動レビュー

- [ ] 「形名参同」の定義が `formal-name-match.md` の §概念定義 と、他 3 ファイルでの言及が矛盾しない
- [ ] 「責務分割」の定義が `test-pyramid.md` の §各層の定義 と、他 3 ファイルでの言及が矛盾しない
- [ ] 「Given-When-Then」の構文が `given-when-then.md` の §GWT 構文 と、他 3 ファイルでの引用が矛盾しない
- [ ] 「QA 技法」の 6 技法名称が `qa-techniques.md` と、他 3 ファイルでの言及で一致する
- [ ] 4 ファイルの §隣接する思想との関係 セクションで相互リンクが機能する（ファイル名で参照）

### Phase 3: Architecture Gate（Properties INV-01..INV-03）

- [ ] INV-01: `find package-templates/docs/philosophy -name "*.md" | wc -l` が 4 を返す、かつ `find templates/ sage/ .sage/ -name "formal-name-match*.md" -o -name "test-pyramid*.md" -o -name "given-when-then*.md" -o -name "qa-techniques*.md" 2>/dev/null | wc -l` が 0 を返す（混在なし）
- [ ] INV-02: AC-04 で機械検証済（gakuten 固有語不在）
- [ ] INV-03: TASK-0001..0004 の File Scope hook 違反ログがない（`grep -l "File Scope violation" .sage/runs/*.yaml 2>/dev/null` が空）

### 失敗時の対応

- AC のいずれかが失敗 → 該当 TASK（0001..0004）を再オープン、修正後再検証
- 用語整合の手動レビューで矛盾発見 → findings を本 TASK の実行ログに記録、該当 TASK を再オープン
- 同一 TASK が連続 3 回失敗 → `same_fail_abort_threshold: 3`（`.sage/config.yaml`）で human escalation

## Done Definition（ラウンド単位）

参照: SPEC-0001 受け入れ条件 AC-01..AC-08 全件 pass + 本 TASK §完了条件 Phase 1..3 全件 pass。

## SPEC/PLAN 継承事項

本 TASK は SPEC-0001 および PLAN-0001 から以下を継承する。本 TASK は最終検証 TASK のため、特に検証側の継承を重視する。

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate マッピング | PLAN-0001 §Quality Gate マッピング | 本 TASK で全 Gate (1, 2, 4) を一括検証。Gate 3, 5 は N/A |
| テスト種別 | PLAN-0001 §必要な検証 | structural test + architecture boundary check + 手動 review |
| カバレッジ閾値 | SPEC-0001 §非機能要件 NFR-04 | N/A。代替指標は AC-08（主要概念カバー検証） |
| commit-msg hook | SPEC-0001 §契約 | 検証結果コミット時に TASK-0005 を含める |
| Error Resolution | SPEC-0001 §Error Resolution 手順 | AC 失敗時、該当 TASK を再オープン |
| failures.md / anti-patterns.md 連携 | PLAN-0001 §Knowledge Management | 検証で発見した失敗パターンを failures.md に記録 |
| 採用メトリクス | PLAN-0001 §採用メトリクス | TASK 完了 + AC-01..AC-08 全 pass で SPEC-0001 を Approved 化 |
| 段階移行 | PLAN-0001 §段階移行 | TASK-0005 完了 → PLAN-0001 Completed → SPEC-0001 Approved → Phase 1 開始 |
| ロールバック手順 | PLAN-0001 §ロールバック手順 | Level 2: AC 複数失敗時、`git checkout HEAD -- package-templates/docs/philosophy/` で 4 ファイル一括復元 |

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | （TBD） |
| 完了     | （TBD） |
| 結果     | （TBD） |
| Gate結果  | structural: TBD / functional: TBD / security: N/A / architecture: TBD |
