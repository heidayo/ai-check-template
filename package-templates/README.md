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

v0.1.0 — Released（2026-05-14）。手動コピーで使う template set として配布。CLI scaffolding は v0.2.0 以降。

## テスト設計と修復

- [`docs/test-design-template.md`](./docs/test-design-template.md): Requirement / Acceptance Criteria / Test Matrix / Verification Commands を実装前に固定するテンプレート。
- [`prompts/diagnostic-repair.md`](./prompts/diagnostic-repair.md): `ai:check` や CI の失敗後、redacted diagnostic output から修復計画・patch・再検証へ進めるプロンプト。
