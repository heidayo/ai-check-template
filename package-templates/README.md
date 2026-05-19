# package-templates/

このディレクトリは `ai-check-template` パッケージが **配布** する内容を格納する。

> **重要**: SAGE がインストールする `templates/` （hooks/sage/settings 等の SAGE 内部物）とは別物。
> 配布物は **必ずこのディレクトリ** （`package-templates/`）に置く。命名衝突を避けるため。

## 想定する構造（Phase 2 で具体化）

```
package-templates/
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── test-design-template.md
│   ├── ac-test-matrix.schema.json
│   ├── ac-test-matrix.example.json
│   ├── ac-test-matrix.example.yaml
│   └── philosophy/
│       ├── formal-name-match.md
│       ├── test-pyramid.md
│       ├── given-when-then.md
│       └── qa-techniques.md
├── scripts/
│   ├── ai-check.sh
│   ├── ai-check-fast.sh
│   └── ai-check-secure.sh
├── .claude/
│   ├── rules/
│   │   └── test-rules.md
│   └── settings.hook-fragment.json
├── prompts/
│   ├── decision-table.md
│   ├── state-transition.md
│   ├── boundary-value.md
│   ├── rls-permission.md
│   ├── diagnostic-repair.md
│   ├── plan-first.md
│   ├── design-explanation.md
│   ├── tradeoff-analysis.md
│   ├── self-understanding-check.md
│   └── review-training.md
├── worksheet/
│   └── ai-code-understanding.md
├── ci-examples/
│   ├── README.md
│   └── github-actions/
│       ├── ai-check.yml
│       ├── ai-check-fast.yml
│       ├── ai-quality-reusable.yml
│       └── ai-quality-call.yml
├── profiles/
│   ├── react-nextjs/
│   ├── react-vanilla/
│   ├── expo-rn/
│   ├── node-cli/
│   └── supabase-rls/
└── package.scripts.fragment.json
```

## ステータス

- v0.1.0 — Released（2026-05-14）。手動コピーで使う template set として配布。
- v0.2.0 — Released（2026-05-16）。`npx ai-check-template init` でこの template set を導入できる stable CLI release。
- v0.4.0 — Released（2026-05-19）。`run` / `expect`、structured AC/Test Matrix、拡張 security gate を含む npm CLI release。

## テスト設計と修復

- [`docs/test-design-template.md`](./docs/test-design-template.md): Requirement / Acceptance Criteria / Test Matrix / Verification Commands を実装前に固定するテンプレート。
- [`docs/ac-test-matrix.schema.json`](./docs/ac-test-matrix.schema.json)、[`docs/ac-test-matrix.example.json`](./docs/ac-test-matrix.example.json)、[`docs/ac-test-matrix.example.yaml`](./docs/ac-test-matrix.example.yaml): AC / Test Matrix を機械可読な JSON / YAML として固定し、`ai-check-template expect --file ... --json` で検証するテンプレート。
- [`prompts/diagnostic-repair.md`](./prompts/diagnostic-repair.md): `ai:check` や CI の失敗後、redacted diagnostic output から修復計画・patch・再検証へ進めるプロンプト。
- [`scripts/ai-check-secure.sh`](./scripts/ai-check-secure.sh): `ai:check` と分離して `ai:check:secure`（secret scan / dependency audit / supply-chain check / `semgrep scan --config auto`）を実行する security gate entry point。

## Review gate

- [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md): AI-generated code review 用に、採用設計・代替案・リスク・追加テスト・実行コマンド・人間の理解度を PR 上で記録するテンプレート。
- [`worksheet/ai-code-understanding.md`](./worksheet/ai-code-understanding.md): AI が生成したコードを人間が説明・批評・再実装できるか確認するワークシート。
- [`prompts/design-explanation.md`](./prompts/design-explanation.md), [`prompts/tradeoff-analysis.md`](./prompts/tradeoff-analysis.md), [`prompts/self-understanding-check.md`](./prompts/self-understanding-check.md), [`prompts/review-training.md`](./prompts/review-training.md): Review gate 前に設計説明、トレードオフ、理解度、レビュー観点を AI に整理させるプロンプト。

CLI を使う場合は `--review-templates` を指定すると、PR template と worksheet を `init` / `update` / `doctor` の管理対象にできる。既存の配置や文面を細かく調整したい場合は、manual-copy templates としてコピーして使う。
