# TASK-0217: docs/cli.md への profile composition 節の追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0217 |
| SPEC-ID   | SPEC-0060 |
| PLAN-ID   | PLAN-0060 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0216（競合 = エラーの規則が実装・テストで確定していること — 確定前の規則を文書化しない） |
| 見積     | 1h |

## 責務

`docs/cli.md` に profile composition 節を追加する: 文法（`+` / `,` 等価、base ちょうど 1 + addon 0 個以上、重複・未知名はエラー）、マージ順（base → addon 宣言順）、`ai:check` への addon step 追記規則（`&&` 連結・重複 step 排除）、同名 script キー競合 = エラー、現行 addon 一覧（`supabase-rls`）、複数 addon 構文 `base+addon1+addon2`（SPEC T3 / FR-06）。

## 入力

- SPEC-0060 FR-06、AC-07、契約 (1)〜(4)、OPS-01（addon 一覧更新漏れは AC-07 grep で検出）
- 記載内容の一次情報源: TASK-0215 / TASK-0216 で確定した実装・テストの実挙動（存在しない挙動を記載しない — AP-07）
- `docs/cli.md` には既に profile 別 scripts の説明節がある → 合成規則節はその近傍に追加し、既存記述と矛盾しないよう相互参照する（SPEC 既存実装との衝突点）
- 言語規約: docs/cli.md への追記は英語（既存 cli.md に合わせる）。節見出し等に "profile composition" の字句を含める（AC-07 の grep 対象）

## 出力

- `docs/cli.md`: profile composition 節（マージ順 declaration order・競合時挙動 error・addon 一覧 supabase-rls の 3 点を同節に含む）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `docs/cli.md`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `docs/cli.md` の既存記述（profile 別 scripts 節等）の削除・改変禁止 — 合成規則節の additive 追加と相互参照のみ
- 存在しないオプション・挙動の記載禁止 — 記載内容は TASK-0215 / TASK-0216 の実装・テストの実挙動と一致させる（AP-07）
- `README.md` / `README-en.md` への追記禁止 — README ja/en は CLI 詳細を docs/cli.md に委譲済みのため対象外（SPEC File Scope）
- `src/cli/` / `tests/cli/` / `package-templates/` 配下への変更禁止（File Scope 外。検出: diff 検査 + `templates/hooks/check-file-scope.sh`）
- docs に secret 直書き・内部関数（テスト注入用 export）の記載禁止（SEC-01 / PLAN 実装リスク6）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装中に想定外エラー（既存 docs 記述と確定規則の矛盾発見等）が発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-07: `grep -q 'profile composition' docs/cli.md` がヒットし、マージ順（declaration order）・競合時挙動（error）・addon 一覧（supabase-rls）の 3 点が同節に含まれる（レビューで確認）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01）
- [ ] `make validate` 等既存 preflight が壊れない
- [ ] commit message に TASK-0217 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0060-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
