# PLAN-0061: monorepo / workspace 対応（`--workspace`）の実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0061 |
| SPEC-ID   | [SPEC-0061](../specs/SPEC-0061-monorepo-workspace.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: 新規 `src/cli/workspace.mjs` + `init.mjs` / `update.mjs` / `doctor.mjs` / `install-state.mjs` / `package-manager.mjs` / `profile-scripts.mjs` / `profile-diagnostics.mjs` — opt-in `--workspace` 経路の追加。未指定経路の観測可能な挙動は不変 = NFR-01）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/workspace.test.mjs` 新規 + `tests/cli/{init,update,doctor}.test.mjs` への workspace 追加ケースのみ。既存ケースの期待値は変更しない）
- [x] docs（`docs/cli.md` — `--workspace` 節の追加のみ）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `src/cli/workspace.mjs`（新規） | `resolveWorkspace(targetDir, pkgDir)` — SEC-01 パス検証（絶対パス・`..`・シェルメタ文字拒否、正規化後 target 配下確認）→ FR-02 (a) workspace ルート判定（`pnpm-workspace.yaml` 存在 or root `package.json` `workspaces` フィールド。YAML パースしない — NFR-02）→ (b)(c) pkg-dir / `package.json` `name` 検証（SEC-02 name パターン）→ `{ dir, name }` を返す。全失敗は CliError |
| `src/cli/package-manager.mjs` | `workspaceScriptCommand(packageManager, workspace, scriptName)` を `scriptCommand`（L43）と並置追加。PM 4 種の workspace invocation（pnpm `--filter <name>` / npm `run <step> --workspace <dir>` / yarn `workspace <name>` / bun `run --filter <name>` — FR-03）を 1 関数に集約（SPEC リスク1 の局所化） |
| `src/cli/install-state.mjs` | schema v2 のまま optional `workspace` フィールドの additive 対応: `validateInstallState`（L161）に存在時のみ検証（非空文字列・絶対パス禁止・`..` 禁止 — FR-05 / INV-05）、`resolveEffectiveOptions`（L74）に explicit > state > null の解決を追加（FR-06 / PRE-02） |
| `src/cli/profile-scripts.mjs` | `getProfileScripts`（L75）に optional `options.workspace`（`{ dir, name }`）を追加。指定時のみ gate scripts の step を `workspaceScriptCommand` で直接組み立てる（`renderScriptCommand` の `pnpm X` 置換と二重適用しない — 実装メモ）。内部テーブル・合成順・返り値スキーマは不変（INV-03 / SPEC-0060 fixture 無修正 pass が証左） |
| `src/cli/init.mjs` | `--workspace` / `--workspace=` 解析（単一指定・FR-08 の `--install-deps` 併用 CliError）、書き込み順: workspace 検証 → ルート gate scripts merge → パッケージ step scripts merge（`mergePackageScripts` L253 を書き込み先 + scripts サブセットでパラメタ化 — リスク3）→ managed files（ルート据え置き）→ state に `workspace` 記録 |
| `src/cli/update.mjs` | state から `workspace` を解決（FR-06）し init と同一の gate/step 配置規則で scripts 更新（L337 付近）、state の `workspace` 維持（POST-02）。配置規則（gate/step 分割 = `GATE_BY_SCRIPT` キー集合）の定義は 1 箇所に集約し init と重複定義しない |
| `src/cli/doctor.mjs` | workspace 解決時: FR-02 検証を診断（issue / exit 1）として実施し、ルート gate scripts とパッケージ step scripts を 2 回照合（`checkPackageScripts` L313 の分割、issue code 流用 + `path` で書き込み先を明示 — 既存実装との衝突点） |
| `src/cli/profile-diagnostics.mjs` | `diagnoseProfileScripts`（L34）の手当て: workspace モードは期待値完全一致照合に寄せ、正規表現 step 抽出は非 workspace 経路に限定（`--filter` の偽 warning 防止 — FR-06 / リスク4） |
| `tests/cli/workspace.test.mjs`（新規） | FR-02 3 種 × 成功/失敗、SEC-01 / SEC-02、PM 4 種 invocation（AC-02 invocation 部分 / AC-06 / AC-07、NFR-04 分岐 (1)〜(4)） |
| `tests/cli/{init,update,doctor}.test.mjs` | workspace 経路の追加ケースのみ（AC-02 / AC-03 / AC-04 / AC-05 / FR-08、NFR-04 分岐 (5)(6)）。既存ケースの期待値は変更しない（AC-01 / Forbidden Shortcuts） |
| `docs/cli.md` | `--workspace` 節の追加（配置規則・単一指定制限・`.ai-check.yaml` 優先の関係・「workspace モードは vX.Y 以降」— FR-07 / AC-08 / リスク2） |

`src/cli/managed-files.mjs` / `check-config.mjs` / `run.mjs` / `ci-workflows.mjs` / `dependency-installer.mjs` / `package-templates/` 配下 / `tests/cli/profile-composition.test.mjs` と fixture は変更しない（SPEC File Scope。fixture は workspace 未指定描画を固定しており、変更が必要になった時点で設計ミスとして立ち止まる）。

## 実装方針

1. **下位モジュール先行の直列実装（SPEC T1→T2→T3→T4）**: 検証・invocation（TASK-0218）→ state / 描画（TASK-0219）→ 3 コマンド統合（TASK-0220）→ docs（TASK-0221）。各段で `node --test tests/cli/*.test.mjs` 全件 pass を完了条件に含め、NFR-01（未指定経路不変）を段階ごとに機械確認する。
2. **T3 の一括維持（Evaluator 申し送りへの回答）**: T3 の File Scope は `init.mjs` / `update.mjs` / `doctor.mjs` / `profile-diagnostics.mjs` + `tests/cli/{init,update,doctor}.test.mjs` の **7 ファイルで 10 未満**のため、SPEC の再検討条項（10 超で分割）に該当せず一括を維持する。3 コマンドは同一の配置規則（gate/step 分割）を共有する共通経路の呼び出しのみで、分割すると配置規則の重複定義（SPEC 既存実装との衝突点）を誘発する。
3. **検証の 1 箇所集約（SEC-01 / SEC-02 / FR-02）**: 全検証を `workspace.mjs` の `resolveWorkspace` に集約し、init / update / doctor は同一関数を呼ぶ。state 経由の `workspace` も `validateInstallState` の同一パターン検証を通す（SEC-01: state 改竄でルート外書き込み不可）。
4. **invocation の実ドキュメント照合（src-rules.md AI Output Verification / SPEC リスク1）**: PM 4 種の workspace invocation 形は TASK-0218 実装時に各 PM 公式ドキュメントと照合してから確定し、bun `--filter` のサポートバージョンをテストファイルのコメントに記録する（AC-02 の括弧書き要件）。
5. **gate/step 分割点の単一定義（リスク3 / 衝突点）**: 分割は「`check-config.mjs` の `GATE_BY_SCRIPT` キーと同一集合（`ai:check` / `ai:check:fast` / `ai:check:secure`）がルート行き、残り + support scripts がパッケージ行き」。定義は workspace.mjs（または profile-scripts.mjs）の 1 箇所に置き、init / update から共用する。
6. **依存ゼロ維持（NFR-02）**: `node:fs` / `node:path` のみ。`pnpm-workspace.yaml` は存在チェックのみ（既存 `tests/cli/package.test.mjs` の dependencies 検査で機械検証）。
7. **docs は挙動確定後（SPEC T4 依存順序）**: TASK-0220 完了後に docs 化する（確定前の仕様を先に文書化しない）。

代替案比較: PM 検出による暗黙の monorepo 認識（自動モード切替）は SPEC が理由付き（対象パッケージが決められない・既存利用を壊す・opt-in ならリグレッション面ゼロ）で不採用確定済み。`--install-deps` 併用の解禁も不採用（FR-08 で CliError、別 SPEC）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0218 | `src/cli/workspace.mjs` 新規（FR-02 / SEC-01 / SEC-02 検証集約）+ `package-manager.mjs` の `workspaceScriptCommand` + `tests/cli/workspace.test.mjs`（SPEC T1） | Implementation + Test | 3h | - | No（後続が本モジュールに依存） |
| TASK-0219 | `install-state.mjs` の `workspace` additive 対応（validation + effective options 解決）+ `profile-scripts.mjs` の workspace 描画オプション（SPEC T2） | Implementation + Test | 3h | TASK-0218 | No |
| TASK-0220 | `init` / `update` / `doctor` の `--workspace` 経路（解析・gate/step 配置・診断・`profile-diagnostics.mjs` 手当て）+ `tests/cli/{init,update,doctor}.test.mjs` への追加ケース（SPEC T3、File Scope 7 ファイル — 実装方針 2 のとおり一括維持） | Implementation + Test | 5h | TASK-0219 | No |
| TASK-0221 | `docs/cli.md` の `--workspace` 節追加（SPEC T4） | Implementation | 1h | TASK-0220 | No |

- AC 対応: TASK-0218 → AC-06（(a) ルート判定失敗、(b) pkg-dir 不在、(c) `package.json` / `name` なし — 全サブケースの CliError + 書き込み不在）/ AC-07（`../outside`・絶対パス・シェルメタ文字 pkg-dir・不正 `name` — 全サブケース）/ AC-02 の invocation 部分（PM 4 種の文字列組み立て + bun バージョンコメント）。TASK-0219 → AC-03（`workspace` 記録 / 未指定時キー不在 / valid・invalid state — 全サブケース）+ AC-02 の描画部分（gate scripts の workspace 描画、SPEC-0060 fixture 無修正 pass）。TASK-0220 → AC-02（init 統合: ルート gate + パッケージ step の merge、4 PM）/ AC-04（doctor: workspace モード診断・drift / missing 検出・偽 warning 不在）/ AC-05（update: 配置規則維持 + `workspace` 保持）/ FR-08（`--install-deps` 併用 CliError）。TASK-0221 → AC-08（配置規則・単一指定制限・config 優先の 3 点）。AC-01（全テストパス = NFR-01 後方互換）は全 TASK 共通の完了条件。
- NFR-04 分岐対応: 分岐 (1)〜(4)（FR-02 3 種 × 成功/失敗、PM 4 種 invocation）= TASK-0218、分岐 (5)（state workspace 有効/欠落/不正）= TASK-0219、分岐 (6)（doctor/update の workspace 有無 × drift 検出）= TASK-0220。
- 直列理由: TASK-0218 の `resolveWorkspace` / `workspaceScriptCommand` を TASK-0219 の描画が、TASK-0219 の state 解決 / 描画オプションを TASK-0220 の 3 コマンドが呼ぶ、下位モジュール → 統合の依存順。TASK-0221 は確定挙動の docs 化のため最後。

依存グラフ: TASK-0218 → TASK-0219 → TASK-0220 → TASK-0221（全直列。並列可能な TASK 対なし）。

AC-01（全テストパス）は各 TASK の完了条件に個別記載され、Round 全体の最終確認は tasks/done-def-SPEC-0061-round-1.md の Functional Gate で行う。

知識管理: 各 TASK 実装中の想定外エラーは担当 Agent が `sage/failures.md` に FAIL-XXXX 形式で記録する（新規/既存の判定は `sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。workspace ルート判定の誤検知を記録する際は説明冒頭に原因タグ『workspace: ルート判定誤検知』を付す（OPS-01 の機械集計用）。「state への additive フィールド追加は schemaVersion を上げず validation は存在時のみ」は SPEC-0056 で確立した既知パターンの再適用であり、新規パターンとして記録しない。

## リスク

- リスク1（SPEC リスク1）: PM 各社の workspace CLI 仕様変更・bun `--filter` の未対応バージョン → 軽減策: invocation 生成を `workspaceScriptCommand` 1 関数に集約（TASK-0218）。実装時に各 PM 公式ドキュメントと照合し、bun のサポートバージョンをテストコメントに記録（AC-02）。生成 scripts は利用者側で修正・`.ai-check.yaml` 上書き可能。
- リスク2（SPEC リスク2）: 旧 CLI が `workspace` 付き state を単一パッケージとして誤診断 → 軽減策: 受容（additive 拡張の既知の限界、schemaVersion 変更は SPEC-0056 互換マトリクスへの過剰波及）。docs/cli.md に「workspace モードは vX.Y 以降」を明記（TASK-0221）。
- リスク3（SPEC リスク3）: パッケージ側 merge が keep / skip / overwrite 規則と operations 出力の整合を崩す → 軽減策: `mergePackageScripts` を「書き込み先 package.json + scripts サブセット」でパラメタ化して再利用し、新規 merge 実装を書かない（TASK-0220。operations の `targetPath` が書き込み先を自然に示す）。
- リスク4（SPEC リスク4）: `diagnoseProfileScripts` 手当てが非 workspace の warning 挙動を変える → 軽減策: workspace モードは期待値完全一致照合に寄せ、正規表現抽出は非 workspace 経路に限定。非 workspace 抽出結果の不変を AC-01 + TASK-0220 追加ケースで固定。
- リスク5（SPEC リスク5）: 機構撤去 → 軽減策: opt-in フラグ + optional state フィールドのみの構造を維持（フラグ受理を落とし state フィールドを無視すれば現行動作に復旧。手順: TASK-0218〜0220 の commit を `git revert` 後 `node --test tests/cli/*.test.mjs` で復旧確認。未指定利用者への影響ゼロ）。
- 実装リスク6: `effectiveOptionsSummary` / `installationSummary` への `workspace` キー追加が既存 JSON 期待値テストを壊す → 軽減策: キー追加のみの additive 拡張とし、AC-01 で確認。壊れる場合も既存期待値は変更せず追加ケース側で検証する（SPEC 既存実装との衝突点の原則を TASK-0220 完了条件に転記）。
- 実装リスク7: init と update の scripts 更新が独立実装のため配置規則がズレる → 軽減策: gate/step 分割の定義を 1 箇所に集約し（実装方針 5）、POST-02（update 後の配置規則が init と同一）を TASK-0220 のテストで固定。

## 必要な検証

- [x] unit test（workspace 検証 FR-02 / SEC-01 / SEC-02 — AC-06 / AC-07 / INV-04 / PRE-01、PM 4 種 invocation — AC-02 / FR-03、state validation — AC-03 / FR-05 / INV-05、NFR-04 の分岐 (1)〜(5)）
- [x] integration test（init の gate/step 配置 4 PM — AC-02 / FR-04 / INV-02、doctor の workspace 診断 + 偽 warning 不在 — AC-04 / FR-06、update の配置維持 + state 保持 — AC-05 / POST-01 / POST-02、既存 `node --test tests/cli/*.test.mjs` 全件 pass — AC-01 / NFR-01 / INV-01、NFR-04 の分岐 (6)）
- [x] build（`make validate` / `npm pack --dry-run` が壊れない — 配布物は `src/cli/workspace.mjs` の追加のみで `package.json` `files` の既存パターン内）
- [x] security scan（Gate 3: AC-07 のパストラバーサル / コマンドインジェクション拒否テスト — SEC-01 / SEC-02 / INV-04、新規 npm 依存なし — NFR-02（既存 `tests/cli/package.test.mjs` の dependencies 検査）、既存 `bash scripts/sage-validate.sh` の範囲）
- [x] e2e test（N/A: 実 PM バイナリは実行せず、`detectPackageManager` の検出結果を固定した invocation 文字列検証で代替と判断済み — AC-02 の括弧書きの一次情報源に従う。実 PM 挙動はリスク1 の公式ドキュメント照合でカバー）
- [x] architecture boundary check（INV-02: 書き込み先がルート + 対象パッケージの 2 `package.json` のみ、`managed-files.mjs` / `check-config.mjs` / `run.mjs` / `ci-workflows.mjs` / `package-templates/` / `tests/cli/profile-composition.test.mjs` と fixture の無変更 diff 検査 — SPEC File Scope）

## 段階採用 / ロールバック

- 影響ゼロ: `--workspace` は明示 opt-in で、未指定（かつ state に `workspace` なし）の init / update / doctor の観測可能な挙動は完全に現行どおり（INV-01 / NFR-01。AC-01 の既存テスト無修正 pass が継続検証）
- ロールバック: フラグ受理（3 コマンドの解析部）を落とし state の `workspace` フィールドを無視すれば現行動作へ復旧（SPEC リスク5。手順: TASK-0218〜0220 の commit を `git revert` 後 `node --test tests/cli/*.test.mjs` で復旧確認）。docs/cli.md の `--workspace` 節は削除、旧 CLI が `workspace` 付き state を読んでも未知フィールド無視で valid（ASM-03）
- 観測: v1 リリース後 1 リリースサイクル、workspace ルート判定（FR-02 (a)）の誤 fail 事例を観測（OPS-01）。原因タグ『workspace: ルート判定誤検知』の `sage/failures.md` 3 回累積で判定条件の緩和を別 SPEC 起票（判定: 次マイナーバージョン PLAN 起票時に `grep -c` で機械確認）。複数 workspace 需要は roadmap 見直し時に issue / feedback で確認し、必要なら `workspaces: string[]` の additive 追加で別 SPEC 起票（OPS-02）
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（未指定経路変更禁止・warning 続行禁止・YAML パーサ禁止・schemaVersion 変更禁止・未検証 invocation 禁止・未検証埋め込み禁止）は AC-01 / AC-03 / AC-06 / AC-07 + 既存 dependencies 検査の機械テストで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを採用）、CLAUDE.md / `.claude/rules/ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり。利用者向け規則は docs/cli.md 更新（TASK-0221）に反映される）

ロールバック後の利用者影響: 既に `--workspace` で init/update された利用者環境の package.json / install state は変更されないが、旧 CLI は workspace フィールドを未知フィールドとして無視するため実害なく単一パッケージ動作にフォールバックする。また `resolveWorkspace` 等は将来 `workspaces: string[]` 拡張時にループ適用で再利用可能であり、実装の作り直しは不要（契約節の additive 拡張余地と整合）。
