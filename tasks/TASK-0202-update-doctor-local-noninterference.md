# TASK-0202: update / doctor の local 領域不干渉検証

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0202 |
| SPEC-ID   | SPEC-0057 |
| PLAN-ID   | PLAN-0057 |
| ステータス | Pending |
| 担当Agent | Implementation / Test |
| 並列可否  | No |
| 依存TASK  | TASK-0199, TASK-0201 |
| 見積     | 2h |

## 責務

update / doctor が `ai-check.local.sh` と `.claude/rules/local/` 配下に一切書き込み・削除・drift 判定を行わないことをテストで検証し、旧テンプレート（source 行なし）からの 3-way 自動更新（NFR-01）を検証する（FR-04 / FR-05 / AC-03 / AC-04 / AC-06 / INV-02）。実装変更は不干渉テストが失敗した場合のみ SPEC File Scope 内で最小限行う。

## 入力

- SPEC-0057 FR-04 / FR-05、AC-03 / AC-04 / AC-06、INV-02、NFR-01、ASM-03（SPEC-0056 の 3-way update 実装済み）
- `src/cli/update.mjs` / `src/cli/doctor.mjs`（SPEC-0056 実装済み。managed 一覧非包含により原則変更不要の想定）
- 既存テストパターン: `tests/cli/update.test.mjs` の 3-way テスト（TASK-0196）、`tests/cli/doctor.test.mjs` の drift 状態テスト（TASK-0197）
- AC-06 の前提: テンプレート内容変更（TASK-0199）により未改変プロジェクトで local==baseline != upstream → update 分岐に入る

## 出力

- AC-03: `ai-check.local.sh` + `.claude/rules/local/` 配下にユーザーファイルを置いた状態で update してもファイルが変更・削除されず、operations に managed 対象として現れないテスト（内容・存在の前後比較 — INV-02）
- AC-04: 同状態で doctor の結果が local ファイル無しの場合と同一であるテスト（FR-05）
- AC-06: 旧テンプレート scripts + v2 install state で update → 未改変 scripts は source 行入りへ自動更新、改変済み scripts は skip-modified（NFR-01）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`, `src/cli/update.mjs` / `src/cli/doctor.mjs`（不干渉テスト失敗時の最小修正が必要な場合のみ）
- 削除: なし

## 禁止事項

- update / doctor に `.claude/rules/local/` 配下または `ai-check.local.sh` へ書き込み・削除・drift 判定を行うコードの追加禁止（SPEC Forbidden Shortcuts — 本 TASK は「触らない」ことの検証）
- `src/cli/managed-files.mjs` への変更禁止（SPEC File Scope 外）
- scripts テンプレート / init / docs への変更禁止（TASK-0199/0201/0203 の責務 — AP-03）
- テストを通すためのテスト側修正の禁止（src-rules.md）、TODO/FIXME 残留禁止。実装修正で File Scope を超える場合は SPEC 改訂を起票（Error Resolution Protocol）

## 完了条件

- [ ] 実装中に想定外の drift 誤検出等が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）

- [ ] AC-03: local ファイル配置状態での update 前後で `ai-check.local.sh` と `.claude/rules/local/` 配下の全ファイルの内容・存在が不変であり、operations に managed 対象として現れないテストがパスする（FR-02 / FR-04 / INV-02）
- [ ] AC-04: 同状態の doctor 結果が local ファイル無しの場合と同一であるテストがパスする（FR-05）
- [ ] AC-06: 旧テンプレート（source 行なし）+ v2 install state で update → 未改変は自動更新・改変済みは skip-modified のテストがパスする（NFR-01、既存 3-way テストパターン踏襲）
- [ ] `node --test tests/cli/update.test.mjs tests/cli/doctor.test.mjs` が全件パスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] 各テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0202 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0057-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
