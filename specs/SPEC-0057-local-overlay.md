# SPEC-0057: installer が触らない local overlay 置き場の公式サポート

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0057 |
| ステータス | Draft |
| 作成日    | 2026-07-03 |
| 更新日    | 2026-07-03 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0056（3-way update / managed-files.mjs） |
| 権限レベル | platform |

## 背景・目的

SPEC-0056 は managed ファイルのユーザー改変を 3-way 判定（baseline / local / upstream）で検知し、`skip-modified` として無警告上書きを廃止した。しかしこれは「直接編集してしまった後の安全網」であり、改変されたファイルは以後 upstream 更新の自動追従から外れる（keep / overwrite / diff のユーザー判断が毎回必要になる）。

本 SPEC は、その手前の一次手段として **installer（init / update / doctor）が絶対に触らない overlay 置き場** を公式サポートする。利用者はプロジェクト固有のカスタマイズを overlay に書くことで、managed ファイルを未改変のまま保ち、update の自動追従を維持できる。位置付けの整理:

- **overlay（本 SPEC）**: そもそも managed ファイルを編集しなくて済むようにする一次手段
- **3-way skip-modified（SPEC-0056）**: それでも直接編集した場合の安全網

具体的には (1) 配布 scripts が同ディレクトリの `ai-check.local.sh` を存在すれば source する行を持つこと、(2) `.claude/rules/local/` を installer 不干渉ディレクトリとして公式化すること、の 2 つを提供する。

## 対象ユーザー

- `ai-check-template` CLI（v0.5.0+ 想定）で init/update を利用し、scripts / rules をプロジェクト要件に合わせて拡張したい開発者
- 既存プロジェクト（v0.2.0〜v0.4.x 導入済み）の開発者 — update で新テンプレート（source 行入り）へ移行する（後方互換は NFR-01）
- 手動コピー利用者 — `package-templates/scripts/*.sh` をコピーするだけで overlay 機構が使える
- 本リポ maintainer（配布テンプレートと managed 一覧の保守）

## スコープ（含む）

- `package-templates/scripts/ai-check.sh` / `ai-check-fast.sh` / `ai-check-secure.sh`（配布テンプレート実体、PM env var 対応の thin wrapper）に、同ディレクトリの `ai-check.local.sh` が存在すれば source する行を追加する。**SPEC-0056 と異なり、本 SPEC は `package-templates/` 配下（配布テンプレート内容そのもの）の変更を含む**
- `ai-check.local.sh` 自体は配布せず、installer（init / update / doctor）は一切管理しない: `src/cli/managed-files.mjs` の managed 一覧に含めない（install state に hash を記録しない、update で上書きしない、doctor で検査しない）
- `.claude/rules/local/` ディレクトリ: init（`--claude-hooks` 指定時）が案内 README（`.claude/rules/local/README.md`、overlay の使い方説明）付きでディレクトリを作成する。**README を含め `local/` 配下は managed 一覧に含めず**、update は配下を絶対に上書き・削除しない。doctor も検査対象外。README が既に存在する場合 init は skip する（上書きしない）
- README（`README.md` / `README-ja.md` / `README-en.md`）と `docs/cli.md` の導入手順に overlay の使い方を組み込む（「managed ファイルを直接編集する代わりに overlay を使う」ガイド、SPEC-0056 の skip-modified との関係の説明を含む）
- `package-templates/scripts/README.md` / `package-templates/.claude/README.md` への overlay 説明追記（配布物側の一次情報源）

## スコープ外（明示的に除外）

- `doctor --strict`（CI 用の厳格 exit code）— 別 SPEC（候補 A-3）
- profile 合成・monorepo 対応 — 別 SPEC（候補 B 系）
- `.ai-check.yaml` 等の外部設定ファイル — 別 SPEC（候補 C 系）
- overlay の内容検証（`ai-check.local.sh` / `.claude/rules/local/` 配下の中身の lint・構文チェック・実行結果保証）— local ファイルの中身はユーザー責任（SEC-01 参照）
- `ai-check.local.sh` 以外の script 単位 local ファイル（`ai-check-fast.local.sh` 等）— 単一 overlay で 3 scripts 共通とする。script 別分岐が必要なら local 側で `$0` 等により分岐可能
- Claude hooks（`.claude/settings.json`）の overlay — settings merge は既存の init ロジック維持
- SPEC-0056 の 3-way 判定ロジック自体の変更 — 本 SPEC は managed 一覧への項目追加を行わない（配布 scripts の内容変更のみ）

