# plan-first プロンプト

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 目的

AI に実装させる**前**に、Plan（計画）を書かせる。成功基準・検証コマンド・想定リスクを実装前に固定することで、形名参同の「名」（事前宣言）を確立する。実装後に AI が「動きました」と曖昧に申告するのを防ぐ。

形名参同の Phase A（[`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) §段階的導入）を実装プロセスに組み込むためのプロンプト雛形。

## プロンプト本文

```
このタスクを実装する前に、まず Plan を出力してください。

## Plan に含めるべき項目

1. **変更対象ファイル**: 具体的なパス（推測の場合は「推測」と明記）
2. **実装方針**: アーキテクチャ・パターン・採用ライブラリ
3. **成功基準（受け入れ条件）**: 機械検証可能な形で 3 件以上
4. **実装後に実行する検証コマンド**: typecheck / lint / test / e2e 等の具体コマンド
5. **想定リスク**: 副作用・互換性・性能・セキュリティ
6. **影響範囲**: 直接変更しないが影響を受ける箇所
7. **未確認になりそうな項目**: テストで網羅できない部分（手動確認 / 後続タスク化）
8. **ロールバック手段**: 失敗時の戻し方

## 制約

- まだコードは変更しないでください
- 成功基準は実装後に変更しないでください（「動いたから OK」と後付け正当化しない）
- 検証コマンドは実行可能な形で記述（「ちゃんと動く」「適切に動く」等の曖昧表現禁止）

## 出力形式

### Plan

**変更対象ファイル**:
- src/foo/bar.ts (新規)
- src/foo/types.ts (更新)

**実装方針**:
- ...

**成功基準**:
- [ ] AC-01: `pnpm tsc --noEmit` でエラー 0
- [ ] AC-02: `pnpm test src/foo` で新規テスト全 pass
- [ ] AC-03: ...

**検証コマンド**:
\`\`\`bash
pnpm typecheck
pnpm lint
pnpm test
\`\`\`

**想定リスク**:
- ...

**影響範囲**:
- ...

**未確認項目**:
- ...

**ロールバック**:
- `git checkout HEAD -- src/foo/` で復元可能
```

## 利用例

### 入力タスク
> ユーザーログイン API（POST /auth/login）を実装してください。

### 期待される AI 出力（Plan）

```
**変更対象ファイル**:
- src/auth/login.ts (新規)
- src/auth/login.test.ts (新規)
- src/auth/types.ts (更新: LoginRequest, LoginResponse 型追加)

**実装方針**:
- bcrypt でパスワード照合
- 成功時 JWT を返す（HS256 / 15 分有効）
- 失敗時 401 と { error: "invalid_credentials" }

**成功基準**:
- [ ] AC-01: `pnpm typecheck` エラー 0
- [ ] AC-02: 正しい credential で POST /auth/login → 200 + token
- [ ] AC-03: 誤った password → 401
- [ ] AC-04: 存在しない email → 401（user enumeration 防止）
- [ ] AC-05: failed_attempts カウンタが +1 される

...
```

実装は Plan が承認されてから着手。

## 隣接する思想

- [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) §段階的導入 Phase A, §実装パターン §パターン 1: Plan-First プロンプト — 本プロンプトの理論
- [`../docs/philosophy/given-when-then.md`](../docs/philosophy/given-when-then.md) — 成功基準を GWT 構文で書く方法
- [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) — 成功基準の観点を充実させる技法

## 他プロンプトとの組み合わせ

Plan-first を最初に実行 → Plan で挙げた成功基準を以下のプロンプトで具体化:
- 入力バリデーション → [`./boundary-value.md`](./boundary-value.md)
- 条件分岐 → [`./decision-table.md`](./decision-table.md)
- ステータス遷移 → [`./state-transition.md`](./state-transition.md)
- 権限制御 → [`./rls-permission.md`](./rls-permission.md)

## カスタマイズ

- **大規模実装**: Plan が肥大化したら、機能を分割して別 Plan に分ける
- **既存コード変更**: 「変更対象ファイル」に既存パス + 変更概要を記載
- **段階的導入**: Phase 別に Plan を分けて、各 Phase の AC を独立に検証

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）の「### 実装前」節
- philosophy: `package-templates/docs/philosophy/formal-name-match.md` §実装パターン §パターン 1
