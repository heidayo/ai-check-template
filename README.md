# ai-check-template

AI 駆動開発のための **テストフローテンプレート** と **テスト設計思想** を npm パッケージとして配布する（WIP）。

> **ステータス**: Phase 0（思想 + テンプレ骨格を設計中）。CLI / npm 公開は Phase 2 以降。

## ゴール

AI 駆動開発において「実装速度に対して検証・品質担保が追いつかない」課題を解決するための、汎用テンプレート集を提供する。

特定プロジェクト（gakuten 等）固有のフローを設計するのではなく、**AI 開発全般で再利用可能な思想とテンプレート** を整備する。

## 提供するもの（予定）

### 1. テスト設計思想
- **形名参同**: 事前宣言した成功基準（名）と実測値（形）の照合
- **Test Pyramid**: Static / Unit / Integration / E2E / DB-RLS / Monitoring の責務分割
- **Given-When-Then**: 受け入れ条件を AI に先に書かせる運用
- **QA 技法**: 同値分割・境界値・デシジョンテーブル・状態遷移・エラー推測・チェックリスト

### 2. テストフローテンプレート
- `ai:check` / `ai:check:fast` 統合 npm script
- Claude Code hook 設定（Edit=fast / Stop=full のハイブリッド）
- Playwright Locator 優先順位ルール（`getByRole > getByLabel > getByText > getByTestId > locator`）
- AI プロンプト雛形（テスト観点設計、デシジョンテーブル生成、状態遷移検証）
- CI 統合例（`ci-examples/github-actions/ai-check.yml` / `ai-check-fast.yml`、GitLab CI 等は将来追加）

### 3. プロファイル
| プロファイル | 対象 |
|---|---|
| `react-nextjs` | Next.js App Router |
| `react-vanilla` | 純 React |
| `expo-rn` | Expo / React Native（React Doctor 非対応、別構成） |
| `node-cli` | Node.js CLI |
| `supabase-rls` | Supabase + RLS 観点（pgTAP、InBucket Magic Link E2E） |

### 4. 連携
- **SAGE Development System** と横並びコンパニオン（SAGE 非依存でも動作、SAGE 検出時は specs テンプレに追記）

## 使い方（予定）

```bash
npx ai-check-template@latest init --profile react-nextjs+supabase-rls
```

## 開発手法

このリポジトリ自身も AI 駆動開発で構築している。SAGE Development System で SPEC → PLAN → TASK の規律下で開発する。詳細は [CLAUDE.md](./CLAUDE.md)。

> SAGE がインストールしたファイル（`.sage/`, `sage/`, `scripts/sage-*.sh`, `specs/_template.md` 等）は local-only として `.gitignore` 済み。Contributor は別途 [heidayo/sage-ai-template](https://github.com/heidayo/sage-ai-template) の install.sh をローカル実行する。

## 段階

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | 思想 + テンプレ骨格設計 | 進行中 |
| 1 | dogfooding（gakuten 等で手動運用） | 未着手 |
| 2 | CLI / npm パッケージ化 | 未着手 |
| 3 | 複数プロジェクト横展開 | 未着手 |

## 参考資料

設計の根拠となる文書（Notion、社内）:
- テストフロー再設計（責務分割・Given-When-Then・テスト設計テンプレ）
- 無料で作る AI エージェント開発診断フロー（`ai:check` 構成・形名参同・判定基準）
- AI 駆動開発時代に押さえる QA 技法（観点設計の理論）
- Supabase Testing 戦略（pgTAP・RLS・InBucket）

## ライセンス

Apache-2.0（[LICENSE](./LICENSE)）
