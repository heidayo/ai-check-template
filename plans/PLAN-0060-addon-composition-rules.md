# PLAN-0060: profile 合成（base + addon）規則の固定と回帰ガードの実装計画

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0060 |
| SPEC-ID   | [SPEC-0060](../specs/SPEC-0060-addon-composition-rules.md) |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure（CLI: `src/cli/profile-scripts.mjs` — addon マージ時の同名 script キー競合検出 = CliError 化のみ。合成順・出力は不変）
- [ ] frontend
- [ ] infra
- [x] test（`tests/cli/profile-composition.test.mjs` 新規 + `tests/cli/fixtures/profile-composition.json` 新規 — 規則固定 unit + スナップショット回帰ガード）
- [x] docs（`docs/cli.md` — profile composition 節の追加のみ）

## 影響範囲

| 機能/モジュール | 影響内容 |
|---|---|
| `src/cli/profile-scripts.mjs` | addon マージを `Object.assign` から「キーごとに `Object.hasOwn` を確認してから代入」する小関数に置き換え、base / 先行 addon のキーと衝突時に衝突キー名・profile 名入り CliError を投げる（FR-02 (d)。唯一の挙動変更、現行 8 組合せでは発火しない — NFR-01）。`ADDON_CHECK_STEPS` の `ai:check` 追記経路は競合検査の対象外（定義済み合成規則、実装メモ参照） |
| `tests/cli/fixtures/profile-composition.json`（新規） | 全 base（4）× addon 部分集合（2）= 8 組合せ × 4 関数の期待値 fixture。**実装変更前の HEAD の出力から生成**（NFR-01 / リスク4）。`getProfileDocFiles` は `relativePath` 列のみ、`getManagedFiles` は state key 列のみ、`getProfileSupportScripts` は packageManager `pnpm` 固定（AC-06 / 実装メモ） |
| `tests/cli/profile-composition.test.mjs`（新規） | AC-02（parseProfiles 規則）/ AC-03（scripts 合成 + 競合 CliError）/ AC-04（support scripts / doc files / managed files 規則）/ AC-05（スナップショット照合 + 組合せ機械列挙のネガティブ検証）の unit + integration |
| `docs/cli.md` | profile composition 節の追加（文法・マージ順・`ai:check` 追記規則・競合 = エラー・addon 一覧 — FR-06。既存 profile 別 scripts 節の近傍に追加し相互参照） |

`src/cli/profile.mjs` / `profile-docs.mjs` / `managed-files.mjs` / `init.mjs` / `doctor.mjs` / `update.mjs` / `dependency-installer.mjs` / `package-templates/` 配下 / 既存テストファイル（`tests/cli/managed-files.test.mjs` の 96 組合せテスト含む）は変更しない（SPEC File Scope。これらは「テストで固定する対象」であって変更対象ではない）。

## 実装方針

1. **fixture 先行（NFR-01 / リスク4 / Forbidden Shortcuts）**: fixture は実装変更**前**の HEAD の出力から生成して commit する（TASK-0215）。その後の競合検出実装（TASK-0216）で fixture 全件が無修正で pass し続けることが、変更前後の等価性証明になる。fixture commit が実装変更 commit より先行することをレビューで確認する。
2. **fixture 非依存の意味論テストを併設（リスク2）**: AC-02 / AC-03 / AC-04 の規則テストは SPEC 契約節から期待値を導出する fixture 非依存テストとし、fixture 照合（AC-05）だけに依存しない（AP-07 対策。「実装の写経」防止）。
3. **競合検出は注入で再現（AC-03 (c) / NFR-04）**: 現行テーブルでは競合が発火しないため、マージ小関数を export する（またはテーブル引数注入可能にする）ことでテストから競合テーブルを直接注入し、base 衝突・先行 addon 衝突・複数 addon の各分岐に最低 1 ケースを対応させる。**export しても public CLI surface（観測可能な挙動）は不変に保つ**（実装メモ）。
4. **組合せの機械列挙（AC-05 / OPS-01）**: `supportedProfiles` を import し、`parseProfiles` の成否で base / addon を判別して組合せを機械生成する（`profile.mjs` の Set は export しない — File Scope 外）。fixture 側にも分類を持たせて突き合わせ、addon 追加時に fixture 未更新なら fail するネガティブケースを常設する。
5. **依存ゼロ維持（NFR-02）**: 照合は `node:assert` の `deepStrictEqual` + commit 済み fixture JSON のみ。スナップショットライブラリ・`node:test` snapshot API は導入しない（既存 `tests/cli/package.test.mjs` の dependencies 検査で機械検証）。
6. **docs は規則確定後（FR-06 / SPEC T3 依存順序）**: 競合 = エラーの規則が実装・テストで確定した後（TASK-0216 完了後）に docs 化する（TASK-0217。確定前の規則を先に文書化しない）。

