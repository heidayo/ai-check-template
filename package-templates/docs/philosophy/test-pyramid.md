# テストピラミッド（責務分割）

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## このファイルの守備範囲

テストを Static / Unit / Integration / E2E / DB-RLS / Monitoring の 6 層に分け、各層の責務と適切な量を定義する。E2E 偏重の弊害と、責務分割による解消を扱う。

各層の「名」（成功基準）の照合は [`formal-name-match.md`](./formal-name-match.md)、各層に書くべき観点の抽出は [`qa-techniques.md`](./qa-techniques.md)、各層のケースを Given-When-Then で記述する方法は [`given-when-then.md`](./given-when-then.md) を参照。

## 概念定義

テストピラミッドは、**テストを責務別の層に分け、各層に適切な量・実行頻度・期待を割り当てる**設計思想。

AI 駆動開発では「安心したいから E2E を増やす」傾向があるが、E2E が肥大化すると以下が起きる:

- CI 時間が増えてフィードバックが遅くなる
- flaky（不安定）テストで開発者が信頼しなくなる
- 失敗時の原因特定が重くなる
- 1 件の修正に対するメンテコストが上がる

そのため、E2E の量は最小化し、**より下位の層（Static / Unit / Integration）で先に問題を捕まえる**設計が良い。

「形名参同」の「名」（成功基準）を、各層でどう定義するかが本ドキュメントの主題。

## 各層の定義

### 1. Static check（最下層）

プログラムを実行せず、ソースコードの静的解析で検出できる問題を扱う。

- 型チェック（TypeScript の `tsc --noEmit`、Go の `go vet`、Rust の `cargo check` 等）
- lint（ESLint / oxlint / Biome / Ruff 等）
- 未使用コード検出（Knip / depcheck 等）
- フォーマットチェック（Prettier / gofmt 等）

実行コストは最も低く、フィードバックは最も速い。AI 駆動開発では実装直後の **fast loop** に必ず含める。

### 2. Unit test

純粋関数・モジュール単体の振る舞いを検証する。外部 I/O（ネットワーク / DB / ファイル / 時刻）に依存しない。

- バリデーションロジック
- 変換関数（時刻フォーマット、文字列変換等）
- 状態遷移計算（reducer / state machine）
- ドメインロジック（料金計算、権限判定等）

実行は数 ms〜数百 ms。多数あっても CI を遅らせない。**最も多くのテストを書くべき層**。

### 3. Integration test

複数モジュールやレイヤをまたぐ結合動作を検証する。外部依存はモック化または local 実体を使う。

- フォームのバリデーション + 送信フロー（UI + API）
- API ハンドラー + DB（in-memory or local container）
- 認可ロジック + ユーザー状態の組み合わせ
- 画面表示と API 結果の整合

実行コストは中程度。Unit よりは少なく、E2E よりは多く書く。

### 4. E2E test

実ブラウザまたは実環境で、エンドユーザー目線の重要導線を検証する。

- サインアップ → ログイン → 主要機能利用
- 決済フロー
- 認証フロー（外部 IdP との連携を含む場合）

実行コストは高い（数秒〜数十秒）。flaky 化しやすい。**事業上壊れたら致命的な導線のみ**に絞る。

### 5. DB-RLS test

データベース層、特に Row Level Security や権限制御を検証する。

- 他人のデータが見えないこと（RLS）
- 権限がないユーザーが書き込めないこと
- 制約・トリガー・関数の動作

専用ツール（pgTAP 等）を使うことが多い。SQL レベルで検証する。AI に「フロントで隠したから OK」と判断させないために**サーバー側のテストが必須**。

### 6. Monitoring（本番）

本番環境で再現困難な不具合を検知する。

- エラーレート / レイテンシのアラート
- セッションリプレイ
- ヘルスチェック / 合成監視（Synthetic Monitoring）

「テスト」ではないが、品質保証の連続体として扱う。本番で初めて発覚する問題は、次回のテスト設計にフィードバックする。

## 責務分割表

