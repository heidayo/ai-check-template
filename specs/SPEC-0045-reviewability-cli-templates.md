# SPEC-0045: Reviewability CLI Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0045 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0038, SPEC-0040 |
| 権限レベル | platform |

## 背景・目的

SPEC-0038 で Reviewability gate の PR template / worksheet / prompts を追加したが、導入方法は manual-copy に留まっている。実際に `ai-check-template` を導入する利用者にとって、Review gate は Local loop / CI gate と同じくらい重要な受け入れ面であり、CLI の `init` / `update` / `doctor` から明示的に導入・保守・診断できる必要がある。

この SPEC では、reviewability templates を任意オプションとして CLI 管理対象に加え、既存利用者には影響を与えず、導入を選んだ利用者だけが PR evidence と AI code understanding worksheet を安定して配布できるようにする。

## 対象ユーザー

- AI 生成コードの設計意図・代替案・リスク・追加テストを PR で記録したい開発者
- `npx ai-check-template init` で Review gate もまとめて導入したい maintainer
- 既存導入先で reviewability templates の欠落や drift を `doctor` / `update` で扱いたいチーム

## スコープ（含む）

- CLI に `--review-templates` option を追加する
- `init --review-templates` で `.github/PULL_REQUEST_TEMPLATE.md` と `worksheet/ai-code-understanding.md` を target project にコピーする
- `update --review-templates` または install state default で reviewability templates を作成・修復する
- `doctor --review-templates` または install state default で reviewability templates の presence / drift を診断する
- `.ai-check-template.json` に `reviewTemplates` を保存し、既存 install state には後方互換 default `false` を適用する
- CLI docs / README / usage model / package template docs / validation / tests を更新する

## スコープ外（明示的に除外）

- Reviewability template 本文の内容変更はしない
- `package-templates/.claude/**` や Claude Code hook の behavior は変更しない
- root `.github/PULL_REQUEST_TEMPLATE.md` を本リポに追加しない
- npm package version / release tag は変更しない
- GitHub Actions workflow の新規追加はしない

## 要件

### 機能要件
- [FR-01] `init --review-templates` は PR template と worksheet を target project にコピーする
- [FR-02] `update --review-templates` は missing または managed drift の reviewability templates を修復する
- [FR-03] `doctor --review-templates` は missing / drifted reviewability templates を issue として報告する
- [FR-04] install state に `reviewTemplates` を記録し、`doctor` / `update` は明示 flag がない場合に install state を尊重する
- [FR-05] 既存 install state に `reviewTemplates` がない場合は `false` として扱う
- [FR-06] human output と JSON context に review templates の有効状態が出る

### 非機能要件
- [NFR-01] 後方互換性: `--review-templates` を指定しない既存利用者には新規ファイルを書かない
- [NFR-02] 安全性: 既存 custom PR template / worksheet を default で上書きしない
- [NFR-03] 汎用性: reviewability templates は profile / CI mode / package manager に依存しない
- [NFR-04] 検証性: CLI tests と `make validate` で option / copy / drift / install state を検証する

### セキュリティ要件
- [SEC-01] reviewability templates のコピー処理は secret や token を生成・出力しない
- [SEC-02] install state に保存する値は boolean `reviewTemplates` のみで、credential / personal value を含めない
- [SEC-03] `doctor` は read-only を維持し、target project を変更しない

### 運用要件
- [OPS-01] `make validate` が pass する
- [OPS-02] `bash scripts/sage-validate.sh` が pass する
- [OPS-03] `git diff --check` が pass する
- [OPS-04] File Scope check が pass する

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `node bin/ai-check-template.mjs init --target <fixture> --review-templates --yes` で `.github/PULL_REQUEST_TEMPLATE.md` と `worksheet/ai-code-understanding.md` が作成される
- [x] AC-02: `init --review-templates` 後の `.ai-check-template.json` に `"reviewTemplates": true` が保存される
- [x] AC-03: `update` は install state の `reviewTemplates: true` を default として使用し、missing reviewability template を修復する
- [x] AC-04: `doctor` は install state の `reviewTemplates: true` を default として使用し、reviewability template drift を検出する
- [x] AC-05: 既存 install state に `reviewTemplates` がない場合、`doctor` / `update` は `false` として扱い後方互換に動作する
- [x] AC-06: `--review-templates` を指定しない `init` は reviewability templates を target に書かない
- [x] AC-07: custom existing reviewability file は `--overwrite` なしでは保持される
- [x] AC-08: CLI help / docs / README / usage model が manual-copy と CLI option の両方を説明する
- [x] AC-09: `make validate` が pass する
- [x] AC-10: `bash scripts/sage-validate.sh` が pass する
- [x] AC-11: secret-like pattern scan が pass する
- [x] AC-12: File Scope check が pass する