代替案比較: 「同名キー競合を warning + 後勝ちで続行」する案は SPEC が理由付きで不採用（未定義挙動の既成事実化を避け fail-fast に確定。将来の意図的 override は explicit opt-in の SPEC 改訂で緩和方向に追加可能 — リスク1）。fixture 再生成スクリプトの同時整備も不採用（OPS-03: 更新忘れ fail の 3 回累積観測後に別 SPEC で判断）。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0215 | fixture 生成（変更前 HEAD 出力）+ スナップショット・規則固定テスト（`profile-composition.test.mjs` の AC-02 / AC-04 / AC-05 / AC-06 部分）（SPEC T1） | Implementation + Test | 3h | - | No（TASK-0216 と同一テストファイルを編集するため直列） |
| TASK-0216 | `profile-scripts.mjs` の同名キー競合検出（CliError 化）+ AC-03 競合テスト追加 + スナップショット全件無修正 pass の等価性確認（SPEC T2） | Implementation + Test | 2h | TASK-0215 | No |
| TASK-0217 | `docs/cli.md` の profile composition 節追加（SPEC T3） | Implementation | 1h | TASK-0216 | No |

- AC 対応: TASK-0215 → AC-02（(a) `+`/`,` 等価、(b) base 0/2 件 CliError、(c) 重複 CliError、(d) 未知名 CliError、(e) 複数 addon 宣言順 — 全サブケース）/ AC-04（(a) support scripts キー集合不変、(b) doc files 宣言順、(c) managed files 差分が addon README のみ — 全サブケース）/ AC-05（8 組合せ × 4 関数の完全一致 + 未知組合せのネガティブ検証）/ AC-06（fixture grep 検査）。TASK-0216 → AC-03（(a) addon script + `ai:check` 追記、(b) 重複 step 非追記、(c) base 衝突・先行 addon 衝突の両方をテーブル注入で再現し CliError — 全サブケース。NFR-04 の分岐網羅を含む）。TASK-0217 → AC-07。AC-01（全テストパス = NFR-01 後方互換）は全 TASK 共通の完了条件。
- TASK-0215 / TASK-0216 の分割境界: TASK-0215 は `src/cli/` を一切変更しない（現行実装の出力固定のみ）。TASK-0216 が唯一の実装変更 TASK で、fixture は読み取り専用（更新禁止 — 更新が必要になったら NFR-01 違反 = 実装バグ）。
- 直列理由（SPEC T1→T2）: 両 TASK が `tests/cli/profile-composition.test.mjs` を編集するため並列不可。また競合検出テスト（T2）は「T1 で固定したスナップショット全件が無修正で pass し続けること」の確認と一体でなければ等価性証明（NFR-01）が成立しない。

依存グラフ: TASK-0215 → TASK-0216 → TASK-0217（全直列。並列可能な TASK 対なし）。

AC-01（全テストパス）は各 TASK の完了条件に個別記載され、Round 全体の最終確認は tasks/done-def-SPEC-0060-round-1.md の Functional Gate で行う。

