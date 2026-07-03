# PLAN-0057: installer 不干渉 local overlay 置き場の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0057 |
| SPEC-ID   | [SPEC-0057](../specs/SPEC-0057-local-overlay.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: `src/cli/init.mjs` — `.claude/rules/local/` + README 作成。配布テンプレート: `package-templates/scripts/*.sh` の source 行追加、`package-templates/.claude/rules/local/README.md` 新規）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/` — unit + integration）
- [x] docs（`docs/cli.md`, README ja/en, `package-templates/scripts/README.md`, `package-templates/.claude/README.md`）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `package-templates/scripts/ai-check.sh` / `ai-check-fast.sh` / `ai-check-secure.sh` | 3 本同型で PM デフォルト設定の後・PM 委譲コマンドの前に `ai-check.local.sh` の source 行（`SCRIPT_DIR` 基準の if 形式）+ SEC-01 / OPS-02 コメントを追加（FR-01） |
| `package-templates/.claude/rules/local/README.md`（新規） | init が配布する overlay 案内 README のテンプレート（使い方 / SEC-01 / SEC-02 / 参照型記載 — リスク4 対策） |
| `src/cli/init.mjs` | `--claude-hooks` 分岐（`mergeClaudeSettings()` 周辺）で `.claude/rules/local/` + README を create / skip（FR-03、想定エラー3: 同名ファイル存在時は skip + reason 警告）。operations は既存語彙（create / skip）のみ使用 |
| `src/cli/managed-files.mjs` | **変更しない**（FR-02 / INV-01: local 系パスを managed 一覧に追加しないことが要件。回帰ガードはテスト側で常設） |
| `src/cli/update.mjs` / `src/cli/doctor.mjs` | 原則変更なし（managed 一覧非包含により FR-04 / FR-05 は既存ロジックで満たされる想定。T4 のテストで不干渉を検証し、満たされない場合のみ SPEC File Scope 内で最小修正） |
| `tests/cli/` | `managed-files.test.mjs`（AC-07 回帰ガード）、`init.test.mjs`（AC-05 / 想定エラー3）、`update.test.mjs` / `doctor.test.mjs`（AC-03 / AC-04 / AC-06）、`release-readiness.test.mjs`（scripts テンプレート内容変更に伴う期待値更新） |
| `docs/cli.md`, `README.md`, `README-en.md`（`README-ja.md` は stub） | overlay ガイド（FR-06 の a〜d + リスク1 の移行手順） |

`sage/` / `CLAUDE.md` / `.claude/rules/`（本リポ root 側）/ `src/cli/managed-files.mjs` は変更しない。

## 実装方針

1. **overlay = opt-in の保証（INV-03 / NFR-01）**: source 行は `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` によるスクリプト自身位置基準（PRE-01）+ `if [ -f ... ]; then source ...; fi` 形式で追加し、`set -euo pipefail` を無効化しない（INV-04、Forbidden Shortcuts）。local 不在時の挙動・exit code は現行と同一。
2. **installer 不干渉は「一覧に入れない」で実現（FR-02 / INV-01 / INV-02）**: `managed-files.mjs` に一切手を入れず、`getManagedFiles()` の非包含を AC-07 の回帰テストで常設ガードする（AP-03 / AP-06 対策 — 文章ルールでなく機械テスト）。
3. **init の local README は既存 operations 語彙で（FR-03 / POST-01 / POST-02）**: create / skip の 2 状態 + 想定エラー3（`local` が同名ファイル）は skip + reason。新語彙を追加しない。既存 README は内容不変（INV-05、SHA-256 比較で検証）。
4. **段階的タスク投入（AP-02 対策）**: SPEC の T1〜T5 を 5 TASK に分割。T1（scripts）/ T2（回帰ガード）/ T3（init + `.claude/`）は編集対象が重複せず並列可、T4（update/doctor 不干渉検証）は T1・T3 に依存、T5（docs）は最後。

代替案比較: managed 一覧に local パスを「除外フラグ付き」で登録する案は、一覧の意味論を複雑化させ将来の混入リスク（SPEC リスク3）を高めるため不採用。script 別 local ファイル（`ai-check-fast.local.sh` 等)はスコープ外（SPEC 明記、単一 overlay で共通）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0199 | 配布 scripts 3 本への source 行 + SEC-01/OPS-02 コメント追加、`package-templates/scripts/README.md` 更新 | Implementation + Test | 1.5h | - | Yes（TASK-0200/0201 と並列可） |
| TASK-0200 | `getManagedFiles()` の local 系パス非包含回帰ガードテスト | Test | 0.5h | - | Yes（TASK-0199/0201 と並列可） |
| TASK-0201 | init の `.claude/rules/local/` + README 作成（create/skip/想定エラー3）、README テンプレート新規、`package-templates/.claude/README.md` 更新 | Implementation + Test | 2h | - | Yes（TASK-0199/0200 と並列可） |
| TASK-0202 | update / doctor の local 領域不干渉検証（AC-03 / AC-04 / AC-06） | Implementation + Test | 2h | TASK-0199, TASK-0201 | No |
| TASK-0203 | docs/cli.md / README（ja/en）への overlay ガイド + 移行手順追加 | Implementation | 1h | TASK-0199, TASK-0201, TASK-0202 | No |

## リスク

- リスク1（SPEC リスク1）: 改変済み scripts の利用者は update で skip-modified となり source 行が入らない → 軽減策: TASK-0203 で「改変内容を `ai-check.local.sh` へ移して `--force-managed` で戻す」移行手順を docs/README に記載（FR-06）。
- リスク2（SPEC リスク2）: local source が任意コード実行である点の認識不足 → 軽減策: TASK-0199 の source 行直前コメント + TASK-0201 の README テンプレート + TASK-0203 の docs に SEC-01/SEC-02 案内を必須完了条件として含める。
- リスク3（SPEC リスク3）: 将来 managed 一覧へ local 系パスが混入（AP-03） → 軽減策: TASK-0200 の AC-07 回帰テストを常設ガードとして先行投入（他 TASK と独立・並列）。
- リスク4（SPEC リスク4）: `.claude/rules/local/README.md` の陳腐化（update が触らないため） → 軽減策: TASK-0201 で README を参照型（「本ファイルは初回 init 時のスナップショット。最新は docs/cli.md 参照」）にし fixed-list を持たせない。
- リスク5（SPEC リスク5）: overlay 撤去が必要になった場合 → 軽減策: source 行 3 箇所削除のみで復旧可能な構造を維持（TASK-0199 で 3 本同型・同一コメントとし差異を作らない）。
- 実装リスク6: scripts テンプレート内容変更により `tests/cli/release-readiness.test.mjs` 等の期待値が壊れる → 軽減策: TASK-0199 の File Scope と完了条件に期待値更新を明示。
- 実装リスク7: update / doctor に想定外の local 参照コードが必要になり File Scope が膨らむ → 軽減策: TASK-0202 はまずテストで不干渉を検証し、失敗時のみ SPEC File Scope 内で最小修正。スコープ超過が必要なら SPEC 改訂を起票（Error Resolution Protocol）。実装修正が発生した場合は TASK-0202 の見積（2h）を実績に応じて更新し PLAN 差分として記録する。
- 実装リスク8（OPS-03）: overlay 利用時の dogfooding 観測は本 Round 1 のスコープ外 → 軽減策: v0.5.0 リリース後に 1 リリースサイクル観測。判定は次マイナーバージョンの PLAN 起票時に本リポ maintainer が `grep -c 'overlay' sage/failures.md` で機械的に件数確認し、3 件累積でガイド文言見直し SPEC を起票する。

## 必要な検証

- [x] unit test（`getManagedFiles()` 非包含 — AC-07 / INV-01）
- [x] integration test（source 機構・3 本同型 — AC-02、update/doctor 不干渉 — AC-03/AC-04/INV-02、init create/skip — AC-05/INV-05、旧テンプレート → 新テンプレート 3-way 更新 — AC-06/NFR-01）
- [x] build（`npm pack --dry-run` / `make validate`、pack に local README テンプレート含む・`ai-check.local.sh` 含まない — AC-08）
- [x] performance check（NFR-03: CI (ubuntu-latest, Node 20+) 上で local 不在時の `time bash scripts/ai-check.sh` 増分 real 100ms 未満を計測。ローカル代替計測時は run log に環境差異を記録。TASK-0199 完了条件と対応）
- [x] security scan（Gate 3: README/docs に secret 直書き例を載せない — SEC-02、既存 `bash scripts/sage-validate.sh` の範囲。新規依存なし — NFR-02）
- [ ] e2e test（N/A: CLI + shell scripts のため integration で代替）
- [x] architecture boundary check（INV-01: AC-07 回帰テスト + `src/cli/managed-files.mjs` 無変更の diff 検査）

## 段階採用 / ロールバック

- 影響ゼロ: overlay は opt-in。`ai-check.local.sh` 未配置なら scripts の実行挙動は不変（NFR-01）
- ロールバック: 配布 scripts の source 行 3 箇所を削除するのみで撤去可能（SPEC リスク5。`ai-check.local.sh` / `.claude/rules/local/` はユーザー領域のため installer 側の追加変更は不要）
- 観測: v0.5.0 リリース後 1 リリースサイクル観測、skip-modified 事例 3 回累積でガイド文言見直し（OPS-03、実装リスク8 参照）
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts は AC-02/AC-07 等の機械テストで検証されるため、CLAUDE.md / .claude/rules/ai-check-template.md への追記は不要（同ファイルは参照型で、配布物実態は docs/cli.md 更新（TASK-0203）に反映される）
