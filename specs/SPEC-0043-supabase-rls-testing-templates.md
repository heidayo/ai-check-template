# SPEC-0043: Supabase RLS Testing Templates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0043 |
| ステータス | Implemented |
| 作成日    | 2026-05-18 |
| 更新日    | 2026-05-18 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0012, SPEC-0021, SPEC-0040 |
| 権限レベル | platform |

## 背景・目的

Supabase + RLS の品質保証では、UI がボタンを隠すだけでは不十分で、DB policy と API 経由の実ユーザー権限を両方検証する必要がある。既存 `supabase-rls` profile は考え方と scripts を提供しているが、利用者がコピーして試せる pgTAP、user-token integration、Magic Link E2E の雛形がまだない。

この SPEC では、`supabase-rls` addon を実務導入しやすくする manual-copy templates を追加する。

## 対象ユーザー

- Supabase RLS を使う Next.js / React / Expo / Node CLI プロジェクト
- AI が生成した RLS policy / API 実装を検証したい開発者
- `service_role` を使わず実ユーザー権限で authorization boundary を確認したい reviewer

## スコープ（含む）

- `package-templates/supabase/` に RLS testing README を追加する
- pgTAP の RLS policy test template を追加する
- Supabase JS + Vitest の user-token integration test template を追加する
- Magic Link / local mail capture E2E template を追加する
- `supabase-rls` profile、prompt catalog、validation、pack test へ導線を追加する

## スコープ外（明示的に除外）

- Supabase CLI / Docker / local stack を本リポ CI で起動しない
- CLI `init` / `update` に Supabase templates の自動コピー機能は追加しない
- 実プロジェクトの table 名、policy 名、credential、JWT、email address は含めない
- 本番 Supabase project や linked project に対する test 実行は扱わない
- migration generation / schema diff / deploy workflow は扱わない

## 要件

### 機能要件
- [FR-01] pgTAP template は self / others の read / update 境界を示し、`supabase test db` で実行する前提を明記する
- [FR-02] integration template は `service_role` を使わず、実ユーザー session / access token を使う構造を示す
- [FR-03] Magic Link E2E template は local mail capture URL を environment variable で差し替えられる
- [FR-04] profile README から new templates と `rls-permission.md` へ導線がある
- [FR-05] validation は新規 templates の存在・重要文言・pack inclusion を機械検証する

### 非機能要件
- [NFR-01] 汎用性: table / role / tenant 名は placeholder として表現する
- [NFR-02] 安全性: secret-like value、実 session、実 token を含めない
- [NFR-03] 段階導入: manual-copy template とし、既存 CLI behavior を変更しない

### セキュリティ要件
- [SEC-01] `service_role` は test bypass の注意としてのみ登場し、template の client 生成に使わない
- [SEC-02] RLS は許可ケースと拒否ケースを両方含む
- [SEC-03] Magic Link E2E は local mail capture 前提で、production mailbox や real email を使わない

### 運用要件
- [OPS-01] `make validate` が pass する
- [OPS-02] `bash scripts/sage-validate.sh` が pass する
- [OPS-03] `git diff --check` が pass する

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `package-templates/supabase/README.md` が存在し、`supabase test db`、`service_role`、`RLS` の説明を含む
- [x] AC-02: `package-templates/supabase/tests/database/rls_policy.test.sql` が存在し、pgTAP と許可 / 拒否ケースを含む
- [x] AC-03: `package-templates/supabase/tests/rls/rls.integration.test.ts` が存在し、`service_role` を使わない注意と access token flow を含む
- [x] AC-04: `package-templates/supabase/tests/e2e/magic-link.spec.ts` が存在し、local mail capture URL を environment variable で扱う
- [x] AC-05: `package-templates/profiles/supabase-rls/README.md` から Supabase templates へ導線がある
- [x] AC-06: `tests/cli/package.test.mjs` が新規 Supabase templates の pack inclusion を要求する
- [x] AC-07: `make validate` が pass する
- [x] AC-08: secret-like assignment scan が pass する
- [x] AC-09: File Scope check が pass する

## 異常系

- Supabase local stack が起動していない: template は `supabase start` を前提として明記する
- Supabase CLI version 差分: 公式 CLI docs の `supabase test db` を primary とし、version 確認を README に書く
- RLS を bypass する client が使われる: `service_role` 禁止を template と README に明記する
- local mail capture service の名称差分: Inbucket / Mailpit の差分を environment variable で吸収する

## 契約

- API: なし
- DB: template SQL only。migration は追加しない
- イベント: なし
- CLI contract: 変更なし
- Package contract: `package-templates/supabase/` は npm package に含まれる

## リスク

- リスク1: template が実テーブルにそのまま適用できない → 軽減策: placeholder と replacement checklist を README に明記
- リスク2: integration test で誤って privileged client を使う → 軽減策: `service_role` 禁止を強調し、anon client + user session flow を示す
- リスク3: Magic Link local capture API が Supabase CLI version で変わる → 軽減策: URL / endpoint を env var にし、Inbucket / Mailpit の差分を README に明記

## 実装メモ（Implementation Agent向け）

- `package-templates/supabase/` は manual-copy templates として追加する
- 実値はすべて placeholder にする
- TS template は実行されないため、読みやすさと置換ポイントを優先する
- package inclusion は `tests/cli/package.test.mjs` に追加する

## Properties

### Invariants
- [INV-01] (Gate 2) CLI `init` / `update` の挙動は変えない
- [INV-02] (Gate 3) template に実 secret / token / credential を含めない
- [INV-03] (Gate 3) `service_role` は bypass warning としてのみ扱う
- [INV-04] (Gate 2) RLS templates は許可と拒否の両方を含む

### Pre-conditions
- [PRE-01] (Gate 2) 利用者は Supabase local stack を target project で起動してから template を実行する
- [PRE-02] (Gate 2) 利用者は placeholder table / column / role を自 project に合わせて置換する

### Post-conditions
- [POST-01] (Gate 2) npm pack dry-run に Supabase templates が含まれる
- [POST-02] (Gate 4) `supabase-rls` profile から templates / prompt / docs を辿れる
- [POST-03] (Gate 3) secret scan が新規 files に対して pass する

### Assumptions
- [ASM-01] (Gate 横断) Supabase official docs の `supabase test db` / pgTAP / local testing guidance を一次資料とする
- [ASM-02] (Gate 横断) local mail capture は version により Inbucket / Mailpit 表記が揺れるため、template は env var で吸収する

## 関連ID

- PLAN-ID: PLAN-0043
- TASK-ID: TASK-0161, TASK-0162, TASK-0163, TASK-0164, TASK-0165

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0043-supabase-rls-testing-templates.md"
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
