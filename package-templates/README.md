# package-templates/

このディレクトリは `ai-check-template` パッケージが **配布** する内容を格納する。

> **重要**: SAGE がインストールする `templates/` （hooks/sage/settings 等の SAGE 内部物）とは別物。
> 配布物は **必ずこのディレクトリ** （`package-templates/`）に置く。命名衝突を避けるため。

## 想定する構造（Phase 2 で具体化）

```
package-templates/
├── docs/
│   ├── test-design-template.md
│   └── philosophy/
│       ├── formal-name-match.md
│       ├── test-pyramid.md
│       ├── given-when-then.md
│       └── qa-techniques.md
├── scripts/
│   ├── ai-check.sh
│   └── ai-check-fast.sh
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
│   └── plan-first.md
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

Phase 0 — 完了（SPEC-0001..SPEC-0005 で全 7 サブ成果物の骨格を整備）。Phase 1 dogfooding で実プロジェクト検証を行い、フィードバックを SPEC 改訂に反映する予定。

## テスト設計と修復

- [`docs/test-design-template.md`](./docs/test-design-template.md): Requirement / Acceptance Criteria / Test Matrix / Verification Commands を実装前に固定するテンプレート。
- [`prompts/diagnostic-repair.md`](./prompts/diagnostic-repair.md): `ai:check` や CI の失敗後、redacted diagnostic output から修復計画・patch・再検証へ進めるプロンプト。