| 層 | 検証対象 | 実行頻度 | テスト数 | flake 許容 | 代表ツール例 |
|---|---|---|---|---|---|
| Static | 型・lint・未使用 | 毎保存 / pre-commit | - | なし | typecheck / lint / unused-detector |
| Unit | 純粋ロジック | 毎保存 / CI | 多 | なし | unit test runner |
| Integration | モジュール結合 | CI | 中 | 小 | test runner + testing-library |
| E2E | 主要導線 | CI（smoke は PR、full は nightly 等） | 少 | 小 | browser automation |
| DB-RLS | 権限境界 | CI | 中 | なし | SQL test framework |
| Monitoring | 本番異常 | 常時 | - | - | APM / synthetic / error tracker |

層を上に進むほど、コストが上がり、量が減る。これがピラミッドの形になる理由。

## よくある失敗

- **E2E 過多**: 安心感のために E2E を増やし、CI が 30 分超かかるようになる
- **Unit 過少**: 純粋関数を E2E で検証してしまう
- **DB-RLS 未検証**: フロントの表示制御だけで満足し、API 直叩きで漏洩
- **Monitoring 設定漏れ**: 本番デプロイ後の異常検知がなく、ユーザー報告で気づく
- **層を混ぜる**: 1 つのテストが「Unit + Integration + E2E」を兼ねて、失敗原因が不明
- **責務外のテスト**: Static で検出すべき型エラーを Unit テストで catch しようとする
- **flaky を放置**: 不安定 E2E を retry で誤魔化し、本物の障害を見逃す
- **テストを実装の鏡にする**: 仕様ではなく実装をテストして、リファクタで全部壊れる

## AI 駆動開発での適用

AI に「テストを書いて」と言うと、無意識に E2E や Integration に寄りがち。**責務を明示して指示**する。

### Unit を書かせる指示
```
このテストは Unit テストです。
- 外部依存（DB / API / 時刻）はモック化または注入
- 純粋関数として振る舞いを検証
- 1 ケース 1 アサート
- 同値分割と境界値を含める
```

### E2E を書かせる指示
```
このテストは E2E です。
- 実ブラウザで操作
- API 失敗時の表示、二重送信防止、戻る操作を含める
- 主要導線（ログイン → 機能 X 利用）のみ
- 副次的なバリエーションは E2E で扱わず Integration へ
```

### DB-RLS を書かせる指示
```
DB-RLS テストです。
- SQL level でテストを書く
- 他人のデータが見えないこと、書けないことの両方を検証
- role / user_id / tenant_id 等の境界を網羅
- 「フロントで弾いている」を理由に省略しない
```

## 形名参同との関係

各層の「名」（成功基準）の典型:

| 層 | 「名」の例 |
|---|---|
| Static | 型エラー 0、lint エラー 0、未使用 export 0 |
| Unit | 全テスト pass、カバレッジ 80%+（または閾値） |
| Integration | 主要結合シナリオの正常系・異常系の pass |
| E2E | 主要導線の smoke test pass |
| DB-RLS | 権限テスト全 pass、拒否ケース全カバー |
| Monitoring | エラーレート < 0.1%、p95 レイテンシ < SLO |

これらを「形」（実測値）と照合するのが [`formal-name-match.md`](./formal-name-match.md) の役割。

## 隣接する思想との関係

- [`formal-name-match.md`](./formal-name-match.md) — 各層で測定する「形」を「名」と照合する仕組み（形名参同）
- [`given-when-then.md`](./given-when-then.md) — 各層のテストケースを Given-When-Then で記述する方法
- [`qa-techniques.md`](./qa-techniques.md) — 各層に適用すべき QA 技法（境界値・状態遷移等）

## 出典

- Notion ページ: `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計（参照日 2026-05-13）
- 一次資料: The Practical Test Pyramid（Martin Fowler）、Testing Trophy（Kent C. Dodds）
- DB-RLS 層の補強: Supabase Testing Overview 公式ドキュメント（pgTAP 等の SQL レベル検証手段）。具体の pgTAP / InBucket テンプレートは `supabase-rls` プロファイル系の別 SPEC で扱う
