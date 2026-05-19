# supabase-rls profile（addon）

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定。実体ファイルは Phase 2 で配布）

## 目的

Supabase + Row Level Security（RLS）を使うプロジェクトで、**他 profile に追加適用**する addon profile。pgTAP による DB level テストや、Magic Link 認証の E2E パターンを示す。

単独で完結する profile ではなく、`react-nextjs+supabase-rls` のように組み合わせて使う前提。

## 対象スタック

| カテゴリ | 想定 |
|---|---|
| Backend | Supabase（自前 PostgreSQL でも RLS 部分は適用可） |
| Database | PostgreSQL + Row Level Security |
| Auth | Supabase Auth（Magic Link / OAuth / Email/Password） |
| Combine with | react-nextjs / react-vanilla / expo-rn / node-cli いずれか |

## 推奨ツール（addon）

| ツール | 必須/推奨/任意 | 用途 | 備考 |
|---|---|---|---|
| **pgTAP** | 必須 | DB 単体・RLS テスト | Supabase CLI の `supabase test db` で実行 |
| **InBucket** | 推奨 | Magic Link / メール E2E | Supabase local の SMTP receiver |
| Supabase CLI | 必須 | local db / migration / test 実行 | `supabase start` で local Postgres 起動 |
| Vitest + supabase-js | 推奨 | 統合テスト（実ユーザートークン） | service_role は使わない |

## ai:check / ai:check:fast カスタマイズ案（addon）

base profile の `ai:check` に **追加** で:

```json
{
  "scripts": {
    "test:db": "supabase test db",
    "test:integration:rls": "vitest run --dir tests/rls",
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test && pnpm test:db && pnpm test:integration:rls && pnpm test:e2e:smoke",
    "ai:check:secure": "pnpm security:secrets && pnpm security:deps && pnpm security:supply-chain && pnpm security:sast"
  }
}
```

- `pnpm test:db`: pgTAP の SQL テスト実行
- `pnpm test:integration:rls`: 実ユーザートークンで他人データへのアクセス不可を検証
- `pnpm ai:check:secure`: secret scan / dependency audit / supply-chain check / Semgrep SAST で trust boundary / unsafe input handling を確認。RLS correctness は `test:db` / `test:integration:rls` が主担当。

## .claude / scripts カスタマイズ案（addon）

- `.claude/rules/test-rules.md` に **追記**:
  - RLS テストは「見えるべき / 見えてはいけない」両方をテスト
  - **`service_role` でテストしてはいけない**（権限を素通りする）
  - 実ユーザートークン（`Authorization: Bearer <user-jwt>`）で検証
- hook fragment は base profile と同じ

## 注意事項

- **`service_role` 落とし穴**: バックエンドキーで全 RLS をスキップしてしまうため、テストで `service_role` を使うと「RLS が機能しているか」検証できない。**必ず実ユーザートークンで検証**
- **Magic Link テスト**: InBucket（`http://127.0.0.1:54324`）の API で受信メールを取得 → リンクを抽出 → Playwright で踏む
- **migration の互換性**: 既存データへの破壊的変更（NOT NULL 追加、列削除）は本番反映前に dry-run
- **organization_id / tenant_id**: 必ず WHERE 条件で固定。RLS だけに依存しない（防御 in depth）
- **Edge Functions**: Deno で動くため、Node の test と別環境

## 推奨観点（[`../../prompts/rls-permission.md`](../../prompts/rls-permission.md) と併せて使う）

- role 別マトリクス（anonymous / user / admin）
- リソース所有マトリクス（self / others）
- 操作マトリクス（read / create / update / delete）
- multi-tenant 境界（organization_id / tenant_id）

## Manual-copy templates

RLS testing を実装する場合は、まず以下の templates を target project にコピーして placeholder を置換する。

- [`../../supabase/README.md`](../../supabase/README.md): pgTAP / integration / Magic Link E2E の導入手順
- [`../../supabase/tests/database/rls_policy.test.sql`](../../supabase/tests/database/rls_policy.test.sql): DB policy level の許可 / 拒否テスト
- [`../../supabase/tests/rls/rls.integration.test.ts`](../../supabase/tests/rls/rls.integration.test.ts): 実ユーザー session での API integration test
- [`../../supabase/tests/e2e/magic-link.spec.ts`](../../supabase/tests/e2e/magic-link.spec.ts): local mail capture を使う Magic Link smoke

`rls-permission.md` で権限マトリクスを作り、OK / NG の各セルを pgTAP または integration test に落とす。`service_role` は RLS を bypass し得るため、RLS correctness の検証では使わない。

## 隣接 profile（組み合わせ先）

- [`../react-nextjs/README.md`](../react-nextjs/README.md) — Next.js + Supabase の典型
- [`../react-vanilla/README.md`](../react-vanilla/README.md) — SPA + Supabase
- [`../expo-rn/README.md`](../expo-rn/README.md) — モバイル + Supabase
- [`../node-cli/README.md`](../node-cli/README.md) — CLI から Supabase API 操作

## 隣接思想

- [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) §5 DB-RLS test 層
- [`../../docs/philosophy/qa-techniques.md`](../../docs/philosophy/qa-techniques.md) §3 デシジョンテーブル（権限マトリクス）
- [`../../docs/philosophy/formal-name-match.md`](../../docs/philosophy/formal-name-match.md) — 形名参同
- [`../../docs/philosophy/given-when-then.md`](../../docs/philosophy/given-when-then.md) — GWT で RLS シナリオ記述
- [`../../prompts/rls-permission.md`](../../prompts/rls-permission.md) — RLS 専用プロンプト

## 出典

- Notion ページ: `7c531b165bab4b7ea2dce1782469ac52` — Supabase Testing 戦略（参照日 2026-05-13）
- Notion ページ: `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計（Supabase / RLS 観点）
- Supabase Testing Overview（公式）
- Supabase CLI testing and linting（公式）
- pgTAP 公式 docs