知識管理: 各 TASK 実装中の想定外エラーは担当 Agent が `sage/failures.md` に FAIL-XXXX 形式で記録する（新規/既存の判定は `sage/anti-patterns.md` 照合、3 回累積時の昇格判断は done-def の Error Resolution 手順に従う）。fixture 更新漏れ起因の fail を記録する際は説明冒頭に原因タグ『profile-composition: fixture更新漏れ』を付す（OPS-03 の機械集計用）。

## リスク

- リスク1（SPEC リスク1）: 競合 = エラーの確定が将来の意図的 override と衝突 → 軽減策: fail-fast → explicit opt-in の順は緩和方向で後方互換（SPEC 契約）。本 PLAN では検出のみ実装し、override 機構は将来 SPEC に委ねる（TASK-0216 のスコープを検出 + CliError に限定）。
- リスク2（SPEC リスク2）: fixture が実装の写経になりバグ込み固定 → 軽減策: TASK-0215 に fixture 非依存の意味論テスト（AC-02 / AC-04）を併設し、fixture 生成時に AC-06 の grep 検査を通す（実装方針 2）。
- リスク3（SPEC リスク3）: 将来の script 改訂のたびに fixture 更新が形骸化 → 軽減策: OPS-02（File Scope 明記 + diff レビュー必須）を done-def Architecture Gate に記載。OPS-03 の観測は下記「段階採用」参照。
- リスク4（SPEC リスク4）: 競合検出実装が合成順・出力を偶然変える → 軽減策: TASK-0215 で変更前出力の fixture を先に commit し、TASK-0216 の完了条件に「スナップショット全件無修正 pass」を含める（CI で変更前後の等価性を機械証明）。
- リスク5（SPEC リスク5）: 機構撤去 → 軽減策: 競合検出は `getProfileScripts` 内の小関数 + 新規テスト 2 ファイルのみに閉じる構造を TASK-0216 で維持（検出ロジックを外せば現行 `Object.assign` 挙動に復旧、現行組合せでは発火しないため利用者影響ゼロ）。
- 実装リスク6: マージ小関数の export（テスト注入用）が意図せず public CLI surface を広げる → 軽減策: export は関数のみでテーブル（`ADDON_PROFILE_SCRIPTS` 等）は export しない。`index.mjs` / CLI コマンド面は無変更（TASK-0216 の File Scope 外）。docs/cli.md にも内部関数を記載しない（TASK-0217）。
- 実装リスク7（NFR-03）: スナップショットテストの実行時間超過 → 軽減策: 合成は純関数呼び出しのみでファイル I/O は fixture 読み込みと render 検証に限る設計（PRE-01）。TASK-0215 完了条件に `time node --test tests/cli/profile-composition.test.mjs` の real 2 秒未満確認を含め、閾値超過は WARN 非ブロッキング（WARN は run log（`.sage/runs/`）に記録する — NFR-03）。
- 実装リスク8（OPS-03）: fixture 更新忘れ fail の実効性観測は本 Round 1 スコープ外 → 軽減策: v0.5.0 リリース後 1 リリースサイクル観測。判定は次マイナーバージョンの PLAN 起票時に maintainer が `grep -c 'profile-composition: fixture更新漏れ' sage/failures.md` で機械的に件数確認し、3 回累積で fixture 再生成スクリプト整備を別 SPEC 起票（OPS-03）。

## 必要な検証

