# prompts/

AI 駆動開発で利用する**プロンプト雛形ライブラリ**。`docs/philosophy/` の思想を AI（Claude Code / Codex 等）に渡す具体的なテキストとして実体化したもの。

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 提供物

| ファイル | 目的 | カテゴリ | philosophy 対応 |
|---|---|---|---|
| [`plan-first.md`](./plan-first.md) | 実装前に AI に Plan（成功基準・検証コマンド・リスク）を書かせる | プロセス | formal-name-match §Phase A |
| [`decision-table.md`](./decision-table.md) | 複数条件の組み合わせ漏れを防ぐデシジョンテーブル生成 | QA 技法 | qa-techniques §3 |
| [`state-transition.md`](./state-transition.md) | 状態遷移の許可・禁止両方をテスト | QA 技法 | qa-techniques §4 |
| [`boundary-value.md`](./boundary-value.md) | 同値分割 + 境界値で入力空間網羅 | QA 技法 | qa-techniques §1, §2 |
| [`rls-permission.md`](./rls-permission.md) | RLS / 権限境界の機械検証 | QA 技法 + DB-RLS 層 | test-pyramid §5 |
| [`diagnostic-repair.md`](./diagnostic-repair.md) | `ai:check` / CI 失敗後に diagnostic output から修復計画・patch・再検証へ進める | 修復 | formal-name-match §Repair / Re-check |

## 使い方

### 1. プロンプト本文をコピー

各ファイルの「## プロンプト本文」コードブロックをコピーする。

### 2. プレースホルダーを自プロジェクトの仕様で置換

プロンプト本文には「（例: ...）」「（ここに仕様を貼り付け）」等のプレースホルダーがある。自プロジェクトの仕様で置換する。

### 3. AI に投げる

Claude Code / Codex / Cursor 等に貼り付けて実行。実装前段階（observation 設計）にも使えるし、テストコード生成段階にも使える。

## 推奨利用フロー

```
1. plan-first.md で「何を作るか」「成功基準」を AI に書かせる
   ↓
2. Plan の「成功基準」を見て、観点が足りなければ以下を補強:
   - 条件組み合わせ → decision-table.md
   - 状態遷移 → state-transition.md
   - 入力バリデーション → boundary-value.md
   - 権限制御 → rls-permission.md
   ↓
3. 補強した成功基準を SPEC / Plan に登録
   ↓
4. ../docs/test-design-template.md で AC と Test Matrix を固定
   ↓
5. 実装
   ↓
6. 形名参同（formal-name-match）で「名」（成功基準）と「形」（実測）を照合
   ↓
7. 失敗時は diagnostic-repair.md に redacted diagnostic output を渡して修復し、同じ command を再実行
```

## 思想

これらのプロンプトは、AI に「テストを書いて」と曖昧に依頼する代わりに、**観点の網羅性を担保する道具**として設計されている。

- AI は明示しない限り正常系中心の薄いテストを書きがち
- 同値分割 / 境界値 / デシジョンテーブル / 状態遷移 / 権限境界の各観点は、人間が QA 技法として明示する必要がある
- プロンプト雛形は、観点設計の属人化を防ぐ「チームの共通言語」

詳細は [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) と [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) を参照。

## カスタマイズ

### 業務ドメイン特化

プロンプト本文を自プロジェクトのドメイン例で置換すると、AI 出力の質が上がる。
例:
- `boundary-value.md` の「パスワードは 8 文字以上...」を、自プロジェクトの「商品名は 1〜100 文字...」に置換

### プロンプトの組み合わせ

複雑な機能では複数プロンプトを順次使う。
例（決済機能）:
1. `plan-first.md` で全体設計
2. `boundary-value.md` で金額バリデーション
3. `state-transition.md` で決済ステータス遷移
4. `decision-table.md` で割引条件組み合わせ
5. `rls-permission.md` で組織別の権限
6. `diagnostic-repair.md` で `ai:check` 失敗後の修復

## 隣接する思想

- [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) — 6 つの QA 技法の理論
- [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) — 「名」と「形」の照合（プロンプトの上位概念）
- [`../docs/philosophy/given-when-then.md`](../docs/philosophy/given-when-then.md) — プロンプト出力を GWT で記述する
- [`../docs/philosophy/test-pyramid.md`](../docs/philosophy/test-pyramid.md) — 各プロンプトを Unit / Integration / E2E / DB-RLS のどの層に使うか

## 出典

- Notion ページ: `dc8774cd03c8490688b066c2b0179cac` — AI 駆動開発時代に押さえる QA 技法（参照日 2026-05-13）
- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー
- Notion ページ: `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計
