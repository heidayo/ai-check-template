# Test Rules

このファイルはテスト記述ルールを Claude Code / Codex 等の実装エージェントに伝える。
配布される example。利用者が自プロジェクトの `.claude/rules/` にコピーして使う。

## Playwright Locator 優先順位

E2E テストを書く際、locator の選択は以下の優先順位に従う。下位の選択肢を使う場合は理由をコメントで明示すること。

| 順位 | Locator | 用途 | 例 |
|---|---|---|---|
| 1 | `getByRole` | accessibility tree ベース。最も robust | `page.getByRole('button', { name: 'Submit' })` |
| 2 | `getByLabel` | フォーム入力要素 | `page.getByLabel('Email address')` |
| 3 | `getByText` | テキスト内容で識別 | `page.getByText('Welcome back')` |
| 4 | `getByTestId` | `data-testid` 属性ベース | `page.getByTestId('user-menu')` |
| 5 | `locator(css)` | 最後の手段。DOM 構造依存で壊れやすい | `page.locator('.user-menu > .avatar')` |

### なぜこの順位か

- `getByRole` / `getByLabel`: a11y を兼ねるため、テストが a11y 違反を検出する副作用がある
- `getByText`: i18n の場合は脆い。多言語プロジェクトでは `getByRole` を優先
- `getByTestId`: 実装詳細に依存するが、変わりにくい識別子なら許容
- `locator(css)`: 上記が使えない場合のみ。Refactor で容易に壊れる

### AI への指示例

```
Playwright テストを書いてください。Locator は以下の優先順位で選択し、4 番以下を使う場合は理由をコメントしてください:
1. getByRole
2. getByLabel
3. getByText
4. getByTestId
5. locator(css)（最後の手段）
```

## 関連思想

- [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) — E2E 層の責務分割
- [`../../docs/philosophy/given-when-then.md`](../../docs/philosophy/given-when-then.md) — GWT で E2E シナリオを書く

## 出典

- Playwright 公式 Best Practices（参照日 2026-05-13）
- Notion Doc #1（`35b68c677f4380bfa1ffeab248264e92`）