## 要件

### 機能要件
- [FR-01] 配布 scripts 3 本（`package-templates/scripts/ai-check.sh` / `ai-check-fast.sh` / `ai-check-secure.sh`）は、自身と同じディレクトリに `ai-check.local.sh` が存在する場合、PM 委譲コマンド実行の**前に** `source` する。存在しない場合は何もせず現行どおり動作する（存在チェックは `[ -f ... ]`、パス解決はスクリプト自身の位置基準で、呼び出し時の cwd に依存しない）
- [FR-02] `ai-check.local.sh` は配布物に含めず（`package-templates/scripts/` に置かない）、`src/cli/managed-files.mjs` の managed 一覧にも含めない。したがって init は生成せず、update は上書き・削除せず、doctor は検査しない
- [FR-03] init は `--claude-hooks` 指定時に `.claude/rules/local/` を作成し、overlay の使い方を説明する `README.md` を配置する（operations に `create` として報告）。同 README が既に存在する場合は skip する（operations に `skip` として報告）
- [FR-04] update は `.claude/rules/local/` 配下のいかなるファイルにも書き込み・削除を行わない（README 含む。init 時点の README が古くても update は触らない — overlay 領域は一度作られたら完全にユーザー領域）
- [FR-05] doctor は `ai-check.local.sh` および `.claude/rules/local/` 配下を drift 検査対象に含めない（存在してもしなくても doctor の結果に影響しない）
- [FR-06] README（ja/en）と `docs/cli.md` に overlay ガイドを記載する: (a) managed ファイル直接編集の代わりに overlay を使う推奨、(b) `ai-check.local.sh` の配置例（env var 上書き・追加チェックの例）、(c) `.claude/rules/local/` の用途、(d) SPEC-0056 skip-modified との関係（overlay = 一次手段、skip-modified = 安全網）

### 非機能要件
- [NFR-01] 後方互換: 既存プロジェクト（v0.2.0〜v0.4.x の install state を持つ）で update を実行すると、scripts は新テンプレート（source 行入り）に更新される。未改変（local == baseline）なら SPEC-0056 の 3-way 判定により自動更新、改変済みなら skip-modified となりユーザー判断（keep / `--force-managed` / diff）。overlay は opt-in であり、`ai-check.local.sh` を置かない限り scripts の実行挙動は従来と同一（source 行追加による挙動変化なし）
- [NFR-02] 新規依存を追加しない（source 行は POSIX/bash 標準機能のみ、CLI 側変更は既存モジュール内で完結）
- [NFR-03] overlay 存在チェックによる scripts の実行時間増加は無視できること: `ai-check.local.sh` 不在時の `bash scripts/ai-check.sh` のオーバーヘッド増分が 100ms 未満（計測条件: CI (ubuntu-latest, Node 20+) 上で local ファイル無し状態の `time bash scripts/ai-check.sh` を本 SPEC 適用前後で比較し、差分 real 100ms 未満。ファイル存在チェック 1 回のみのため実測は 10ms 以下想定）

### セキュリティ要件
- [SEC-01] `ai-check.local.sh` の source は**任意コード実行**である。これはリポジトリ内のファイルであり、リポジトリを clone して scripts を実行する時点でリポジトリ内容は信頼境界内（`package.json` scripts や既存 shell scripts と同等の信頼レベル）のため、追加のサンドボックス・署名検証は行わない。ただし配布 scripts の source 行直前コメントと `.claude/rules/local/README.md` に「local ファイルはコミットされた内容がそのまま実行される。信頼できない変更を混入させないこと」を明記する
- [SEC-02] `ai-check.local.sh` / `.claude/rules/local/` 配下への secret / token / API key の直書き禁止を README（ja/en）・`.claude/rules/local/README.md` の overlay ガイドで案内する（secret は env var / secret manager 経由とする）

