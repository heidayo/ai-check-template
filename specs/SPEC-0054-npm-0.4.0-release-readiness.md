# SPEC-0054: npm 0.4.0 Release Readiness

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0054 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0049, SPEC-0050, SPEC-0051, SPEC-0052, SPEC-0053 |
| 権限レベル | platform |

## 背景・目的

SPEC-0049 から SPEC-0053 で repository-current CLI に `run` / `expect`、構造化 AC/Test Matrix、拡張 security gate、hook matcher 拡張、初見導線が入った。一方で npm latest は `ai-check-template@0.2.0` のままで、docs でも repository-current と published package の境界を明記している。次の npm CLI release candidate として `0.4.0` を準備し、version、release notes、roadmap、validation guard を同期する。

`v0.3.0` は既に GitHub Actions integration release としてタグ・release 名に使われているため、npm CLI の次 minor は `0.4.0` とする。

## 対象ユーザー

- `run` / `expect` を npm package から使いたい利用者
- release notes と roadmap で公開状態を確認する maintainer
- package contents と publish dry-run を検証する release reviewer

## スコープ（含む）

- `package.json` version を `0.4.0` に更新する
- deterministic install state test の期待 version を更新する
- `docs/releases/v0.4.0.md` を追加する
- README / README-en / roadmap / CLI docs の release wording を `0.4.0` release-ready 状態に同期する
- `Makefile` structure checks に `0.4.0` release readiness と新 CLI files を追加する

## スコープ外（明示的に除外）

- npm registry への実 publish
- git tag `v0.4.0` の作成
- GitHub Release の作成
- `run` / `expect` / security gate の追加挙動変更
- package contents の大規模整理

## 要件

### 機能要件
- [FR-01] package version は `0.4.0` である
- [FR-02] release notes は SPEC-0049〜0053 の主要変更を含む
- [FR-03] roadmap は v0.4.0 を npm CLI release-ready milestone として表現する
- [FR-04] README / README-en は v0.4.0 の位置づけと publish pending を示す

### 非機能要件
- [NFR-01] runtime dependency を追加しない
- [NFR-02] `make validate` の package pack / publish dry-run guard を維持する
- [NFR-03] published `0.2.0` と repository-current `0.4.0` の区別を残す

### セキュリティ要件
- [SEC-01] npm publish はこの SPEC では実行しない。publish は maintainer auth と明示承認を必要とする
- [SEC-02] release notes に secret / token / auth 情報を含めない

### 運用要件
- [OPS-01] `npm test` が pass
- [OPS-02] `make validate` が pass
- [OPS-03] `git diff --check` が pass

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `node -p "require('./package.json').version"` が `0.4.0` を返す
- [x] AC-02: `docs/releases/v0.4.0.md` が存在し、`run`, `expect`, `ai:check:secure`, `MultiEdit`, `first-look` を含む
- [x] AC-03: `tests/cli/init.test.mjs` の install state 期待値が `0.4.0`
- [x] AC-04: `Makefile` が `docs/releases/v0.4.0.md` と `src/cli/run.mjs` / `src/cli/expect.mjs` を検証する
- [x] AC-05: `make validate` が pass

## 異常系

- `0.4.0` が既に npm registry に存在する場合: `validate-npm-publish-dry-run` は registry visibility check に切り替わる
- `0.4.0` が未公開の場合: `npm publish --dry-run --tag latest --json` が preflight として実行される
- docs が published 状態を誤って主張する場合: reviewer は publish pending wording へ戻す

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI contract: version metadata と docs の release contract

## リスク

- リスク1: v0.3.0 と npm 0.4.0 の関係が混乱する → release wording に v0.3.0 は GitHub Actions release、0.4.0 は npm CLI release candidate と明記する
- リスク2: publish していないのに published と読める → status を release-ready / publish pending に統一する
- リスク3: package contents に新 CLI file が入らない → package test と Makefile guard に `run.mjs` / `expect.mjs` を追加する

## 実装メモ（Implementation Agent向け）

既存 `docs/releases/v0.2.0.md` と `docs/releases/v0.3.0.md` の構成に合わせる。publish 手順は記載するが、この TASK では `npm publish` / tag / GitHub Release は実行しない。`package.json` の version bump に伴い install state test 期待値を同期する。

## Properties

### Invariants
- [INV-01] (Gate 2) `package.json.version` と install state test の期待 packageVersion は一致する
- [INV-02] (Gate 4) v0.3.0 GitHub Actions release の意味は変更しない
- [INV-03] (Gate 3) npm publish は validation dry-run に限定し、実 publish は行わない

### Pre-conditions
- [PRE-01] (Gate 2) SPEC-0049〜0053 は main に merge 済み
- [PRE-02] (Gate 2) `package.json` が存在する

### Post-conditions
- [POST-01] (Gate 2) repository は npm 0.4.0 release candidate として pack / dry-run validation 可能
- [POST-02] (Gate 4) README / roadmap / CLI docs は同じ release wording を共有する

### Assumptions
- [ASM-01] (Gate 横断) npm publish と tag 作成は maintainer が別作業で行う

## 関連ID

- PLAN-ID: PLAN-0054
- TASK-ID: TASK-0191

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0054-npm-0.4.0-release-readiness.md"
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
