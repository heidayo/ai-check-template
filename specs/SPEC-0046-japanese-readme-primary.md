# SPEC-0046: Japanese README Primary

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0046 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0009 |
| 権限レベル | platform |

## 背景・目的

GitHub repository top page は `README.md` を自動表示するため、現状の英語 primary 構成ではブラウザ上で日本語 README に即座に切り替えられない。利用者の主な初期読者が日本語で内容を把握したい場合、repository entry point を日本語にし、英語版を明示的な `README-en.md` に移す方が導線として分かりやすい。

この SPEC では、`README.md` を日本語 primary に変更し、英語本文を `README-en.md` として保持する。既存の `README-ja.md` 外部リンクは壊さず、日本語 README への互換案内にする。

## 対象ユーザー

- GitHub repository top page から日本語で概要を読みたい利用者
- 英語版 README も参照したい OSS 利用者
- npm package tarball から README を確認する利用者

## スコープ（含む）

- `README.md` を日本語本文にする
- 旧英語 `README.md` を `README-en.md` に移す
- `README-ja.md` を既存リンク互換用の短い案内にする
- README 間の language links を更新する
- package manifest / pack test / Makefile validation / docs references を更新する
- SAGE artifacts を作成し、採点・検証する

## スコープ外（明示的に除外）

- README の内容方針や機能説明そのものは大きく書き換えない
- package version / npm publish / release tag は変更しない
- `package-templates/` の配布テンプレ本文は変更しない
- GitHub repository settings は変更しない

## 要件

### 機能要件
- [FR-01] GitHub top で表示される `README.md` は日本語本文にする
- [FR-02] 英語本文は `README-en.md` で保持する
- [FR-03] `README.md` から `README-en.md` にリンクできる
- [FR-04] `README-en.md` から `README.md` にリンクできる
- [FR-05] `README-ja.md` は `README.md` への互換案内として残す
- [FR-06] npm pack に `README.md`, `README-en.md`, `README-ja.md` が含まれる

### 非機能要件
- [NFR-01] 既存 `README-ja.md` への外部リンクを 404 にしない
- [NFR-02] README content の大規模な意味変更は避け、言語入口の変更に限定する
- [NFR-03] Makefile / package test で README file set を検証する

### セキュリティ要件
- [SEC-01] README 変更で token / secret / credential を追加しない
- [SEC-02] package manifest に credential / environment value を追加しない

### 運用要件
- [OPS-01] `make validate` が pass する
- [OPS-02] `bash scripts/sage-validate.sh` が pass する
- [OPS-03] `git diff --check` が pass する
- [OPS-04] File Scope check が pass する

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `README.md` の先頭が日本語 primary になり、`README-en.md` へリンクしている
- [x] AC-02: `README-en.md` が旧英語 README 本文を保持し、`README.md` へリンクしている
- [x] AC-03: `README-ja.md` が `README.md` への互換案内として残る
- [x] AC-04: `package.json` の `files` と `tests/cli/package.test.mjs` が `README-en.md` を pack 対象として扱う
- [x] AC-05: `make validate-structure` が README file set と language links を検証する
- [x] AC-06: `make validate` が pass する
- [x] AC-07: `bash scripts/sage-validate.sh` が pass する
- [x] AC-08: secret-like pattern scan が pass する
- [x] AC-09: File Scope check が pass する

## 異常系

- `README-ja.md` への既存リンクが残っている場合: 短い互換案内で `README.md` に誘導する
- npm pack から英語版が抜ける場合: package test で検出する
- README 間リンクが循環または古いファイルを指す場合: Makefile grep と package test で検出する

## 契約

- API: なし
- DB: なし
- イベント: なし
- Package contract: `README-en.md` を npm package files に追加し、`README-ja.md` は互換用に保持する

## リスク

- リスク1: 英語 OSS 利用者が入口を見失う → 軽減策: `README.md` 冒頭に `English: README-en.md` を置く
- リスク2: 既存 `README-ja.md` リンクが壊れる → 軽減策: `README-ja.md` を互換案内として残す
- リスク3: npm package から英語版が抜ける → 軽減策: package manifest と pack test を更新する

## 実装メモ（Implementation Agent向け）

- `git mv README.md README-en.md` と `git mv README-ja.md README.md` で履歴を保つ
- `README-ja.md` は短い互換案内として新規作成する
- Makefile の README checks は `README.md` 日本語 primary、`README-en.md` English version、`README-ja.md` compatibility alias に合わせて更新する

## Properties

### Invariants
- [INV-01] (Gate 2) `README.md` は日本語 primary entry point である
- [INV-02] (Gate 2) `README-en.md` は英語版 entry point である
- [INV-03] (Gate 2) `README-ja.md` は削除せず互換リンクを保持する
- [INV-04] (Gate 3) README / package manifest に secret-like value を追加しない

### Pre-conditions
- [PRE-01] (Gate 2) 既存 `README.md` と `README-ja.md` が存在する
- [PRE-02] (Gate 2) package manifest の `files` が README files を明示管理している

### Post-conditions
- [POST-01] (Gate 2) GitHub top page は日本語 README を表示する
- [POST-02] (Gate 2) 英語版は `README-en.md` から参照できる
- [POST-03] (Gate 2) npm pack dry-run に `README-en.md` が含まれる
- [POST-04] (Gate 4) validation docs / checks が新しい README file set に追従する

### Assumptions
- [ASM-01] (Gate 横断) GitHub repository top page は root `README.md` を表示する
- [ASM-02] (Gate 横断) `README-ja.md` は過去リンク互換として残す価値がある

## 関連ID

- PLAN-ID: PLAN-0046
- TASK-ID: TASK-0175, TASK-0176, TASK-0177, TASK-0178

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0046-japanese-readme-primary.md"
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