### 運用要件
- [OPS-01] init の operations 出力（human / `--json`）に `.claude/rules/local/README.md` の create / skip を含め、CI ログから判別可能にする
- [OPS-02] 配布 scripts の source 行には「この行は installer が管理する scripts 本体の一部。カスタマイズは ai-check.local.sh 側に書く」旨のコメントを付し、利用者が source 行自体を編集する誘因を減らす
- [OPS-03] 段階観測: v0.5.0 リリース後、本リポ + 外部 dogfooding 1 件で overlay 利用時の update（scripts 未改変維持 → 自動追従）を 1 リリースサイクル観測する。overlay があるのに scripts を直接編集して skip-modified になった事例が `sage/failures.md` に 3 回累積した場合（判定: 次マイナーバージョンの PLAN 起票時に本リポ maintainer が `grep -c 'overlay' sage/failures.md` 等で機械的に件数確認する）、ガイド文言（FR-06）を見直す SPEC 改訂を起票する

## File Scope

| 区分 | ファイル |
|---|---|
| 新規 | `package-templates/.claude/rules/local/README.md`（init が配布する案内 README のテンプレート） |
| 変更（配布テンプレート） | `package-templates/scripts/ai-check.sh`, `package-templates/scripts/ai-check-fast.sh`, `package-templates/scripts/ai-check-secure.sh`, `package-templates/scripts/README.md`, `package-templates/.claude/README.md` |
| 変更（CLI） | `src/cli/init.mjs`（`.claude/rules/local/` + README 作成）, `src/cli/index.mjs`（usage ヘルプ追記が必要な場合のみ） |
| テスト | `tests/cli/init.test.mjs`, `tests/cli/update.test.mjs`, `tests/cli/doctor.test.mjs`, `tests/cli/managed-files.test.mjs`（local ファイル非管理の検証追加）, `tests/cli/release-readiness.test.mjs`（scripts テンプレート内容変更に伴う期待値更新） |
| ドキュメント | `docs/cli.md`, `README.md`, `README-ja.md`, `README-en.md` |

上記以外への変更は本 SPEC のスコープ外。`src/cli/managed-files.mjs` は**変更しない**（managed 一覧に local ファイルを追加しないことが要件であり、既存一覧の変更も不要。scripts テンプレートの内容変更は managed 一覧の hash 対象内容が変わるだけで一覧定義は不変）。

## 受け入れ条件（Acceptance Criteria）

- [ ] AC-01: `node --test tests/cli/*.test.mjs` が全件パスする（既存 init/update/doctor テスト含む）【種別: unit + integration】
- [ ] AC-02: init 後のプロジェクトで `scripts/ai-check.sh` と同 dir に `ai-check.local.sh`（例: env var を echo する内容）を配置して実行すると local が source され、削除すると従来どおり動作する（テストで検証: source 行の存在 + 3 scripts すべてに同一機構があること）【種別: integration】
- [ ] AC-03: `ai-check.local.sh` と `.claude/rules/local/` 配下にユーザーファイルを配置した状態で `update` を実行しても、これらのファイルが変更・削除されず、operations にも managed 対象として現れない（テストで検証）【種別: integration】
- [ ] AC-04: 同状態で `doctor` を実行しても local ファイル起因の drift / 警告が出ず、結果が local ファイル無しの場合と同一である（テストで検証）【種別: integration】
- [ ] AC-05: `--claude-hooks` 付き init で `.claude/rules/local/README.md` が作成され（operations: create）、再 init で skip される（operations: skip。内容不変は再 init 前後の README の SHA-256 一致比較で検証）（テストで検証）【種別: integration】
- [ ] AC-06: 旧テンプレート（source 行なし）scripts + v2 install state（旧内容の baseline hash）のプロジェクトで update を実行すると、未改変 scripts が source 行入り新テンプレートへ自動更新され、改変済み scripts は skip-modified になる（NFR-01、テストで検証）【種別: integration】
- [ ] AC-07: `getManagedFiles()` の返す一覧（全 profile / オプション組合せ）に `ai-check.local.sh` および `.claude/rules/local/` 配下のパスが含まれない（テストで検証）【種別: unit】
- [ ] AC-08: `npm pack --dry-run` / 既存 preflight（`make validate`）が壊れず、pack 内容に `package-templates/.claude/rules/local/README.md` が含まれ `ai-check.local.sh` が含まれない【種別: build】

### AC ↔ Gate 対応表

