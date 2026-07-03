# TASK-0219: install state の workspace additive 対応 + gate scripts の workspace 描画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0219 |
| SPEC-ID   | SPEC-0061 |
| PLAN-ID   | PLAN-0061 |
| ステータス | Pending |
| 担当Agent | Implementation + Test |
| 並列可否  | No（TASK-0218 の `workspaceScriptCommand` に依存し、TASK-0220 が本 TASK の state 解決 / 描画オプションに依存する直列） |
| 依存TASK  | TASK-0218 |
| 見積     | 3h |

## 責務

`src/cli/install-state.mjs` に schema v2 のままの optional `workspace` フィールドを additive 追加し（validation は存在時のみ + `resolveEffectiveOptions` への解決追加）、`src/cli/profile-scripts.mjs` の `getProfileScripts` に optional `options.workspace`（`{ dir, name }`）を追加して gate scripts の step を workspace スコープ付き invocation で描画できるようにする（SPEC T2）。SPEC-0060 の fixture テストが無修正で pass することが設計の正しさの証左。

## 入力

- SPEC-0061 FR-03（描画）/ FR-05（state）/ FR-06（解決の優先順のみ — コマンド統合は TASK-0220）、NFR-01 / NFR-03 / NFR-04（分岐 (5)）、AC-03 + AC-02 の描画部分、想定エラー5、契約 (2)(3)、実装メモ「invocation 生成」「`resolveEffectiveOptions`」「`renderScriptCommand`」節、INV-03 / INV-05 / PRE-02、リスク2、知識管理（SPEC-0056 既知パターン）
- `validateInstallState`（install-state.mjs L161）: `workspace` が存在する場合のみ検証（非空文字列・`path.isAbsolute` 禁止・`..` セグメント禁止。違反は invalid-install-state）。schemaVersion は 2 のまま、既存フィールドの意味・validation を変えない。`null` / 空文字は valid にしない（INV-05）
- `resolveEffectiveOptions`（L74）: 他オプションと同じ規則で `options.explicit.workspace ? options.workspace : state?.workspace ?? null`（PRE-02）
- `getProfileScripts`（profile-scripts.mjs L75）: `options.workspace` 指定時のみ、gate scripts（`ai:check` / `ai:check:fast` / `ai:check:secure`）の step を `workspaceScriptCommand` で**直接組み立てる**（`renderScriptCommand` の `pnpm X` 正規表現置換との二重適用を避ける — 実装メモ）。内部テーブル・合成順・返り値スキーマは変更しない（INV-03。step 集合・順序は非 workspace と一致）。`ADDON_CHECK_STEPS` の追記も同じ描画を通る（FR-03）

## 出力

- `src/cli/install-state.mjs`: `workspace` の validation（存在時のみ）+ effective options 解決。`installationSummary` / `effectiveOptionsSummary` への `workspace` はキー追加のみの additive 拡張（既存キーの値不変）
- `src/cli/profile-scripts.mjs`: gate scripts の workspace 描画オプション（optional options 追加のみのシグネチャ変更）
- `tests/cli/workspace.test.mjs`（追記）: AC-03 — `workspace` 付き state が valid / 絶対パス・`..` 入り・非文字列が invalid-install-state / `workspace` 欠落 state（v1・v2）が従来どおり valid（NFR-04 分岐 (5)）、effective options の explicit > state > null 優先順（PRE-02）、AC-02 描画部分 — PM 4 種 × workspace 有無の gate scripts 描画と step 集合・順序の一致（INV-03）。テストケース名は日本語 + AC-N 参照コメント

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `src/cli/install-state.mjs`, `src/cli/profile-scripts.mjs`, `tests/cli/workspace.test.mjs`
- 削除: なし

## 禁止事項（Forbidden Shortcuts 転記）

- install state の schemaVersion 変更・既存フィールドの意味変更の禁止 — `workspace` の additive 追加のみ（検出: AC-03 + 既存 install-state 系テストの無修正 pass）
- state の `workspace` に `null` / 空文字を書く・valid 扱いする実装の禁止 — 「存在して valid」か「キー欠落」の 2 状態のみ（INV-05。検出: AC-03 のテスト）
- `--workspace` 未指定経路の挙動・既存テスト期待値の変更の禁止（NFR-01。検出: AC-01 の既存テスト無修正 pass + `tests/cli/profile-composition.test.mjs` と fixture の無修正 pass — 変更が必要になった時点で設計ミスとして立ち止まる）
- `getProfileScripts` の内部テーブル・合成順・返り値スキーマの変更禁止 — 描画のみ（SPEC-0060 契約の保存。検出: fixture 無修正 pass）
- File Scope 外への変更の禁止 — 特に `check-config.mjs` / `run.mjs` / `managed-files.mjs`（検出: `templates/hooks/check-file-scope.sh` + レビュー）
- TODO/FIXME 残留禁止、`process.exit` 直呼び禁止、npm 依存追加禁止（NFR-02）

## 完了条件

- [ ] 実装前に `sage/failures.md` を確認し、実装中の想定外エラーは FAIL-XXXX として記録する（Error Resolution Protocol）
- [ ] AC-03: 全サブケース（記録 / キー不在 / valid / invalid 3 形）のテストがパスする（FR-05 / INV-05 / 想定エラー5 / NFR-04 分岐 (5)）
- [ ] AC-02 描画部分: PM 4 種の gate scripts が FR-03 の workspace invocation で描画され、step 集合・順序が非 workspace 描画と一致するテストがパスする（INV-03）
- [ ] `tests/cli/profile-composition.test.mjs` + fixture が**無修正**で pass する（SPEC 既存実装との衝突点 / NFR-01）
- [ ] `node --test tests/cli/*.test.mjs` が全件パスし、既存テストが無修正で pass する（AC-01 / NFR-01 / NFR-03）
- [ ] 追加テストケースに AC-N / FR-N / INV-N 参照コメントを付与している（AP-07 対策）
- [ ] commit message に TASK-0219 を含める（commit-msg hook で強制）

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
