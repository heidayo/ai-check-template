# TASK-0235: docs/cli.md への custom profile 節追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0235 |
| SPEC-ID   | SPEC-0065 |
| PLAN-ID   | PLAN-0065 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No（TASK-0234 で確定した挙動を docs 化するため最後） |
| 依存TASK  | TASK-0234 |
| 見積     | 1h |

## 責務

`docs/cli.md` に `--profile-file` / custom profile の節を追加する（SPEC T4、FR-08 / SEC-01 / SEC-04）。init / update / doctor の option 表に `--profile-file` 行を足し、custom profile の指定方法・定義ファイル schema・built-in（4 base + supabase-rls）との棲み分け・command 直書き実行の信頼境界 + secret 非直書き案内を記載する。TASK-0234 で確定した挙動のみを文書化する（未確定仕様を先に書かない）。

## 入力

- SPEC-0065 FR-08（built-in との棲み分けの明示）、SEC-01（command 直書き実行の信頼境界）/ SEC-04（secret 非直書き案内）、AC-08、契約 (2)(3)、リスク3 / リスク5、言語規約（`docs/cli.md` への追記は英語）
- 記載必須 4 点（AC-08、同一節に含める）: (1) `custom:<name>` の指定方法（`--profile custom:mystack --profile-file ./.ai-check-profile.yaml`）、(2) 定義ファイル schema（`version: 1` / `profile.name` / `profile.gateScripts`（`ai:check` / `ai:check:fast` / `ai:check:secure` 網羅）/ `profile.supportScripts` / `profile.devDependencies?`）、(3) built-in（4 base + supabase-rls）との棲み分け（custom は `supportedProfiles` に足さない別経路）、(4) command 直書き実行の信頼境界（定義ファイルの command がそのまま package.json scripts に書き込まれ実行される。信頼できない定義ファイルを使わない）+ secret 非直書き案内（command に secret を直書きせず env var / secret manager 経由に）
- 追記点（既存 `docs/cli.md` に合わせる）: init / update / doctor の option 表に `--profile-file <path>` 行、custom profile 節（`--workspace` 節と同様の構成）。「custom profile は vX.Y 以降」を明記（リスク3）。既存 `--profile` の built-in 説明は不変
- 例示は非機密プレースホルダ（実 secret / 本番 URL / 本番 email を書かない — SEC-04）

## 出力

- `docs/cli.md`（変更）: init / update / doctor の option 表への `--profile-file` 行 + custom profile 節（4 点 + バージョン注記）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `docs/cli.md`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- 定義ファイル / docs への実 secret / 本番 URL / 本番 email の混入の禁止 — 例示は非機密プレースホルダ、command は env var 経由を案内（検出: AC-08 のレビュー + docs の grep — SEC-04）
- TASK-0234 で未確定の挙動（custom addon / 合成 / 複数 custom 等の将来機能）を確定仕様として書くことの禁止 — v1 は custom base 1 つのみ（検出: レビュー）
- 既存 `--profile` の built-in 説明の変更の禁止（検出: レビューで diff が追加のみであることの確認）
- File Scope 外への変更の禁止（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認する（Error Resolution Protocol）
- [ ] AC-08: `grep -q '\-\-profile-file' docs/cli.md` がヒットし、(1) `custom:<name>` 指定方法、(2) 定義ファイル schema、(3) built-in（4 base + supabase-rls）との棲み分け、(4) command 直書き実行の信頼境界 + secret 非直書き案内、の 4 点が同節に含まれることをレビューで確認する（FR-08 / SEC-01 / SEC-04）
- [ ] `docs/cli.md` に実 secret / 本番 URL / 本番 email が含まれないことを grep で確認する（SEC-04）
- [ ] `make validate` / `npm pack --dry-run` が壊れない（`docs/cli.md` は `package.json` `files` に含まれる既存同梱ファイル。preflight 検査を壊さない）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし続ける（docs のみの変更で回帰なし = AC-06）
- [ ] commit message に TASK-0235 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0065-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
