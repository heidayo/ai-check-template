# state-transition プロンプト

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 目的

状態を持つ機能（注文ステータス・記事ライフサイクル・予約ワークフロー等）で、許可される遷移と**禁止される遷移**の両方をテストする。AI は許可遷移だけテストしがちなので、不正遷移の拒否確認を明示的に依頼する。

形名参同の「名」に「不正遷移の拒否」を含めるための観点設計プロンプト。

## プロンプト本文

```
以下のステータス仕様について、状態遷移表を作成し、許可遷移と禁止遷移の両方をテストしてください。

## 仕様
（例: 「注文ステータスは pending / confirmed / shipped / delivered / cancelled。pending → confirmed → shipped → delivered の順で進む。pending または confirmed からのみ cancelled へ遷移できる」）

## 手順

1. 状態リストを列挙
2. 遷移表を作成（行: 遷移元、列: 遷移先、セル: 許可 / 禁止）
3. 許可遷移のテストケースを生成
4. 禁止遷移のテストケースを生成（**こちらが重要**）
5. 各禁止遷移について、サーバー側（API / DB）で拒否されることを確認

## 出力形式

### Step 1: 状態遷移表

| from \\ to | pending | confirmed | shipped | delivered | cancelled |
|---|---|---|---|---|---|
| pending | - | OK | NG | NG | OK |
| confirmed | NG | - | OK | NG | OK |
...

### Step 2: テストコード

- 許可遷移: 「pending → confirmed が成功する」「confirmed → shipped が成功する」...
- 禁止遷移: 「pending → shipped が API で拒否される（4xx 応答）」「delivered → pending が拒否される」...

## 制約

- 全 N×N 通りの遷移を表に明示すること（自己遷移含む）
- 禁止遷移は**サーバー側 API / DB level** で拒否されることを確認（フロントの非表示だけでは不十分）
- 1 遷移 1 テストケース
```

## 利用例

### 入力仕様
> 記事ステータスは draft / review / published / archived。draft → review → published の順。published → archived は許可、archived → published は禁止。

### 期待される AI 出力

```
| from \\ to | draft | review | published | archived |
|---|---|---|---|---|
| draft | - | OK | NG | NG |
| review | OK | - | OK | NG |
| published | NG | NG | - | OK |
| archived | NG | NG | NG | - |
```

各セルに対応するテストケース（許可遷移 OK ケース + 禁止遷移の拒否ケース）。

## 隣接する思想

- [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) §4. 状態遷移テスト — 技法の理論
- [`../docs/philosophy/given-when-then.md`](../docs/philosophy/given-when-then.md) — 遷移を GWT で記述する
- [`../docs/philosophy/test-pyramid.md`](../docs/philosophy/test-pyramid.md) — DB-RLS 層と Integration 層の境界

## カスタマイズ

- **状態数が多い（10 以上）**: 表が肥大化。条件付き遷移（例: role 別の許可遷移）に切り出すと整理しやすい
- **時間依存遷移**: 「予約日時を過ぎたら自動的に cancelled」等は別プロンプト（バッチ処理テスト）と組み合わせる

## 出典

- Notion ページ: `dc8774cd03c8490688b066c2b0179cac` — AI 駆動開発時代に押さえる QA 技法（参照日 2026-05-13）の「4. 状態遷移テスト」節
- 一次資料: ISTQB Foundation Level Syllabus
