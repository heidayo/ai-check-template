# ai-check-template

**AI-generated code should not be trusted by default.**

`ai-check-template` provides reusable templates for **verifying, repairing, and safely merging AI-generated code**. It helps teams move from:

> "AI implemented it."

to:

> "AI implemented it, checks passed, risks are visible, and humans can accept it with evidence."

> 日本語版 / Japanese: [`README-ja.md`](./README-ja.md)

---

## What is this?

A template collection for AI-driven development. It bundles:

- A **testing philosophy** built for AI-written code (Test Pyramid, Given-When-Then, QA techniques, Formal Name Match)
- **AI prompt templates** that force the model to declare success criteria before implementing
- An **`ai:check` execution stack** (npm scripts, Claude Code hooks, shell entry points)
- **GitHub Actions templates and hosted workflow foundation** that run the same `ai:check` on every PR
- **Reviewability templates** for PR evidence, design explanation, tradeoff analysis, and human understanding checks
- **Profiles** for common stacks (Next.js, vanilla React, Expo, Node CLI, Supabase + RLS)
- A stable npm **CLI** for safer initialization

You copy what you need, adapt to your project, and get a verifiable loop — without depending on any specific LLM, framework, or vendor.

## Why?

AI coding tools (Claude Code, Codex, Cursor) make implementation fast. They do not make verification fast.

In practice, AI-generated code often:

- Passes a quick eyeball check, then fails type / lint / E2E
- Looks correct, but ignores authorization, RLS, or rate limiting
- Leaves dead code, unused exports, or accidental scope drift
- Self-reports "Done" when reality is "Partially done"

`ai-check-template` is built around the principle of **Formal Name Match** (形名参同): declare the success criteria **before** implementation, then mechanically compare against the actual evidence after. AI cannot self-grade.

## Core loop

```
Requirement
   ↓
Acceptance Criteria (Given-When-Then)
   ↓
Test Design (QA techniques: equivalence partitioning, boundary value, decision table, state transition, RLS permission)
   ↓
AI Implementation
   ↓
Quality Check (typecheck → lint → unit → diagnostics → E2E smoke)
   ↓
Repair (AI auto-fix in the same session)
   ↓
Re-check
   ↓
Human Acceptance (with evidence)
```

The repository ships templates and prompts for every step in this loop.

## What you get

| Layer | Contents |
|---|---|
| **Philosophy** | [`formal-name-match.md`](./package-templates/docs/philosophy/formal-name-match.md), [`test-pyramid.md`](./package-templates/docs/philosophy/test-pyramid.md), [`given-when-then.md`](./package-templates/docs/philosophy/given-when-then.md), [`qa-techniques.md`](./package-templates/docs/philosophy/qa-techniques.md) |
| **Test design** | [`test-design-template.md`](./package-templates/docs/test-design-template.md) maps requirements to acceptance criteria, test matrix rows, and verification commands |
| **Prompts** | `decision-table` / `state-transition` / `boundary-value` / `rls-permission` / `plan-first` / [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) |
| **Reviewability** | [PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md), [AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md), and prompts for [design explanation](./package-templates/prompts/design-explanation.md), [tradeoff analysis](./package-templates/prompts/tradeoff-analysis.md), [self-understanding checks](./package-templates/prompts/self-understanding-check.md), and [review training](./package-templates/prompts/review-training.md) |
| **Execution stack** | `scripts/ai-check.sh`, `scripts/ai-check-fast.sh`, `.claude/settings.hook-fragment.json`, `.claude/rules/test-rules.md`, `package.scripts.fragment.json` |
| **CI integration** | GitHub Actions `ai-check.yml` (full), `ai-check-fast.yml` (PR-only fast loop), reusable workflow examples, and the hosted workflow / Composite Action guide in [`docs/github-actions.md`](./docs/github-actions.md) |
| **Examples** | [`examples/nextjs-basic`](./examples/nextjs-basic/) shows a Before / After of AI-generated code under `ai-check-template` |
| **Profiles** | `react-nextjs`, `react-vanilla`, `expo-rn`, `node-cli`, `supabase-rls` |
| **CLI** | [`docs/cli.md`](./docs/cli.md) documents the `ai-check-template@0.2.0` CLI, `init`, read-only `doctor`, and guarded `update` commands, install state (`.ai-check-template.json`), profile-aware package script migrations, profile docs migration, support script defaults, package manager detection plus Claude hook and CI workflow command rendering for `pnpm` / `npm` / `yarn` / `bun`, optional `--install-deps` npm dev dependency install, exact-managed workflow cleanup, advisory profile and missing-script diagnostics warnings, stale managed CI diagnostics, `doctor --strict`, `--profile`, `--package-manager`, `--ci`, `--claude-hooks`, `--dry-run`, and `--overwrite` |
| **Project docs** | [`docs/usage-model.md`](./docs/usage-model.md), [`docs/vision.md`](./docs/vision.md), [`docs/roadmap.md`](./docs/roadmap.md), Phase 1 dogfooding protocol, [`initial dogfooding report`](./docs/phase-1-initial-dogfooding-report.md) |

## Where This Fits

`ai-check-template` is a post-implementation verification stack. It does not make AI write code; it helps teams verify, repair, and safely accept AI-generated code after implementation.

