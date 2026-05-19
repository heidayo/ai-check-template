# SPEC-0050: AC Test Matrix Structured Formats

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0050 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0049 |
| 権限レベル | platform |

## 背景・目的

`test-design-template.md` は AC と Test Matrix を Markdown 表で固定するが、機械可読 contract としては弱い。AI agent と CI が「名」を検証できるよう、AC / Test Matrix の JSON Schema、JSON / YAML examples、検証 CLI を追加する。

## 対象ユーザー

- AC と Test Matrix を repository artifact として管理したい利用者
- AI agent に固定済み AC を渡したい reviewer
- structured requirements を CI で検証したい maintainer

## スコープ（含む）

- `package-templates/docs/ac-test-matrix.schema.json` を追加する
- JSON / YAML example を追加する
- `ai-check-template expect --file <json|yaml> --json` を追加する
- `test-design-template.md` と docs に structured format の導線を追加する
- profile doc migration で structured format files をコピー対象に含める

## スコープ外（明示的に除外）

- 任意 YAML 仕様全体の parser 実装
- AC から test code を自動生成する機能
- `ai-check-template run` との自動突合
- 外部 JSON Schema validator dependency の追加

## 要件

### 機能要件
- [FR-01] JSON Schema が requirement / acceptanceCriteria / testMatrix を定義する
- [FR-02] JSON example と YAML example が schema と同じ field names を使う
- [FR-03] `expect` command が JSON file を validate する
- [FR-04] `expect` command が template subset の YAML file を validate する
- [FR-05] すべての AC ID が少なくとも1つの testMatrix row から参照される

### 非機能要件
- [NFR-01] runtime dependency を追加しない
- [NFR-02] validator error は machine-readable JSON にできる
- [NFR-03] 既存 Markdown template は引き続き手動利用できる

### セキュリティ要件
- [SEC-01] structured files に secret value を含める用途を推奨しない
- [SEC-02] validator は file content を実行しない

### 運用要件
- [OPS-01] `node --test tests/cli/expect.test.mjs` が pass
- [OPS-02] `make validate` が pass

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `package-templates/docs/ac-test-matrix.schema.json` が valid JSON
- [x] AC-02: `ai-check-template expect --file package-templates/docs/ac-test-matrix.example.json --json` が pass
- [x] AC-03: `ai-check-template expect --file package-templates/docs/ac-test-matrix.example.yaml --json` が pass
- [x] AC-04: 未参照 AC を含む fixture が fail する
- [x] AC-05: `init` が structured format docs を `docs/ai-check-template/docs/` にコピーする

## 異常系

- malformed JSON/YAML: invalid format issue を返す
- duplicate AC ID: fail
- testMatrix row が存在しない AC を参照: fail

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI contract: `expect --file --json`

## リスク

- YAML subset が狭すぎる → example と docs で対応範囲を明記する
- schema と validator が drift する → tests で example 両方を validate する

## 実装メモ（Implementation Agent向け）

JSON Schema は template / documentation artifact として提供し、CLI は dependency なしの手書き validator にする。YAML は本 template の subset (top-level object, nested object, list of scalar objects) に限定する。

## Properties

### Invariants
- [INV-01] (Gate 2) every AC is referenced by at least one test row
- [INV-02] (Gate 4) JSON and YAML examples use the same semantic shape
- [INV-03] (Gate 3) validator never executes file content

### Pre-conditions
- [PRE-01] (Gate 2) input file exists
- [PRE-02] (Gate 2) file extension is `.json`, `.yaml`, or `.yml`

### Post-conditions
- [POST-01] (Gate 2) valid files return status `pass`
- [POST-02] (Gate 2) invalid files return status `fail` with issues

### Assumptions
- [ASM-01] (Gate 横断) complex YAML users can convert to JSON before validation

## 関連ID

- PLAN-ID: PLAN-0050
- TASK-ID: TASK-0187

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0050-ac-test-matrix-structured-formats.md"
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
