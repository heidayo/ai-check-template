# SPEC-0051: Security Gate Expansion

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0051 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0040 |
| 権限レベル | platform |

## 背景・目的

`ai:check:secure` は Semgrep の入口として分離されているが、secret scan、dependency audit、supply-chain check の標準入口がない。既存分離思想を保ちつつ、profile-generated scripts で security evidence を複数 step に広げる。

## 対象ユーザー

- AI生成コードの trust boundary を PR で確認したい利用者
- security evidence を機能品質 gate から分離したい CI maintainer
- secret / dependency / supply-chain の最低限の入口を欲しい OSS 利用者

## スコープ（含む）

- `ai:check:secure` を `security:secrets` / `security:deps` / `security:supply-chain` / `security:sast` の chain にする
- package manager ごとの dependency / supply-chain command を生成する
- manual fragment と profile docs を更新する
- support script defaults と missing referenced script diagnostics を整合させる
- tests と docs を更新する

## スコープ外（明示的に除外）

- scanner finding の triage engine 実装
- scanner dependencies の自動 install
- organization-specific Semgrep rules
- GitHub code scanning SARIF upload
- npm package version bump / publish

## 要件

### 機能要件
- [FR-01] generated `ai:check:secure` は4 security scripts を順に呼ぶ
- [FR-02] `security:sast` は `semgrep scan --config auto` を維持する
- [FR-03] `security:secrets` は secret scanning command を提供する
- [FR-04] `security:deps` は package-manager-aware audit command を提供する
- [FR-05] `security:supply-chain` は package-manager-aware supply-chain check command を提供する

### 非機能要件
- [NFR-01] `ai:check` と `ai:check:secure` の分離を維持する
- [NFR-02] runtime dependency を追加しない
- [NFR-03] existing user support scripts は update 時に上書きしない

### セキュリティ要件
- [SEC-01] secret scan / dependency audit / supply-chain / SAST の4分類が明示される
- [SEC-02] scanner output の修復は `security-scan.md` を使うよう docs で案内する

### 運用要件
- [OPS-01] init/update/package tests が pass
- [OPS-02] `make validate` が pass

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `react-nextjs` init 後 `ai:check:secure` が `security:secrets`, `security:deps`, `security:supply-chain`, `security:sast` を参照する
- [x] AC-02: npm package manager 指定時の audit scripts が npm command になる
- [x] AC-03: missing support scripts が init/update で追加される
- [x] AC-04: manual `package.scripts.fragment.json` に4 security scripts が含まれる
- [x] AC-05: `npm test` が pass

## 異常系

- target project に scanner binary がない場合: script 実行時に対象 project 側で fail し、`security-scan.md` の修復 flow に渡す
- package manager が unsupported の場合: 既存 validation error を返す

## 契約

- API: なし
- DB: なし
- イベント: なし
- package scripts contract: `ai:check:secure` + `security:*`

## リスク

- security gate が重くなる → 分離 gate のままとし、`ai:check` には混ぜない
- external tools が未導入で fail する → docs で customize/skip 方針を明記する

## 実装メモ（Implementation Agent向け）

`profile-scripts.mjs` に package-manager-aware security support scripts を追加し、init/update が `getProfileSupportScripts(profile, { packageManager })` を使うようにする。既存 support script は上書きしない。

## Properties

### Invariants
- [INV-01] (Gate 3) `security:sast` は Semgrep entrypoint を維持する
- [INV-02] (Gate 3) `ai:check` は security scripts を直接含まない
- [INV-03] (Gate 4) existing support scripts are preserved

### Pre-conditions
- [PRE-01] (Gate 2) package manager is one of pnpm/npm/yarn/bun

### Post-conditions
- [POST-01] (Gate 3) generated target has four security support scripts
- [POST-02] (Gate 2) tests cover pnpm and npm rendering

### Assumptions
- [ASM-01] (Gate 横断) target project owns scanner install and rule tuning

## 関連ID

- PLAN-ID: PLAN-0051
- TASK-ID: TASK-0188

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0051-security-gate-expansion.md"
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
