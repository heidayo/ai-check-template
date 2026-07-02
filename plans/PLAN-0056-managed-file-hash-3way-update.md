# PLAN-0056: install state managed ファイルハッシュ記録と update 3-way 処理の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0056 |
| SPEC-ID   | [SPEC-0056](../specs/SPEC-0056-managed-file-hash-3way-update.md) |
| ステータス | Draft |
| 作成日    | 2026-07-02 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: `src/cli/` — install state I/O、update/doctor/init ロジック）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/` — unit + integration）
- [x] docs（`docs/cli.md`, README ja/en）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `src/cli/install-state.mjs` | schema v2 化（`managedFiles` 追加）、v1→v2 migration、`validateInstallState()`（L156-220）の厳密一致分岐を「1 or 2 許容 + migrate」に変更、schemaVersion>2 エラー停止 |
| `src/cli/managed-files.mjs`（新規） | managed ファイル列挙 + SHA-256 hash 計算の単一集約モジュール（INV-03） |
| `src/cli/update.mjs` | `updateTemplateFile()`（L327）/ `updateRenderedTemplateFile()`（L399）を 3-way 判定化、`parseUpdateArgs()`（L141）に `--keep-local` / `--force-managed` / `--diff` 追加、`.bak-<version>` 生成、operations action 語彙拡張（`skip-modified` / `overwrite-forced`）、完了時 hash 記録 |
| `src/cli/doctor.mjs` | `checkExpectedFileContent()`（L318）/ `checkTemplateFile()`（L333）を `ok` / `drift-upstream` / `modified-local` の 3 区別に拡張、schemaVersion 表示（OPS-02） |
| `src/cli/init.mjs` | `writeInitInstallState()`（L415）で managed ファイル hash 記録（FR-01） |
| `tests/cli/` | 新規 `managed-files.test.mjs` + 既存 `init.test.mjs` / `update.test.mjs` / `doctor.test.mjs` の拡張 |
| `docs/cli.md`, `README.md`, `README-ja.md`, `README-en.md` | update セクション（3-way 挙動・新フラグ・`.bak` 復元手順）更新 |

`package-templates/` 配下は変更しない（SPEC File Scope 外）。

## 実装方針

1. **列挙の単一集約（INV-03 / AP-03 対策）**: managed ファイル一覧と hash 計算（Node 標準 `crypto.createHash("sha256")` のみ、NFR-02）を新規 `src/cli/managed-files.mjs` に集約し、init / update / doctor はそこから import する。他モジュールへのハードコードは禁止（grep で検査）。
2. **schema v2 + 読み込み時 migration（FR-05）**: `loadInstallState()` で v1 を検出したら in-memory で v2 に変換し、次回書き込みで永続化。schemaVersion > 2 は明確なエラーで停止（silent 破壊禁止）。JSON 破損は現行どおり validation エラー停止。
3. **3-way 判定（FR-02〜FR-04）**: baseline hash / local 内容 / upstream 内容で 4 分岐（keep / update / skip-modified / overwrite-forced）。baseline 無し（v1 migration 直後・v0.1 手動導入）はバイト比較フォールバック + 差分ありなら「上書きせず警告」（安全側、FR-04）。`--force-managed` 時は `.bak-<basename>.bak-<packageVersion>` を**先に**書いてから上書き（INV-05）。`managedFiles` 記録ありでファイル欠落は `missing` として再生成（異常系1）。境界ケース local==upstream≠baseline は keep + hash 更新。
4. **段階的タスク投入（AP-02 Big Bang 対策）**: SPEC の T1〜T6 に対応する 6 TASK に分割し、各 TASK は単一責務 + File Scope 限定で逐次/並列実行する。

代替案比較: managed 一覧を update.mjs 内に据え置く案は、init/doctor との不整合リスク（SPEC リスク3）があるため不採用。ファイル単位でなくフィールド単位 3-way はスコープ外（SPEC 明記）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0193 | managed ファイル列挙 + hash 計算の `managed-files.mjs` 集約 | Implementation + Test | 1.5h | - | Yes（TASK-0194 と並列可） |
| TASK-0194 | install state schema v2 化 + v1→v2 migration + schemaVersion>2 エラー停止 | Implementation + Test | 1.5h | - | Yes（TASK-0193 と並列可） |
| TASK-0195 | init / update 完了時の managed ファイル hash 記録 | Implementation + Test | 1.5h | TASK-0193, TASK-0194 | No |
| TASK-0196 | update の 3-way 判定 + 解決フラグ + `.bak` 生成 | Implementation + Test | 3h | TASK-0195 | Yes（TASK-0197 と並列可） |
| TASK-0197 | doctor の ok / drift-upstream / modified-local 区別表示 | Implementation + Test | 1.5h | TASK-0195 | Yes（TASK-0196 と並列可） |
| TASK-0198 | docs/cli.md / README（ja/en）の update セクション更新 | Implementation | 1h | TASK-0196, TASK-0197 | No |

## リスク

- リスク1: v1→v2 migration 直後は baseline 不在で全改変ファイルが警告になる → 軽減策: FR-04 フォールバックで上書きせず警告 + `--force-managed` / keep の選択肢をメッセージで明示（TASK-0196 完了条件に含める）
- リスク2: update デフォルト挙動変更（always-overwrite → skip-modified）が「更新されない」と誤解される → 軽減策: skip 時に理由と解決フラグを必ず表示、docs/cli.md に breaking-behavior として明記。問題発生時は前バージョンへの pin 留め（`npx ai-check-template@0.4.0`）で旧挙動に戻せる旨も docs/cli.md に記載する（TASK-0198）
- リスク3: managed 一覧が init/update/doctor で分散し不整合（AP-03） → 軽減策: TASK-0193 で単一モジュール集約、完了条件に grep 検査を含める
- リスク4: 3-way 判定の分岐漏れ（テスト不足のまま「動いた」判定、AP-07/AP-09） → 軽減策: AC-03 の 4 分岐 100% カバー + 異常系 3 件（schemaVersion>2 / JSON 破損 / ファイル欠落）を TASK-0194/0196 の完了条件に明示、全テストケースに AC-N 参照コメント必須
- リスク5: OPS-03（v0.5.0 デフォルト化前の dogfooding 観測・誤検知 3 回累積での SPEC 改訂起票）は本 Round 1 のスコープ外 → 軽減策: TASK-0198 完了後、別ラウンドで観測プロセスを実施し、1 リリースサイクルの観測を経てからデフォルト化を判断する

## 必要な検証

- [x] unit test（`managed-files.mjs` の hash / 列挙、3-way 判定分岐 — AC-01, AC-03）
- [x] integration test（init → update → doctor の fixture lifecycle、migration、`.bak` 生成、冪等性 — AC-02〜AC-06）
- [x] build（`npm pack --dry-run` / `make validate` — AC-07）
- [x] performance check（NFR-03: `time node bin/ai-check-template.mjs update --target <fixture>` が real 3 秒未満、TASK-0196 完了条件と対応）
- [ ] security scan（既存 `bash scripts/sage-validate.sh` の範囲。新規依存なし = SCA 影響なし、NFR-02）
- [ ] e2e test（N/A: CLI 単体のため integration で代替）
- [ ] architecture boundary check（INV-03: managed 一覧集約の grep 検査で担保）
