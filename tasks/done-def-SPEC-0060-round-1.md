# Done Definition: SPEC-0060 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0059 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0060
- PLAN-ID: PLAN-0060
- TASK-ID: TASK-0215, TASK-0216, TASK-0217
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0060 AC-01〜AC-07）

### Structural Gate

- [ ] `git diff --check` が pass する
- [ ] 各 TASK の File Scope 外の変更がない（特に `src/cli/profile.mjs` / `profile-docs.mjs` / `managed-files.mjs` / 既存テストファイルの無変更）
- [ ] commit message に TASK-ID を含める
- [ ] AC-07: `grep -q 'profile composition' docs/cli.md` がヒットし、マージ順（declaration order）・競合時挙動（error）・addon 一覧（supabase-rls）の 3 点が同節に含まれる（FR-06 / OPS-01、レビューで確認）
- [ ] `make validate` / `npm pack --dry-run` が壊れない（fixture / テストは pack 非同梱で配布物不変）

### Functional Gate

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存テストの無修正期待値部分を含む — NFR-01 後方互換）
- [ ] AC-02: parseProfiles の規則固定 — (a) `+`/`,` 等価、(b) base 0 件・2 件 CliError、(c) 重複 CliError、(d) 未知名 supported 一覧付き CliError、(e) addons 宣言順保持（FR-01 / INV-04 / 想定エラー1〜3）
- [ ] AC-03: scripts 合成 — (a) addon script + `ai:check` 末尾への `&&` 追記、(b) 重複 step 非追記、(c) base 衝突・先行 addon 衝突の両方（テーブル注入）で衝突キー名入り CliError、silent 上書きなし（FR-02 / INV-02 / INV-03 / POST-01 / POST-02 / 想定エラー4）
- [ ] AC-04: (a) support scripts キー集合 = base + security のみで addon 前後不変、(b) doc files = 共通 + base README + addon README 宣言順、(c) managed files 差分 = addon README エントリのみ（FR-03 / FR-04 / ASM-02 / ASM-03）
- [ ] AC-02〜AC-04 サブケース網羅の確認: 各 AC の (a)〜 全サブケースに 1 件以上のテストケースが存在することを `node --test` のテスト名一覧と grep で確認する
- [ ] NFR-04: 競合あり / なし / 複数 addon の各分岐に最低 1 テストケースが対応している
- [ ] NFR-03: `time node --test tests/cli/profile-composition.test.mjs` の real が 2 秒未満（CI ubuntu-latest, Node 20+。閾値超過は WARN 非ブロッキング、run log（`.sage/runs/`）に記録）
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）

### Security Gate

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli tests/cli docs/cli.md` が新規 unfinished marker を検出しない
- [ ] AC-06: `grep -E '/Users/|/home/|API_KEY|TOKEN|SECRET' tests/cli/fixtures/profile-composition.json` がヒット 0 件（SEC-01）
- [ ] SEC-02: 競合 CliError メッセージに衝突キー名・profile 名のみを含み、script のコマンド内容全文を含まない（テストで検証）
- [ ] NFR-02: 新規 npm 依存（スナップショットライブラリ等）を追加していない（`tests/cli/package.test.mjs` の dependencies 検査で機械検証）
- [ ] SEC-01: 変更はプロファイル合成の純関数と docs のみで、コマンド実行・ネットワーク・ファイル書き込み経路を追加していない（diff レビューで確認）

### Architecture Gate

- [ ] TASK-0215 commit → TASK-0216 commit の順序（git log で確認、同一ファイル逐次編集の直列性担保）

- [ ] AC-05: 全 base × addon 組合せ（8）× 4 関数の合成結果が `tests/cli/fixtures/profile-composition.json` と `deepStrictEqual` で完全一致し、組合せ列挙が `supportedProfiles` から機械生成され、fixture に存在しない組合せのネガティブケースが常設されている（FR-05 / INV-01 / INV-05 — 合成契約の回帰ガード）
- [ ] fixture commit（TASK-0215）が実装変更 commit（TASK-0216）より先行している（NFR-01 / リスク4 / Forbidden Shortcuts — `git log` で確認）
- [ ] TASK-0216 以降で fixture の diff がゼロである（変更前後の等価性証明 — NFR-01）
- [ ] `src/cli/profile.mjs` / `profile-docs.mjs` / `managed-files.mjs` / `init.mjs` / `doctor.mjs` / `update.mjs` / `dependency-installer.mjs` / `package-templates/` / 既存テストファイルを変更していない（SPEC File Scope）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] テスト注入用に export した関数が public CLI surface（コマンド・オプション・出力）を変えていない（実装メモ / PLAN 実装リスク6）
- [ ] OPS-02: fixture の更新（本 Round では発生しない想定）が File Scope 明記 + diff レビューなしに行われていない

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する（fixture 更新漏れ起因は説明冒頭に原因タグ『profile-composition: fixture更新漏れ』を付す — OPS-03）。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
