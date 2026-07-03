# rls-permission プロンプト

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 目的

Row Level Security（RLS）や権限制御で、「見えるべき / 見えてはいけない」「書けるべき / 書けてはいけない」の両方をテストする。フロントの表示制御だけで満足せず、サーバー側 API / DB level で境界が破られないことを確認する。

形名参同の「名」に権限境界の拒否ケースを含めるための観点設計プロンプト。

## プロンプト本文

```
以下の権限制御仕様について、デシジョンテーブルで権限境界を整理し、許可される操作と拒否される操作の両方をテストしてください。

## 仕様
（例: 「ユーザーは自身が作成した記事を更新・削除できる。他人の記事は閲覧のみ可。管理者は全記事を更新・削除できる」）

## 手順

1. role を列挙（例: anonymous / user / owner / admin）
2. 対象リソースの状態を列挙（例: 自分のリソース / 他人のリソース / 公開 / 非公開）
3. 操作を列挙（read / create / update / delete）
4. role × resource state × 操作 のマトリクスで「許可 / 拒否」を明示
5. 各セルに対応するテストケースを生成
6. **拒否ケースは API level でテスト**（フロントの非表示だけでは不十分）

## 出力形式

### Step 1: 権限マトリクス

| role | resource | read | create | update | delete |
|---|---|---|---|---|---|
| anonymous | any | OK / NG | NG | NG | NG |
| user | self | OK | OK | OK | OK |
| user | others | OK / NG | NG | NG | NG |
| admin | any | OK | OK | OK | OK |

### Step 2: 拒否ケースのテスト（最重要）

各 NG セルについて:
- 該当 role / resource を使い、該当操作を試みる
- 401 / 403 / 404 等の拒否応答を確認
- DB / RLS 等のサーバー側 level で実際に拒否されることを確認（mock や middleware で擬似的に通さない）

### Step 3: 許可ケースのテスト

各 OK セルについて:
- 該当 role / resource で該当操作が成功する

## 制約

- 拒否は **API 直叩き** でテストする（curl / supertest / API client）。UI 経由だけでは網羅性が不足
- フロントの「ボタンを非表示」は UX 改善であって、セキュリティ対策ではない
- RLS（Row Level Security）を使う場合、ポリシー単位で許可・拒否両方をテストする
```

## 利用例

### 入力仕様
> 記事は user_id で所有される。自分の記事は更新・削除可。他人の記事は閲覧のみ。admin は全記事を更新可能。

### 期待される AI 出力

```
| role | 記事所有 | read | update | delete |
|---|---|---|---|---|
| anonymous | - | OK（公開のみ） | NG | NG |
| user | self | OK | OK | OK |
| user | others | OK（公開のみ） | NG | NG |
| admin | any | OK | OK | NG（admin は削除権限なし） |
```

各セルのテスト:
- `user (others) update 記事` → 403 / 404 を確認
- DB-RLS test: 別 user_id でログインし、他人の記事を直接 UPDATE SQL → 0 rows affected または error

## 隣接する思想

- [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) §3. デシジョンテーブル — 権限マトリクスは特殊な DT
- [`../docs/philosophy/test-pyramid.md`](../docs/philosophy/test-pyramid.md) §5. DB-RLS test 層
- [`../docs/philosophy/given-when-then.md`](../docs/philosophy/given-when-then.md) — 拒否ケースを GWT で記述
- [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) — 権限境界の「名」を機械検証可能化

## カスタマイズ

- **multi-tenant**: organization_id / tenant_id の境界もマトリクスに加える
- **行レベル + 列レベル権限**: ある列だけ管理者にも見せないケースを別行で扱う
- **時間依存権限**: 「公開予約日時前は所有者のみ閲覧」等は state-transition プロンプトと組み合わせる

### マトリクス → テスト設定変数への落とし込み

生成した権限マトリクス（role / resource / action）を、RLS テストテンプレ（[`../supabase/README.md`](../supabase/README.md) 参照）の**設定変数**に対応づける。テンプレは変数集約形で、スキーマ依存の識別子は各ファイル冒頭の設定変数ブロック 1 箇所に集約されている。

| マトリクスの要素 | 対応するテスト設定変数（pgTAP / integration） |
|---|---|
| resource（対象テーブル） | `\set table_name <table>`（SQL）/ `const TABLE = process.env.RLS_TABLE ?? "..."`（TS） |
| resource の所有者列 | `\set owner_column <column>`（SQL）/ `const OWNER = process.env.RLS_OWNER_COLUMN ?? "..."`（TS） |
| role（テスト対象ユーザー） | test user の session / id（`SUPABASE_TEST_USER_A_SESSION` 等の env、SQL は `set_config('app.test_user_a', ...)`） |
| policy（許可 / 拒否の各セル） | テスト本文の許可アサーション（`isnt_empty` / `lives_ok`）/ 拒否アサーション（`is_empty` / `throws_ok`） |

- マトリクスの resource（テーブル）と所有者列は、各テンプレ冒頭の設定変数ブロックに書き込む（または env で注入する）。SQL の識別子はドル引用符 `$$...$$` 内では psql 変数展開が効かないため、`format('%I', :'table_name')`（値展開 `:'var'` を format() の外から渡し、`%I` で安全に識別子化）で参照する
- マトリクスの各 OK / NG セルは、テスト本文のアサーション 1 つに対応させ、セル数と `plan(...)` の件数を合わせる
- `service_role` は RLS を bypass するため、どの role の検証でも使わない（実ユーザー session で検証する）

## 出典

- Notion ページ: `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計（参照日 2026-05-13）の Supabase / RLS 観点
- 補強: `7c531b165bab4b7ea2dce1782469ac52` — Supabase Testing 戦略（pgTAP, service_role を使わない検証）