| AC | テスト種別 | Gate |
|----|-----------|------|
| AC-01 | unit + integration | Gate 2: Functional |
| AC-02 | integration | Gate 2: Functional |
| AC-03 | integration | Gate 2: Functional |
| AC-04 | integration | Gate 2: Functional |
| AC-05 | integration | Gate 2: Functional |
| AC-06 | integration | Gate 2: Functional |
| AC-07 | unit | Gate 4: Architecture |
| AC-08 | build | Gate 1: Structural |

## 異常系

- 想定エラー1: `ai-check.local.sh` が構文エラーを含む → 配布 scripts は `set -euo pipefail` 下で `source` するため、bash が構文エラーを報告し scripts は非 0 で即終了する（silent に無視しない）。これは仕様どおりの挙動（local の中身はユーザー責任、スコープ外の「内容検証」を行わない）であり、エラーメッセージは bash 標準のもの（ファイル名・行番号入り）が出る。実装中にこのケースで想定外エラーが発生した場合は Error Resolution Protocol に従い、run log 記録 → `sage/anti-patterns.md` 確認 → 新規なら `sage/failures.md` に追記する
- 想定エラー2: `ai-check.local.sh` に実行権限（+x）がない → `source` は読み取り権限のみで動作するため実行権限は不要であり、正常に source される（README にもその旨を記載し、chmod 不要であることを案内する）。読み取り権限すらない場合は `set -e` により source が失敗し scripts は非 0 で終了する。実装中の想定外エラーは Error Resolution Protocol に従い処理する
- 想定エラー3: `.claude/rules/local` がディレクトリではなく同名ファイルとして既に存在する → init は上書き・削除せず、当該パスへの README 配置を skip し警告を operations に報告する（ユーザー領域を破壊しない）。実装中の想定外エラーは Error Resolution Protocol に従い、run log 記録 → anti-patterns 確認 → failures.md 追記の手順で処理する
- 境界ケース1: 利用者が source 行自体を削除・改変した scripts を持つ → SPEC-0056 の 3-way 判定で skip-modified となり、本 SPEC は特別扱いしない（overlay 機構が無効化されるのはユーザーの明示的選択）

## 契約

- API: なし（CLI フラグ追加なし。init の既存 `--claude-hooks` の出力ファイルが 1 件増えるのみ）
- DB: なし
- イベント: なし（配布 scripts の「同 dir の `ai-check.local.sh` を source する」挙動が実質の契約。`package-templates/scripts/README.md` に明文化する）

## リスク

- リスク1: 既存プロジェクトで scripts を改変済みの利用者は update で skip-modified となり source 行が入らない → 軽減策: skip-modified 時の案内（SPEC-0056 実装済み）に加え、README/docs の overlay ガイドで「改変内容を `ai-check.local.sh` へ移して `--force-managed` で scripts を新テンプレートに戻す」移行手順を記載する（FR-06）
- リスク2: local ファイルの source が任意コード実行である点を利用者が認識しない → 軽減策: SEC-01/SEC-02 のコメント・README 案内を必須要件とする
- リスク3: 将来 managed ファイル追加時に誤って local 系パスを managed 一覧に入れる → 軽減策: AC-07 のテストを回帰ガードとして常設する（Forbidden Shortcuts 参照）
- リスク4: `.claude/rules/local/README.md` が古くなっても update が触らないため陳腐化する → 軽減策: README 内に「本ファイルは初回 init 時のスナップショット。最新は docs/cli.md 参照」と参照型で記載し、fixed-list を持たせない（.claude/rules/ai-check-template.md の参照型方針と同じ）
- リスク5: overlay 機構自体を撤去する必要が生じた場合 → 軽減策: 配布 scripts の source 行 3 箇所を削除するのみで復旧可能（`ai-check.local.sh` / `.claude/rules/local/` はユーザー領域のため installer 側の追加変更は不要。source 行削除後は overlay が機能しなくなる旨の周知のみ）

## 知識管理

