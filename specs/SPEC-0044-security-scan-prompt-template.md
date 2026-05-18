# SPEC-0044: Security Scan Prompt Template

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0044 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0040 |
| 権限レベル | platform |

## 背景・目的

SPEC-0040 で `ai:check:secure` を機能品質の `ai:check` から分離した。次に必要なのは、Semgrep / CodeQL / dependency audit などの deterministic security output を AI に渡すときの安全な読み方と修復依頼の型である。

この SPEC では、security diagnostic を AI に解釈・修復させるための prompt template を追加し、`ai:check:secure` の運用導線を補強する。

## 対象ユーザー

- AI 生成コードを PR 前に security scan したい開発者
- Semgrep / CodeQL の結果を AI に読ませたい reviewer
- security finding を機能テスト失敗と混同せず扱いたい maintainer

## スコープ（含む）

- `package-templates/prompts/security-scan.md` を追加する
- prompt catalog と usage model に `ai:check:secure` との接続を追加する
- validation / pack dry-run test に新規 prompt inclusion を追加する
- SAGE artifacts を作成し、採点・検証する

## スコープ外（明示的に除外）

- Semgrep / CodeQL workflow の新規 CI example は追加しない
- `ai:check:secure` の command は変更しない
- Semgrep rules / CodeQL query は追加しない
- 実 vulnerability を本リポで修復する作業は含めない
- root `.github/workflows/` は変更しない

## 要件

### 機能要件
- [FR-01] prompt は Semgrep / CodeQL / dependency audit の evidence を分離して扱う
- [FR-02] prompt は secret や private value の redaction rule を含む
- [FR-03] prompt は「deterministic tool output を根拠にし、AI 推測だけで断定しない」制約を含む
- [FR-04] prompt は fix / suppress / accept risk の判断基準を要求する
- [FR-05] prompt catalog と usage model から security prompt に辿れる

### 非機能要件
- [NFR-01] 汎用性: Semgrep 以外の SAST / dependency tool output も貼れる構造にする
- [NFR-02] 安全性: secret-like assignment を含めない
- [NFR-03] 段階導入: CLI behavior は変えず、prompt template の追加に留める

### セキュリティ要件
- [SEC-01] prompt は raw secret / credential / personal data の貼り付けを禁止する
- [SEC-02] prompt は security finding を test weakening で解消することを禁止する
- [SEC-03] prompt は suppress する場合に理由・期限・owner を要求する

### 運用要件
- [OPS-01] `make validate` が pass する
- [OPS-02] `bash scripts/sage-validate.sh` が pass する
- [OPS-03] `git diff --check` が pass する

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `package-templates/prompts/security-scan.md` が存在し、`ai:check:secure` と `semgrep scan --config auto` を含む
- [x] AC-02: security prompt が redaction、evidence、triage、repair、re-check、suppression policy を含む
- [x] AC-03: `package-templates/prompts/README.md` に `security-scan.md` が catalog 登録される
- [x] AC-04: `docs/usage-model.md` から `security-scan.md` へ導線がある
- [x] AC-05: `tests/cli/package.test.mjs` が pack inclusion を要求する
- [x] AC-06: `make validate` が pass する
- [x] AC-07: secret-like assignment scan が pass する
- [x] AC-08: File Scope check が pass する

## 異常系

- Finding が false positive の場合: suppress ではなく、根拠・期限・owner を記録する
- Raw output に secret が含まれる場合: prompt に貼る前に redaction する
- AI が severity を下げようとする場合: tool evidence と code path で説明できない限り採用しない

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI contract: 変更なし
- Package contract: new prompt は npm package に含まれる

## リスク

- リスク1: AI が security finding を過信または軽視する → 軽減策: deterministic output と code path evidence を必須化
- リスク2: suppression が恒久化する → 軽減策: reason / owner / expiration を要求
- リスク3: raw diagnostic に secret が混ざる → 軽減策: redaction rule を prompt 冒頭に置く

## 実装メモ（Implementation Agent向け）

- 既存 `diagnostic-repair.md` と構造を揃える
- `ai:check:secure` は Semgrep default command を保持する
- CodeQL は optional evidence として扱い、workflow 実装はしない

## Properties

### Invariants
- [INV-01] (Gate 2) CLI behavior は変えない
- [INV-02] (Gate 3) prompt は raw secret の貼り付けを禁止する
- [INV-03] (Gate 3) fix / suppress / accept risk の判断理由を要求する

### Pre-conditions
- [PRE-01] (Gate 3) security tool output は redacted 済みである
- [PRE-02] (Gate 3) acceptance criteria は security finding を避ける目的で変更しない

### Post-conditions
- [POST-01] (Gate 2) npm pack dry-run に `security-scan.md` が含まれる
- [POST-02] (Gate 4) prompt catalog と usage model から security prompt を辿れる
- [POST-03] (Gate 3) secret scan が pass する

### Assumptions
- [ASM-01] (Gate 横断) Semgrep official CLI docs の `semgrep scan --config auto` を primary quick-start command とする
- [ASM-02] (Gate 横断) CodeQL は GitHub code scanning / CodeQL Action の optional evidence として扱う

## 関連ID

- PLAN-ID: PLAN-0044
- TASK-ID: TASK-0166, TASK-0167, TASK-0168, TASK-0169

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0044-security-scan-prompt-template.md"
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
