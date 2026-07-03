# TASK-0220: init / update / doctor の `--workspace` 経路統合 + diagnostics 手当て

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0220 |
| SPEC-ID   | SPEC-0061 |
| PLAN-ID   | PLAN-0061 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0219 の state 解決 / 描画オプションに依存。File Scope 7 ファイルで SPEC 再検討条項（10 超で分割）に該当せず一括維持 — PLAN 実装方針 2） |
| 依存TASK  | TASK-0219 |
| 見積     | 5h |

## 責務

`init` / `update` / `doctor` に `--workspace <pkg-dir>`（`--workspace=` 形式含む、単一指定のみ）を追加し、workspace モードの配置規則（gate scripts = ルート `package.json` / step 実体 scripts = 対象パッケージ `package.json`）を 3 コマンドで統合する（SPEC T3）。`profile-diagnostics.mjs` の workspace 形 script での偽 warning を手当てし、`tests/cli/{init,update,doctor}.test.mjs` へ workspace 追加ケースのみを足す（既存ケースの期待値は変更しない）。

## 入力

- SPEC-0061 FR-01 / FR-04 / FR-06 / FR-08、NFR-01 / NFR-04（分岐 (6)）、AC-02 / AC-04 / AC-05、想定エラー1〜5・境界ケース1〜2、実装メモ「gate / step の分割点」「init の書き込み順」「`diagnoseProfileScripts` 手当て」「exit code 規約」節、既存実装との衝突点（4 点すべて）、INV-01 / INV-02 / PRE-01 / PRE-02 / POST-01 / POST-02、リスク3 / リスク4 / 実装リスク6 / 実装リスク7（PLAN）
- フラグ解析: 2 回以上の `--workspace` は CliError（FR-01）。`--install-deps` との併用は CliError（FR-08。config / 手動インストールを案内するメッセージ）
- gate/step 分割点: `ai:check` / `ai:check:fast` / `ai:check:secure`（`check-config.mjs` の `GATE_BY_SCRIPT` キーと同一集合）がルート行き、残りの profile scripts + support scripts + addon scripts がパッケージ行き（FR-04）。分割の定義は 1 箇所に集約し init / update で重複定義しない（衝突点 / PLAN 実装リスク7）
- init の書き込み順: workspace 検証（`resolveWorkspace` — FR-02 / SEC）→ ルート gate merge → パッケージ step merge → managed files（ルート据え置き）→ state 書き込み（`workspace` 記録）。dry-run は一切書かない（PRE-01）。`mergePackageScripts`（init.mjs L253）は「書き込み先 package.json + scripts サブセット」でパラメタ化して再利用（リスク3）
- doctor: 解決された workspace に FR-02 検証を診断として実施（不成立は issue、exit 1 — 境界ケース1）。`checkPackageScripts`（doctor.mjs L313）をルート（gate）/ パッケージ（step）の 2 回照合に分け、既存 issue code（missing-script / drift）を流用し `path` で対象を示す（衝突点）
- `diagnoseProfileScripts`（profile-diagnostics.mjs L34）: workspace モードは期待値完全一致照合に寄せ、正規表現での step 抽出は非 workspace 経路に限定（`--filter` を script 名と誤認しない — FR-06 / リスク4）
- update: state から `workspace` を解決し init と同一の配置規則で更新、`workspace` を維持（POST-02）。invalid state は `assertWritableInstallState` の既存経路（想定エラー5）
- `installationSummary` / `effectiveOptionsSummary` の `workspace` キー追加が既存アサーションを壊す場合も既存期待値は変更せず追加ケース側で検証（衝突点 / PLAN 実装リスク6）

## 出力

- `src/cli/init.mjs` / `src/cli/update.mjs` / `src/cli/doctor.mjs`: `--workspace` 解析・配置分岐・診断（未指定経路は条件分岐以外の変更を入れない）
- `src/cli/profile-diagnostics.mjs`: workspace 形 gate script の step 抽出手当て（非 workspace 経路の抽出結果は不変）
- `tests/cli/init.test.mjs`（追記）: AC-02 — 4 PM（`detectPackageManager` の検出結果を固定、実 PM バイナリ非実行）でルート gate の workspace invocation 描画 + 対象パッケージへの step 実体（support 含む）merge、AC-06 の統合面 — 検証失敗時にルート・パッケージいずれの `package.json` にも書き込みなし、FR-08 併用 CliError、FR-01 の複数指定 CliError
- `tests/cli/doctor.test.mjs`（追記）: AC-04 — state の `workspace` から workspace モード診断、ルート gate drift / パッケージ missing step の issue 検出、`--filter` の偽 warning 不在、境界ケース1（パッケージ削除後の issue）
- `tests/cli/update.test.mjs`（追記）: AC-05 — workspace 配置規則での更新 + state の `workspace` 維持（POST-02）、NFR-04 分岐 (6)（workspace 有無 × drift 検出）
- 既存ケースの期待値変更はゼロ（diff が追加ケースのみであることをレビューで確認）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/init.mjs`, `src/cli/update.mjs`, `src/cli/doctor.mjs`, `src/cli/profile-diagnostics.mjs`, `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- `--workspace` 未指定経路の挙動・既存テスト期待値の変更の禁止（NFR-01 / INV-01。検出: AC-01 の既存テスト無修正 pass + 既存テスト diff が追加ケースのみであることのレビュー確認）
- workspace ルート判定・パス検証を warning で続行する実装の禁止 — CliError で fail-fast のみ。doctor のみ診断（issue / exit 1）として報告（検出: AC-04 / AC-06 のテスト）
- 検証通過前の書き込み開始の禁止 — 部分書き込みの不在（PRE-01。検出: AC-06 の書き込み不在検証）
- gate/step 分割規則の init / update 重複定義の禁止 — 1 箇所に集約（PLAN 実装リスク7。検出: レビュー）
- `dependency-installer.mjs` の workspace 経路追加の禁止 — FR-08 の併用 CliError で経路に入らない（解禁は別 SPEC）
- File Scope 外への変更の禁止 — 特に `run.mjs` / `check-config.mjs` / `managed-files.mjs` / `ci-workflows.mjs` / `package-templates/` / `tests/cli/profile-composition.test.mjs` と fixture（検出: `templates/hooks/check-file-scope.sh` + diff 検査）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止（`CliError` で表現）、npm 依存追加禁止（NFR-02）

## 完了条件

- [ ] 境界ケース1: state に workspace があるがパッケージ削除済みの場合、doctor が issue で報告し update が CliError で書き込みを拒否するテストがパスする（AC-04 の独立サブケース）

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol。workspace ルート判定の誤検知は原因タグ『workspace: ルート判定誤検知』を付す — OPS-01）
- [ ] AC-02: 4 PM のルート gate 描画 + パッケージ step merge の統合テストがパスする（FR-03 / FR-04 / INV-02）
- [ ] AC-04: doctor の workspace モード診断（drift / missing 検出 + 偽 warning 不在）のテストがパスする（FR-06 / リスク4 — 非 workspace の warning 挙動不変を含む）
- [ ] AC-05: update の配置規則維持 + `workspace` 保持のテストがパスする（POST-01 / POST-02 / NFR-04 分岐 (6)）
- [ ] AC-06 統合面: 検証失敗時の書き込み不在テストがパスする（PRE-01）
- [ ] FR-01（複数指定 CliError）/ FR-08（`--install-deps` 併用 CliError）のテストがパスする
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストの期待値変更がゼロである（AC-01 / NFR-01）
- [ ] 追加テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0220 を含める（commit-msg hook で強制）

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