- 実装中に発生したエラーは TASK-ID 付きで `.sage/runs/` に記録し、新規パターンなら `sage/failures.md` に FAIL-XXXX として追記する（CLAUDE.md Error Resolution Protocol の 6 要素: エラーログ / 失敗ファイル / 関連仕様 / 最近の変更 / Fix scope / 完了条件 に従う）
- 同一エラーパターンが 3 回累積した場合、`sage/anti-patterns.md` への昇格を検討する
- 「update が local/ 配下を触らない」が文章ルールだけだと AP-06（Human-Only Guard）になるため、AC-03/AC-04/AC-07 の機械テストをガードとして常設する
- managed 一覧への local 系パス混入（リスク3）は AP-03（Silent Scope Expansion）と関連し、INV-01 + AC-07 がその対策である
- テスト期待値は本 SPEC の AC から導出し、AC-N 参照をテストケースに付す（AP-07 Hallucination Propagation 対策）

## 実装メモ（Implementation Agent向け）

- 配布 scripts の実体: `package-templates/scripts/*.sh`。3 本とも `set -euo pipefail` + `PM="${PM:-pnpm}"` の thin wrapper。source 行は PM 実行より前、`PM` デフォルト設定より後に置くと local で `PM` を上書きできる（ガイド例に使える）。パス解決例: `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` → `[ -f "${SCRIPT_DIR}/ai-check.local.sh" ] && source "${SCRIPT_DIR}/ai-check.local.sh"` — ただし `set -e` 下の `[ -f ] && source` は local 不在時に compound command が非 0 になっても最終コマンドでない限り安全だが、行単体で終わる場合は `if [ -f ... ]; then source ...; fi` 形式にする（scripts 末尾以外でも防御的に if 形式を推奨）
- managed 一覧: `src/cli/managed-files.mjs` `getManagedFiles()`（`SCRIPT_FILES` 定数に 3 scripts、claudeHooks 時に `test-rules.md` を追加する構造）。**本 SPEC ではこのモジュールを変更しない**。scripts テンプレート内容の変更は render 結果（hash）に反映されるだけで一覧は不変
- init の Claude 系処理: `src/cli/init.mjs` — `--claude-hooks` 分岐（L80 付近 `mergeClaudeSettings()`、L320 付近）。`.claude/rules/local/` + README 作成はこの分岐に追加する。README テンプレートは `fromTemplates(".claude", "rules", "local", "README.md")` で参照
- update の 3-way 挙動（AC-06 の前提）: `src/cli/update.mjs`（SPEC-0056 実装済み）。テンプレート内容を変えると未改変プロジェクトで local==baseline != upstream → update 分岐に入ることを利用する。AC-06 のテストは既存 `tests/cli/update.test.mjs` の 3-way テストパターンを踏襲
- 言語規約: 配布物内コメント・README は日本語 OK（利用者向け）。README.md（英語版 README-en.md）はそれぞれの言語で記載

### 実装ルール

- `ai-check.local.sh` という名前のファイルをリポジトリ（`package-templates/` 含む）に追加しない（example が必要なら README 内コードブロックで示す）
- source 行の追加は 3 scripts で同一パターン・同一コメントとし、差異を作らない（既存の thin wrapper 3 本が同型である一貫性を維持）
- `.claude/rules/src-rules.md` の Forbidden shortcuts（TODO 残留禁止・スコープ外変更禁止等）を遵守する
- テストケース名は日本語、AC-N 参照を付す

### 既存実装との衝突点

- `tests/cli/release-readiness.test.mjs` 等が scripts テンプレートの内容（または hash）に依存している場合、テンプレート変更で期待値更新が必要（File Scope に含めた理由）
- init の operations 語彙は既存の action（create / skip / ...）を踏襲し、新語彙を追加しない（FR-03 / 想定エラー3 の警告は既存 skip + reason で表現）

### 想定タスク分割と依存順序（Planning Agent 向け）

- T1: 配布 scripts 3 本への source 行 + SEC-01 コメント追加、`package-templates/scripts/README.md` 更新（依存なし）
  - 完了条件: AC-02 のテスト（source 機構の動作 + 3 本同型）がパスし、`tests/cli/release-readiness.test.mjs` がパスする
- T2: managed 一覧の非包含回帰ガードテスト追加（依存なし、T1 と並列可）
  - 完了条件: AC-07 のテスト（`getManagedFiles()` に local 系パスが含まれない）が `tests/cli/managed-files.test.mjs` でパスする
- T3: init の `.claude/rules/local/` + README 作成、README テンプレート新規作成、`package-templates/.claude/README.md` 更新（依存なし、T1/T2 と並列可）
  - 完了条件: AC-05 のテスト（create → 再 init で skip）と想定エラー3 のテストがパスする
