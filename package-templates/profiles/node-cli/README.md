# node-cli profile

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定。実体ファイルは Phase 2 で配布）

## 目的

UI を持たない Node.js CLI / Library / サーバー側コード向け profile。UI / E2E ツールを除外し、Static + Unit + Integration に焦点を絞った品質ループを構築する。

## 対象スタック

| カテゴリ | 想定 |
|---|---|
| Runtime | Node.js 22 LTS（20 でも動作） |
| Language | TypeScript |
| Build | tsc / esbuild / tsup / unbuild |
| CLI Framework | commander / oclif / yargs / 自前 |
| Package Manager | pnpm / npm / yarn / bun |
| UI | **なし** |
| E2E | **なし**（必要なら integration test で代替） |

## 推奨ツール

| ツール | 必須/推奨/任意 | 用途 | 備考 |
|---|---|---|---|
| TypeScript | 必須 | 型チェック | |
| ESLint / oxlint | 必須 | lint | |
| **React Doctor** | **非対応** | — | React なしのため |
| Knip | 必須 | 未使用検出 | Library は未使用 export の影響大、必須 |
| Vitest | 必須 | Unit / Integration | |
| **Playwright** | **不要** | — | UI なし |
| Semgrep | 推奨 | セキュリティ | 特に CLI 引数 / ファイル I/O 経路 |

## ai:check / ai:check:fast カスタマイズ案

```json
{
  "scripts": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": "semgrep scan --config auto"
  }
}
```

- E2E ステップは含まない
- `test`: integration を含む全テスト
- `test:unit`: Unit のみ（fast loop 用）
- `ai:check:secure`: CLI 引数、ファイル I/O、外部入力まわりを Semgrep で確認する security gate

## .claude / scripts カスタマイズ案

- `.claude/rules/test-rules.md`: Playwright Locator 優先順位は **不要**。代わりに **CLI 引数 / stdin / stdout の testing ルール**を記述してもよい（カスタマイズ）
- hook fragment / scripts はそのまま使える

## 注意事項

- **stdin / stdout**: CLI の入出力をテストする際、`spawn` / `execa` でサブプロセス化 + stdout を assert
- **環境変数**: `.env` 経由の設定は test で明示的に上書き
- **path traversal**: ファイル操作する CLI は path traversal 攻撃の検証必須（Semgrep でカバー）
- **exit code**: 「正常終了 = 0」「エラー = 非 0」を必ずテスト
- **publish 前の検査**: `npm pack` で配布物に余計なファイルが入らないか確認

## CLI 特有のテストパターン

```typescript
// CLI 統合テスト例（vitest + execa）
import { execa } from 'execa';

it('CLI exits 0 on valid input', async () => {
  const { stdout, exitCode } = await execa('node', ['./dist/cli.js', '--input', 'foo']);
  expect(exitCode).toBe(0);
  expect(stdout).toContain('expected output');
});

it('CLI exits non-zero on invalid input', async () => {
  await expect(execa('node', ['./dist/cli.js', '--invalid'])).rejects.toMatchObject({ exitCode: 1 });
});
```

## 隣接 profile

- [`../react-nextjs/README.md`](../react-nextjs/README.md) — フルスタック Web
- [`../react-vanilla/README.md`](../react-vanilla/README.md) — Web の SPA
- [`../supabase-rls/README.md`](../supabase-rls/README.md) — DB 統合がある場合に組み合わせ

## 隣接思想

- [`../../docs/philosophy/test-pyramid.md`](../../docs/philosophy/test-pyramid.md) — E2E 層なしで Static + Unit + Integration が中心
- [`../../docs/philosophy/formal-name-match.md`](../../docs/philosophy/formal-name-match.md) — 形名参同
- [`../../docs/philosophy/qa-techniques.md`](../../docs/philosophy/qa-techniques.md) — boundary-value, decision-table が特に有効
- [`../../docs/philosophy/given-when-then.md`](../../docs/philosophy/given-when-then.md) — GWT

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（参照日 2026-05-13）