Use it through five loops: **Local loop** for fast checks after AI edits, **Repair loop** for diagnostic-driven fixes, **E2E loop** for critical Playwright journeys, **CI gate** for shared pull-request enforcement, and **Review gate** for human acceptance with design, risks, tests, and understanding evidence. The Review gate has manual-copy templates under [`package-templates/.github/`](./package-templates/.github/) and [`package-templates/worksheet/`](./package-templates/worksheet/). See [`docs/usage-model.md`](./docs/usage-model.md).

## Quick start

> v0.1.0 is released as "copy & adapt." See [`docs/releases/v0.1.0.md`](./docs/releases/v0.1.0.md). v0.2.0 is released as the stable CLI package `ai-check-template@0.2.0`; see [`docs/releases/v0.2.0.md`](./docs/releases/v0.2.0.md), the alpha history in [`docs/releases/v0.2.0-alpha.0.md`](./docs/releases/v0.2.0-alpha.0.md), and [`docs/cli.md`](./docs/cli.md). v0.3.0 is released as the GitHub Actions integration foundation; see [`docs/releases/v0.3.0.md`](./docs/releases/v0.3.0.md) and [`docs/github-actions.md`](./docs/github-actions.md). Repository validation still uses `npm pack` readiness checks and `npm publish --dry-run --tag latest` preflight before future publishes.

```bash
# 1. Clone or browse the templates
git clone https://github.com/heidayo/ai-check-template.git

# 2. Preview the stable CLI init from npm
npx -y ai-check-template init --target . --profile react-nextjs --dry-run
npx -y ai-check-template init --target . --profile node-cli --package-manager npm --ci none --dry-run
npx -y ai-check-template doctor --target . --ci none
npx -y ai-check-template update --target . --dry-run

# 3. Pick a profile that matches your stack
cat ai-check-template/package-templates/profiles/react-nextjs/README.md

# 4. Copy what you need into your project
cp -r ai-check-template/package-templates/scripts ./scripts
cp -r ai-check-template/package-templates/.claude ./.claude
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check.yml .github/workflows/
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check-fast.yml .github/workflows/
# Optional manual-copy Review gate templates:
cp ai-check-template/package-templates/.github/PULL_REQUEST_TEMPLATE.md .github/
cp -r ai-check-template/package-templates/worksheet ./worksheet
# Or copy ai-quality-reusable.yml + ai-quality-call.yml if you prefer reusable workflows.
# For the hosted reusable workflow and Composite Action, see docs/github-actions.md.

# 5. Merge the scripts fragment into your package.json
cat ai-check-template/package-templates/package.scripts.fragment.json
# Then add the "ai:check" and "ai:check:fast" entries to your package.json "scripts"

# 6. Run the loop
pnpm ai:check
```

To inspect a runnable Before / After example, see [`examples/nextjs-basic`](./examples/nextjs-basic/). To prepare your own task before implementation, start from [`test-design-template.md`](./package-templates/docs/test-design-template.md), then use [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) when `ai:check` or CI returns a failing diagnostic. Before human acceptance, use the [reviewability PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md) and [AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md).

Detailed walkthrough: see [`docs/roadmap.md`](./docs/roadmap.md) and the per-profile README under [`package-templates/profiles/`](./package-templates/profiles/).

## Supported profiles

| Profile | Target stack | Notes |
|---|---|---|
| [`react-nextjs`](./package-templates/profiles/react-nextjs/) | Next.js App Router + TypeScript | Full toolchain (RD / Knip / Playwright / Semgrep) |
| [`react-vanilla`](./package-templates/profiles/react-vanilla/) | Plain React + TypeScript (Vite / CRA) | Next.js-specific RD checks skipped |
| [`expo-rn`](./package-templates/profiles/expo-rn/) | Expo / React Native | React Doctor not supported; use Maestro / Detox for E2E |
| [`node-cli`](./package-templates/profiles/node-cli/) | Node CLI / library | No UI / E2E; Static + Unit focus |
| [`supabase-rls`](./package-templates/profiles/supabase-rls/) | Supabase + RLS (addon) | Combine with any of the above (e.g. `react-nextjs+supabase-rls`) |

## Roadmap

| Version | Theme | Status |
|---|---|---|
| **v0.1.0** | Manual templates for AI code verification | Released ([notes](./docs/releases/v0.1.0.md)) |
| **v0.2.0** | CLI scaffolding (`npx ai-check-template init`) | Released ([notes](./docs/releases/v0.2.0.md), [alpha notes](./docs/releases/v0.2.0-alpha.0.md), [CLI docs](./docs/cli.md)) |
| **v0.3.0** | Hosted reusable workflow + Composite Action ([GitHub Actions guide](./docs/github-actions.md)); GitHub Marketplace later | Released ([notes](./docs/releases/v0.3.0.md)) |

Full breakdown: [`docs/roadmap.md`](./docs/roadmap.md).

## Contributing

We welcome contributions. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the PR flow and lane selection, [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) for community standards, and [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.

Issue and PR templates live under [`.github/`](./.github/).

## License

[Apache-2.0](./LICENSE)

---

> This repository is itself developed under the [SAGE Development System](https://github.com/heidayo/sage-ai-template) (Spec → Plan → Task → Execute → Verify). Contributors do not need SAGE installed to use the templates; SAGE coexistence is opt-in. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for details.
