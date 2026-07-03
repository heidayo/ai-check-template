# TASK-0218: workspace 検証モジュール + PM 別 workspace invocation

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0218 |
| SPEC-ID   | SPEC-0061 |
| PLAN-ID   | PLAN-0061 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0219 / TASK-0220 が本モジュールに依存する下位モジュール先行） |
| 依存TASK  | なし |
| 見積     | 3h |

## 責務

`src/cli/workspace.mjs` を新規作成し、`resolveWorkspace(targetDir, pkgDir)` に FR-02 / SEC-01 / SEC-02 の全検証を集約する（SPEC T1）。あわせて `src/cli/package-manager.mjs` に `workspaceScriptCommand(packageManager, workspace, scriptName)` を追加し、PM 4 種の workspace スコープ付き invocation 生成を 1 関数に集約する。検証・invocation を `tests/cli/workspace.test.mjs`（新規）で固定する。

## 入力

- SPEC-0061 FR-02 / FR-03、SEC-01 / SEC-02、NFR-02 / NFR-04（分岐 (1)〜(4)）、AC-02（invocation 部分）/ AC-06 / AC-07、想定エラー1〜4、境界ケース2、契約 (1)(2)、実装メモ「`src/cli/workspace.mjs` の責務」「invocation 生成」節、INV-04、リスク1
- `resolveWorkspace` の順序: SEC-01 パス検証（絶対パス・`..` セグメント・シェルメタ文字（空白・`;` `&` `|` `$` 等）拒否、正規化後パスが target 配下であること、正規化後 pkg-dir が空 = `--workspace .` は CliError）→ FR-02 (a) workspace ルート判定（`<target>/pnpm-workspace.yaml` の**存在チェックのみ**、または root `package.json` の `workspaces` フィールド（配列 or `{ packages: [...] }`））→ (b) `<target>/<pkg-dir>` がディレクトリとして存在 → (c) `<target>/<pkg-dir>/package.json` に非空文字列 `name`（SEC-02: `[A-Za-z0-9@/._-]+` に一致しなければ CliError）→ `{ dir, name }`（dir は `/` 区切り正規化相対パス）を返す
- invocation 形（FR-03。実装前に各 PM 公式ドキュメントと照合し確定する — src-rules.md AI Output Verification / リスク1）: pnpm `pnpm --filter <name> <step>` / npm `npm run <step> --workspace <pkg-dir>` / yarn `yarn workspace <name> <step>` / bun `bun run --filter <name> <step>`。bun `--filter` のサポートバージョンをテストファイルのコメントに記録する（AC-02 の括弧書き要件）
- エラーメッセージ: 想定エラー1（pkg-dir と target を含む）/ 2（name 付き package.json が必要な旨）/ 3（判定に使った 2 検出手段を明記）に従う
- exit code 規約: `CliError` で表現し `process.exit` 直呼びをしない

## 出力

- `src/cli/workspace.mjs`（新規）: `resolveWorkspace` + SEC-02 の name / dir パターン検証
- `src/cli/package-manager.mjs`（追記）: `workspaceScriptCommand`（既存 `scriptCommand` と並置。既存関数・既定値は不変）
- `tests/cli/workspace.test.mjs`（新規）: AC-06 — (a)(b)(c) 各失敗の CliError + 成功ケース（NFR-04 分岐 (1)〜(3) の成功/失敗）、AC-07 — `../outside`・絶対パス・シェルメタ文字入り pkg-dir・不正 `name` の各 CliError、境界ケース2（`--workspace .`）、AC-02 invocation 部分 — PM 4 種の文字列組み立て（NFR-04 分岐 (4)）。テストケース名は日本語 + AC-N / FR-N 参照コメント

## File Scope（変更許可範囲）

- 作成: `src/cli/workspace.mjs`, `tests/cli/workspace.test.mjs`
- 変更: `src/cli/package-manager.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- workspace ルート判定・パス検証を warning で続行する実装の禁止 — FR-02 / SEC-01 / SEC-02 は CliError で fail-fast のみ（検出: AC-06 / AC-07 のテスト）
- `pnpm-workspace.yaml` の YAML パース・パーサ依存の追加の禁止 — 存在チェックのみ（検出: `tests/cli/package.test.mjs` の dependencies 検査 + レビュー）
- 検証済みでない PM invocation 形（実 PM ドキュメント未照合の `--filter` 構文等）のコミットの禁止（検出: レビューで各 PM 公式ドキュメントの参照確認）
- 対象パッケージ `name` / pkg-dir の未検証埋め込み（SEC-02 パターン検証のバイパス）の禁止（検出: AC-07 のテスト）
- 既存 `scriptCommand` / `detectPackageManager` の挙動変更の禁止（NFR-01。検出: AC-01 の既存テスト無修正 pass）
- File Scope 外への変更の禁止 — 特に `run.mjs` / `check-config.mjs` / `managed-files.mjs` / `package-templates/`（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止、npm 依存追加禁止（NFR-02）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。workspace ルート判定の誤検知は原因タグ『workspace: ルート判定誤検知』を付す — OPS-01）
- [ ] AC-06: (a)(b)(c) 全サブケースが CliError（非 0 終了相当）になるテストがパスする（FR-02 / PRE-01）
- [ ] AC-07: SEC-01 / SEC-02 の全入力パターンが CliError になるテストがパスする（INV-04）
- [ ] AC-02 invocation 部分: PM 4 種の `workspaceScriptCommand` 出力が FR-03 の形と一致するテストがパスし、bun の `--filter` サポートバージョンがテストコメントに記録されている（NFR-04 分岐 (4)）
- [ ] `node --test tests/cli/workspace.test.mjs` がパスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストが無修正で pass する（AC-01 / NFR-01）
- [ ] 追加テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0218 を含める（commit-msg hook で強制）

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
