# Given-When-Then

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## このファイルの守備範囲

Given-When-Then（GWT）構文の定義と、AI 駆動開発における受け入れ条件先行運用を扱う。

GWT の「Then」を機械検証可能な「名」に変換する方法は [`formal-name-match.md`](./formal-name-match.md)、各層（Static / Unit / Integration / E2E / DB-RLS）での GWT 例は [`test-pyramid.md`](./test-pyramid.md)、GWT で書くべき観点を導く技法は [`qa-techniques.md`](./qa-techniques.md) を参照。

## 概念定義

Given-When-Then（GWT）は、**テストケース・受け入れ条件・要件を「前提 / 操作 / 期待結果」の 3 要素で表現する記法**。

- **Given**: 前提条件（テスト開始時の状態）
- **When**: 実行する操作（外部入力 / API 呼び出し / ユーザー操作）
- **Then**: 期待結果（出力 / 状態変化 / 副作用）

AI 駆動開発では、いきなり「実装してください」と AI に依頼すると、「正しさ」の基準が AI と人間で食い違う。**実装前に GWT で受け入れ条件を AI に書かせる**ことで、何をもって正しいかを先に固定する。

GWT は形名参同の「名」を具体化するための記法。

## GWT 構文

### 基本形

```
Given: <前提条件>
When: <操作>
Then: <期待結果>
```

例:
```
Given: 未ログインのユーザーが商品一覧ページを開いている
When: 商品詳細リンクをクリックする
Then: 商品詳細ページが表示され、保存ボタンが「ログインが必要です」と表示される
```

### 複数 When（And）

```
Given: ユーザーがログインしている
When: アイテム X を保存する
And: 保存ボタンを再度クリックする
Then: 保存が解除され、保存一覧から X が消える
```

ただし複数 When は責務が混在する兆候。可能ならテストケースを分ける。

### 複数 Then（And）

```
Given: ユーザーがログイン済み
When: プロフィール更新フォームを送信する
Then: ステータス 200 が返る
And: DB の users.updated_at が更新される
And: 「保存しました」トーストが表示される
```

複数 Then は OK（1 操作で複数の副作用がある）。各 Then が独立に検証可能であることが重要。

### Background（共通前提）

複数のシナリオで前提が共通の場合、Background でまとめる:

```
Background:
  Given: 一般ユーザー A がログイン済み
  And: アイテム X, Y, Z が DB に存在する

Scenario 1: 一覧表示
  When: アイテム一覧ページを開く
  Then: X, Y, Z がすべて表示される

Scenario 2: 保存
  When: アイテム X を保存する
  Then: 保存一覧に X だけが表示される
```

## AI への指示パターン

### 実装前: 受け入れ条件を先に出させる

```
この機能を実装する前に、Given-When-Then 形式で受け入れ条件を 5 件以上書いてください。

含めるべき観点:
- 正常系（最低 2 件）
- 異常系（最低 2 件）
- 境界ケース（最低 1 件）

各シナリオは独立して検証可能であること。
まだコードは書かないでください。
```

これにより、AI が「何を作るか」を曖昧なまま実装に入るのを防ぐ。

### 実装後: GWT と実装の対応表を出させる

```
実装が完了したら、以下の表を出力してください。

| Scenario | 検証コマンド | 実装ファイル | 検証結果 |
|---|---|---|---|
```

GWT のシナリオ ID と実装の対応を明示することで、後からの保守が楽になる。

### テスト生成: GWT からテストコードを生成

```
以下の GWT シナリオに対応するテストコードを生成してください。
ただし以下の制約を守ってください:

- Given は beforeEach または setup ステップに対応
- When はテスト内の操作 (act) に対応
- Then は assertion に対応
- 1 Scenario = 1 test case
- テスト種別（Unit / Integration / E2E）を明示
```

GWT は人間が読みやすいが、AI が直接実行できる形式ではない。GWT → テストコードへの変換を AI に任せる。

## 受け入れ条件への落とし方

GWT は人間が読みやすい一方、機械検証可能化が必要。以下の手順で「形名参同」の「名」に変換する。

### 1. Then を測定可能な形にする

悪い例:
```
Then: 正しく動作する
```

良い例:
```
Then: レスポンスステータスが 200 で、レスポンスボディの id フィールドが UUID v4 形式
```

### 2. 検証コマンドに対応させる

```
Scenario: ログイン成功
  Given: 有効なメールアドレスとパスワードを保持
  When: POST /auth/login を呼ぶ
  Then: ステータス 200 とトークンが返る

検証コマンド:
  STATUS=$(curl -s -o /tmp/body -w "%{http_code}" -X POST /auth/login \
    -d '{"email":"...","password":"..."}')
  test "$STATUS" = "200" && jq -e '.token' /tmp/body
```

### 3. 失敗時の振る舞いも GWT で書く

正常系だけでは「名」が不完全。異常系も明示する。

```
Scenario: ログイン失敗（無効パスワード）
  Given: 登録済みメールアドレスを保持
  When: 誤ったパスワードで POST /auth/login を呼ぶ
  Then: ステータス 401 と { "error": "invalid_credentials" } が返る
  And: DB の failed_attempts カウンターが +1 される
```

異常系の Then には「拒否される / エラーが返る / 副作用が起きない」を明示する。

## アンチパターン

| アンチパターン | 何が悪いか | 修正 |
|---|---|---|
| 曖昧な Given（「いい感じの状態」） | 再現できない、テストできない | 具体的な状態を列挙 |
| 副作用を持つ When（内部で他処理を勝手に実行） | 何を検証しているか不明 | 1 When = 1 操作 |
| 検証不能な Then（「ちゃんと動く」） | 機械検証できない | 出力 / 状態変化を具体化 |
| Then が複数の責務（ログ + DB + API を 1 行で混在） | 失敗原因が特定できない | Scenario を分ける or And で並列化 |
| Given に実装詳細（「内部で X 関数が呼ばれている」） | 仕様ではなく実装に依存 | 観測可能な状態のみ書く |
| Scenario が長すぎる（10 行以上） | 1 Scenario が複数仕様を兼ねている | 分割する |
| 期待結果が「画面に何か出る」 | 出力内容が確認不能 | 文言 or 構造を具体化 |

## 形名参同との関係

GWT の Then = 形名参同の「名」。実装後に Then を機械検証コマンドで照合することで、「名」と「形」の一致を確認する。

```
GWT の Then「ステータス 200 と token が返る」
  ↓ 機械検証可能化
名: HTTP status == 200, response.token != null
  ↓ 実装後に測定
形: curl コマンドの実測値
  ↓ 照合
名 == 形 ?
```

GWT を書いた段階で「名」がほぼ確定する。実装は「名」を満たすように行い、検証は「形」と照合するだけ。

## 隣接する思想との関係

- [`formal-name-match.md`](./formal-name-match.md) — GWT の Then を機械検証可能な「名」に変換し、「形」と照合する
- [`test-pyramid.md`](./test-pyramid.md) — 各層（Static / Unit / Integration / E2E / DB-RLS）の GWT 例
- [`qa-techniques.md`](./qa-techniques.md) — GWT で書くべき観点を導出する技法（同値分割・境界値・デシジョンテーブル等）

## 出典

- Notion ページ: `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計（参照日 2026-05-13）
- 一次資料: Cucumber / Gherkin（Given-When-Then 構文の標準化）、BDD（Behavior-Driven Development）