- T4: update / doctor の local 領域不干渉テスト（依存: T1, T3）
  - 完了条件: `node --test tests/cli/update.test.mjs tests/cli/doctor.test.mjs` が AC-03 / AC-04 / AC-06 対応ケースを含めて全件パスする（実装変更要否の判断基準は実装メモ参照）
- T5: docs/cli.md / README（ja/en）への overlay ガイド追加（依存: T1, T3, T4）
  - 完了条件: `grep -l 'ai-check.local.sh' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットする（FR-06 記載の機械検証。README-ja.md は README.md への stub のため対象外）+ 移行手順（リスク1）の記載を目視確認 + `npm pack --dry-run` パス（AC-08）

T1（`package-templates/scripts/` 配下）と T3（`package-templates/.claude/` 配下）は編集対象ファイルが重複しないため並列実行時にコンフリクトしない。

本 SPEC 承認後、Planning Agent が `bash scripts/sage-id-gen.sh task` で各 T に TASK-ID を採番し PLAN に反映する。

## Forbidden Shortcuts（本 SPEC 固有）

- `ai-check.local.sh` および `.claude/rules/local/` 配下のパスを `src/cli/managed-files.mjs` の managed 一覧に追加することの禁止（検出: AC-07 の回帰テスト）
- update / doctor が `.claude/rules/local/` 配下または `ai-check.local.sh` へ書き込み・削除・drift 判定を行うコードの追加禁止（検出: AC-03 / AC-04 のテスト）
- `ai-check.local.sh` という実ファイルを配布物・本リポに追加することの禁止（検出: AC-08 の npm pack 内容検査 + レビュー）
- source 行を `set -e` を無効化する形（`set +e` で囲む等）で実装し、local の失敗を silent に握りつぶすことの禁止（検出: 想定エラー1 のテスト — 構文エラー local で scripts が非 0 終了すること）
- README / docs への secret 直書き例の掲載禁止（例示は env var 参照形式のみ）（検出: 既存 secret scan（Gate 3）+ レビュー）
- commit message に対応する TASK-ID を含めないコミットの禁止（commit-msg hook で強制、本 SPEC 実装コミットも対象）

## Properties

### Invariants
- [INV-01] (Gate 4) `getManagedFiles()` の返す一覧は、いかなる profile / オプション組合せでも `ai-check.local.sh` と `.claude/rules/local/` 配下のパスを含まない
- [INV-02] (Gate 2) update / doctor の実行前後で、`ai-check.local.sh` と `.claude/rules/local/` 配下の全ファイルの内容・存在は不変である
- [INV-03] (Gate 2) `ai-check.local.sh` が存在しない場合、配布 scripts の実行結果（exit code / 委譲コマンド）は本 SPEC 適用前と同一である（opt-in 保証）
- [INV-04] (Gate 3) `ai-check.local.sh` の source 失敗（構文エラー・読取不能）は scripts の非 0 終了として伝播し、silent に無視されない
- [INV-05] (Gate 2) init は `.claude/rules/local/README.md` が既に存在する場合その内容を変更しない

### Pre-conditions
- [PRE-01] (Gate 2) FR-01 の source は配布 scripts 自身のディレクトリ基準で解決される（呼び出し cwd に依存しない）

### Post-conditions
- [POST-01] (Gate 2) `--claude-hooks` 付き init（非 dry-run）完了後、`.claude/rules/local/README.md` が存在する（既存 README の skip 時も存在は保証される）
- [POST-02] (Gate 2) init の operations 出力は `.claude/rules/local/README.md` について create または skip のいずれか 1 件を含む

### Assumptions
- [ASM-01] (Gate 横断) 配布 scripts は bash で実行される（`#!/usr/bin/env bash`、`BASH_SOURCE` 利用可能）
- [ASM-02] (Gate 横断) リポジトリ内容（`ai-check.local.sh` 含む）は信頼境界内であり、実行者は clone 時点でリポジトリを信頼している（SEC-01）
- [ASM-03] (Gate 横断) SPEC-0056 の 3-way update が実装済みであり、テンプレート内容変更時の未改変ファイル自動更新 / 改変ファイル skip-modified が機能する

## 関連ID

- PLAN-ID: （計画フェーズで記入）
- TASK-ID: （分割フェーズで記入）