- [x] unit test（parseProfiles 規則固定 — AC-02 / FR-01 / INV-04、scripts 合成規則 + 競合 CliError — AC-03 / FR-02 / INV-02 / INV-03 / POST-01 / POST-02、support scripts / doc files / managed files 規則 — AC-04 / FR-03 / FR-04 / ASM-02 / ASM-03、競合分岐網羅 — NFR-04）
- [x] integration test（8 組合せ × 4 関数の fixture 完全一致 + 組合せ機械列挙のネガティブ検証 — AC-05 / FR-05 / INV-01 / INV-05、既存 `node --test tests/cli/*.test.mjs` 全件 pass — AC-01 / NFR-01）
- [x] build（AC-06: fixture の `grep -E '/Users/|/home/|API_KEY|TOKEN|SECRET'` ヒット 0 件、`make validate` / `npm pack --dry-run` が壊れない — fixture / テストは pack 非同梱で配布物不変）
- [x] performance check（ローカル実行時の参考値は CI 実測に劣後し、WARN 判定の一次情報源は CI (ubuntu-latest, Node 20+) の time 実測のみとする）（NFR-03: `node --test tests/cli/profile-composition.test.mjs` が CI (ubuntu-latest, Node 20+) で real 2 秒未満。閾値超過は CI で WARN 非ブロッキング、`time` の real 秒数を確認し 2 秒超過時は run log（`.sage/runs/`）へ記録 — 実装リスク7 参照）
- [x] security scan（Gate 3: fixture に secret / 絶対パス / 環境値を含まない — SEC-01 / AC-06、競合 CliError メッセージに script コマンド内容全文を含めないテスト — SEC-02、新規 npm 依存なし — NFR-02（既存 `tests/cli/package.test.mjs` の dependencies 検査）、既存 `bash scripts/sage-validate.sh` の範囲）
- [x] e2e test（N/A: HTTP/UI を持たない CLI の純関数合成のため unit + integration test で代替と判断済み。init/update の書き込み経路は変更しない — SEC-01）
- [x] architecture boundary check（INV-05: AC-05 fixture 回帰ガード + `src/cli/profile.mjs` / `profile-docs.mjs` / `managed-files.mjs` / `init.mjs` / `doctor.mjs` / `update.mjs` / `dependency-installer.mjs` / `package-templates/` / 既存テストファイル無変更の diff 検査）

## 段階採用 / ロールバック

- 影響ゼロ: 唯一の挙動変更（同名キー競合 CliError）は現行の全 supported 組合せ（8 通り）で発火しない（ASM-01。AC-05 のスナップショットが継続検証）。`init` / `doctor` / `update` の観測可能な挙動・生成物・exit code は不変（NFR-01）
- ロールバック: `profile-scripts.mjs` の競合検出小関数を `Object.assign` に戻し、新規テスト 2 ファイル（`profile-composition.test.mjs` / fixture）を削除するのみで現行動作へ復旧（手順: `git revert <TASK-0216 commit-sha>` 実行後 `node --test tests/cli/*.test.mjs` で復旧確認）（SPEC リスク5。現行組合せでは発火しないため撤去しても利用者影響ゼロ）。`docs/cli.md` の合成規則節は現行規則の記述として残置無害
- 観測: v0.5.0 リリース後 1 リリースサイクル、スナップショットテストの fail 事例（意図した変更なのに fixture 更新忘れ）を観測（OPS-03）。原因タグ『profile-composition: fixture更新漏れ』の `sage/failures.md` 3 回累積で fixture 再生成スクリプト整備を別 SPEC 起票（実装リスク8 参照）
- rules 連携（AP-06 対策の明示）: 本 SPEC の Forbidden Shortcuts（silent 上書き禁止・fixture の変更後出力からの再生成禁止・合成結果の変更禁止・parseProfiles 文法変更禁止・依存追加禁止）は AC-02 / AC-03 / AC-05 / AC-06 + 既存 dependencies 検査の機械テストで検証されるため（AP-06 Human-Only Guard 対策として文章ルールではなく機械ガードを採用する判断。無変更判断自体は `tasks/done-def-SPEC-0060-round-1.md` Architecture Gate の CLAUDE.md/.claude/rules/ 無変更チェックで機械検証される）、CLAUDE.md / `.claude/rules/ai-check-template.md` への追記は不要（SPEC 知識管理節のとおり。利用者向け規則は docs/cli.md 更新（TASK-0217）に反映される）