## 異常系

- 既存 target project に custom `.github/PULL_REQUEST_TEMPLATE.md` がある場合: `init --review-templates` は skip し、`--overwrite` のときだけ置換する
- 既存 install state が malformed の場合: `doctor` は issue として報告し、`update` は書き込み前に失敗する
- `reviewTemplates` が boolean 以外の場合: install state invalid として扱う
- `doctor --review-templates` で template が missing / drifted の場合: exit code 1 で issue を返す

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI contract: `init` / `doctor` / `update` に optional `--review-templates` を追加する
- Install state contract: `.ai-check-template.json` に optional-compatible boolean `reviewTemplates` を追加する
- Package contract: 既存 `package-templates/.github/PULL_REQUEST_TEMPLATE.md` と `package-templates/worksheet/ai-code-understanding.md` を CLI 管理対象にする

## リスク

- リスク1: 既存 custom PR template を壊す → 軽減策: default skip / `--overwrite` only replacement / tests
- リスク2: install state 追加で旧導入先が壊れる → 軽減策: missing `reviewTemplates` を `false` として normalize
- リスク3: Review gate が必須と誤解される → 軽減策: docs で optional / human acceptance loop として説明
- リスク4: `doctor` が read-only でなくなる → 軽減策: implementation と tests で diagnostic only にする

## 実装メモ（Implementation Agent向け）

- 既存 `--claude-hooks` と同じ option pattern を使う
- `copyTextFileSafe` / `updateTemplateFile` / `checkTemplateFile` の既存 helper を再利用する
- install state schemaVersion は 1 のまま、missing field default で後方互換を保つ
- Reviewability template 本文は scope 外のため変更しない

## Properties

### Invariants
- [INV-01] (Gate 2) `--review-templates` 未指定の `init` は reviewability files を書かない
- [INV-02] (Gate 2) `doctor` は target project に書き込まない
- [INV-03] (Gate 2) custom existing files は `--overwrite` なしで上書きされない
- [INV-04] (Gate 3) install state に secret-like value を保存しない
- [INV-05] (Gate 4) reviewability template option は profile / CI / package manager と独立している

### Pre-conditions
- [PRE-01] (Gate 2) target project directory が存在する
- [PRE-02] (Gate 2) source templates が `package-templates/.github/` と `package-templates/worksheet/` に存在する
- [PRE-03] (Gate 4) `reviewTemplates` install state value は missing または boolean である

### Post-conditions
- [POST-01] (Gate 2) `init --review-templates` は expected reviewability files を作成する
- [POST-02] (Gate 2) `update` は effective `reviewTemplates: true` のとき missing / managed drift を修復する
- [POST-03] (Gate 2) `doctor` は effective `reviewTemplates: true` のとき missing / drifted file を issue 化する
- [POST-04] (Gate 4) docs と CLI help に `--review-templates` が記載される
- [POST-05] (Gate 3) secret-like pattern scan が pass する

### Assumptions
- [ASM-01] (Gate 横断) Reviewability gate は human acceptance のための optional loop であり、すべての導入先に強制しない
- [ASM-02] (Gate 横断) `package-templates/.github/PULL_REQUEST_TEMPLATE.md` と `package-templates/worksheet/ai-code-understanding.md` は既に pack 対象である
- [ASM-03] (Gate 横断) 既存 CLI の install state は schemaVersion 1 のまま拡張できる

## 関連ID

- PLAN-ID: PLAN-0045
- TASK-ID: TASK-0170, TASK-0171, TASK-0172, TASK-0173, TASK-0174

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0045-reviewability-cli-templates.md"
  target_type: SPEC
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
