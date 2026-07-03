# TASK-0221: docs/cli.md への `--workspace` 節追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0221 |
| SPEC-ID   | SPEC-0061 |
| PLAN-ID   | PLAN-0061 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（確定した挙動を docs 化するため TASK-0220 完了後 — SPEC T4 依存順序） |
| 依存TASK  | TASK-0220 |
| 見積     | 1h |

## 責務

`docs/cli.md` に `--workspace` 節を追加する（SPEC T4 / FR-07 / AC-08）。オプション仕様（init / update / doctor 共通・相対パス・単一指定制限）、配置規則（root gate scripts / package step scripts、managed files と state はルート据え置き）、`.ai-check.yaml` との関係（config が run gate で優先され、本機能はその初期値を提供する雛形レイヤ）、および「workspace モードは vX.Y 以降」（リスク2 の旧 CLI 互換注記）を記載する。

## 入力

- SPEC-0061 FR-01 / FR-07 / FR-08、AC-08、契約 (1)〜(4)、スコープ外（複数 workspace・`--install-deps` 併用・Turborepo/Nx）、リスク2、実装メモ「言語規約」節
- TASK-0218〜0220 で確定した実装挙動（エラーメッセージ・PM 4 種の invocation 形・bun バージョン注記）
- 言語規約: docs/cli.md への追記は英語（既存 cli.md に合わせる）。既存の init / update / doctor オプション節の近傍に追加し相互参照する

## 出力

- `docs/cli.md`: `--workspace` 節（AC-08 の 3 点 — 配置規則（root gate / package steps）・単一指定制限・`.ai-check.yaml` 優先の関係 — を同節に含む + `--install-deps` 併用不可 + 旧バージョン互換注記）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `docs/cli.md`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- 実装と一致しない仕様（未確定の複数 workspace 対応・未検証 invocation 形等）の記載禁止 — TASK-0220 完了時点の確定挙動のみ（検出: レビューで実装との照合）
- `src/` / `tests/` / `package-templates/` への変更禁止（File Scope 外。検出: `templates/hooks/check-file-scope.sh` + diff 検査）
- スコープ外機能（複数指定・Turborepo 統合）を提供済みとして記載することの禁止
- TODO/FIXME 残留禁止
- commit message に対応する TASK-ID を含めないコミットの禁止

## 完了条件

- [ ] 実装中に想定外エラーが発生した場合、`sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-08: `grep -q '\-\-workspace' docs/cli.md` がヒットする
- [ ] AC-08: 配置規則（root gate / package steps）・単一指定制限・`.ai-check.yaml` 優先の関係の 3 点が同節に含まれる（レビューで確認）
- [ ] リスク2 の「workspace モードは vX.Y 以降」の互換注記が含まれる
- [ ] `make validate` / 既存 preflight（`npm pack --dry-run` 含む）が壊れない
- [ ] `node --test tests/cli/*.test.mjs` が全件パスする（AC-01、docs のみの変更で当然に維持）
- [ ] commit message に TASK-0221 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0061-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
