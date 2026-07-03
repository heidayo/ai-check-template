# Done Definition: SPEC-0061 Round 1

`templates/done-definition-template.md` が存在しないため、SPEC-0060 round-1 の実績フォーマットを踏襲して作成。

## 対象

- SPEC-ID: SPEC-0061
- PLAN-ID: PLAN-0061
- TASK-ID: TASK-0218, TASK-0219, TASK-0220, TASK-0221
- Round: 1
- テスト対象 URL: N/A（CLI プロジェクト）
- 起動コマンド: `node --test tests/cli/*.test.mjs`

## Pass/Fail 判定（SPEC-0061 AC-01〜AC-08）

### Structural Gate

- [ ] `git diff --check` が pass する
- [ ] 各 TASK の File Scope 外の変更がない（特に `src/cli/managed-files.mjs` / `check-config.mjs` / `run.mjs` / `ci-workflows.mjs` / `dependency-installer.mjs` / `package-templates/` / `tests/cli/profile-composition.test.mjs` と fixture の無変更）
- [ ] commit message に TASK-ID を含める
- [ ] AC-08: `grep -q '\-\-workspace' docs/cli.md` がヒットし、配置規則（root gate / package steps）・単一指定制限・`.ai-check.yaml` 優先の関係の 3 点が同節に含まれる（FR-07、レビューで確認）
- [ ] `make validate` / `npm pack --dry-run` が壊れない（`src/cli/workspace.mjs` は `files` の既存パターン内、テストは pack 非同梱）

### Functional Gate

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスし、既存テストの無修正期待値部分（`--workspace` 未指定経路）が変更なしで pass し続ける（NFR-01 / INV-01 後方互換）
- [ ] AC-02: 4 PM（pnpm / npm / yarn / bun、`detectPackageManager` 検出結果固定・実 PM 非実行）でルート `package.json` の gate scripts が FR-03 の workspace invocation で描画され、対象パッケージに step 実体 scripts（support 含む）が merge される。bun `--filter` のサポートバージョンがテストコメントに記録されている（FR-03 / FR-04 / INV-02 / INV-03）
- [ ] AC-03: state の `workspace` 記録 / 未指定時キー不在 / valid・invalid（絶対パス・`..`・非文字列）の全サブケース（FR-05 / INV-05 / 想定エラー5）
- [ ] AC-04: state からの doctor workspace モード診断 — ルート gate drift / パッケージ missing step の issue 検出 + `--filter` 偽 warning 不在（FR-06 / 境界ケース1）
- [ ] AC-05: update の workspace 配置規則更新 + state `workspace` 維持（POST-01 / POST-02）
- [ ] AC-06: FR-02 (a)(b)(c) の各 fail-fast CliError + いずれの `package.json` にも書き込み不在（PRE-01 / 想定エラー1〜3）
- [ ] FR-01（`--workspace` 複数指定 CliError）/ FR-08（`--install-deps` 併用 CliError）/ 境界ケース2（`--workspace .` CliError）のテストが存在し pass する
- [ ] AC-02〜AC-07 サブケース網羅の確認: 各 AC の全サブケースに 1 件以上のテストケースが存在することを `node --test` のテスト名一覧と grep で確認する
- [ ] NFR-04: 6 分岐（FR-02 3 種 × 成功/失敗、PM 4 種 invocation、state workspace 有効/欠落/不正、doctor/update の workspace 有無 × drift）の各分岐に最低 1 テストケースが対応している
- [ ] 全テストケースに AC-N / FR-N / INV-N 参照コメントがある（AP-07 対策）

### Security Gate

- [ ] `bash scripts/sage-validate.sh` が pass する
- [ ] `rg "TODO|FIXME" src/cli tests/cli docs/cli.md` が新規 unfinished marker を検出しない
- [ ] AC-07: `--workspace ../outside`・絶対パス・シェルメタ文字入り pkg-dir・不正 `name`（メタ文字入り）の各入力が CliError になる（SEC-01 / SEC-02 / INV-04）
- [ ] SEC-01: state 経由の `workspace` も同一 validation を通り、state 改竄で `--target` 外の `package.json` 書き込みを誘発できない（AC-03 の invalid ケースで検証）
- [ ] NFR-02: 新規 npm 依存（YAML パーサ等）を追加していない（`tests/cli/package.test.mjs` の dependencies 検査で機械検証）。`pnpm-workspace.yaml` は存在チェックのみでパースしていない（diff レビューで確認）

### Architecture Gate

- [ ] TASK-0218 → TASK-0219 → TASK-0220 → TASK-0221 の commit 順序（git log で確認、下位モジュール先行の直列性担保）
- [ ] INV-02: workspace モードの書き込み先はルート + 対象パッケージの 2 `package.json` のみで、managed files / state はルート固定（AC-02 のテスト + diff レビュー）
- [ ] INV-03: workspace モードの gate scripts の step 集合・順序が非 workspace モードと一致する（SPEC-0060 合成契約の保存。fixture 無修正 pass が証左）
- [ ] `tests/cli/profile-composition.test.mjs` と fixture の diff がゼロである（SPEC File Scope — 変更が必要になった時点で設計ミスとして立ち止まる）
- [ ] 既存テストファイル（`tests/cli/{init,update,doctor}.test.mjs`）の diff が workspace 追加ケースのみで、既存期待値の変更がない（Forbidden Shortcuts、レビューで確認）
- [ ] gate/step 分割規則の定義が 1 箇所に集約され、init / update で重複定義されていない（PLAN 実装リスク7、レビューで確認）
- [ ] PM 4 種の invocation 形が各 PM 公式ドキュメントと照合済みである（src-rules.md AI Output Verification、レビューで参照確認）
- [ ] 本リポ root の `CLAUDE.md` / `.claude/rules/` / `sage/` を変更していない
- [ ] install state の schemaVersion が 2 のままで、既存フィールドの意味・validation が不変（NFR-03 / SPEC-0056 テストの継続 pass）

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する（workspace ルート判定の誤検知は説明冒頭に原因タグ『workspace: ルート判定誤検知』を付す — OPS-01）。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
