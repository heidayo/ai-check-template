# package-templates/

このディレクトリは `ai-check-template` パッケージが **配布** する内容を格納する。

> **重要**: SAGE がインストールする `templates/` （hooks/sage/settings 等の SAGE 内部物）とは別物。
> 配布物は **必ずこのディレクトリ** （`package-templates/`）に置く。命名衝突を避けるため。

## 想定する構造（Phase 2 で具体化）

```
package-templates/
├── docs/
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
│   └── plan-first.md
├── profiles/
│   ├── react-nextjs/
│   ├── react-vanilla/
│   ├── expo-rn/
│   ├── node-cli/
│   └── supabase-rls/
└── package.scripts.fragment.json
```

## ステータス

Phase 0 — 骨格設計中。実体ファイルは Phase 1 dogfooding と並行で埋めていく。
