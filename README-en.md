# ai-check-template

**AI-generated code should not be trusted by default.**

`ai-check-template` provides reusable templates for **verifying, repairing, and safely merging AI-generated code**. It helps teams move from:

In one sentence: it is a **quality-assurance template stack for after AI coding**. Users do not need SAGE installed; the templates can be added to an existing project through the CLI or by manual copy.

> "AI implemented it."

to:

> "AI implemented it, checks passed, risks are visible, and humans can accept it with evidence."

> 日本語版 / Japanese: [`README.md`](./README.md)

---

## What is this?

A template collection for AI-driven development. It bundles:

- A **testing philosophy** built for AI-written code (Test Pyramid, Given-When-Then, QA techniques, Formal Name Match)
- **AI prompt templates** that force the model to declare success criteria before implementing
- An **`ai:check` execution stack** (npm scripts, Claude Code hooks, shell entry points)
- Structured **PASS / FAIL / SKIPPED + timing + redacted output** evidence through `ai-check-template run`
- Structured AC / Test Matrix JSON / YAML templates for machine-readable test design
- A separate **`ai:check:secure` security gate** for secret scanning, dependency audit, supply-chain checks, and Semgrep SAST
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
| **Test design** | [`test-design-template.md`](./package-templates/docs/test-design-template.md) maps requirements to acceptance criteria, test matrix rows, and verification commands. [`ac-test-matrix.schema.json`](./package-templates/docs/ac-test-matrix.schema.json), JSON / YAML examples, and `ai-check-template expect` make the same contract machine-readable |
| **Prompts** | `decision-table` / `state-transition` / `boundary-value` / `rls-permission` / `plan-first` / [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) |
| **Reviewability** | [PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md), [AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md), and prompts for [design explanation](./package-templates/prompts/design-explanation.md), [tradeoff analysis](./package-templates/prompts/tradeoff-analysis.md), [self-understanding checks](./package-templates/prompts/self-understanding-check.md), and [review training](./package-templates/prompts/review-training.md) |
| **Execution stack** | `scripts/ai-check.sh`, `scripts/ai-check-fast.sh`, `scripts/ai-check-secure.sh`, `.claude/settings.hook-fragment.json`, `.claude/rules/test-rules.md`, `package.scripts.fragment.json` |
| **CI integration** | GitHub Actions `ai-check.yml` (full), `ai-check-fast.yml` (PR-only fast loop), reusable workflow examples, and the hosted workflow / Composite Action guide in [`docs/github-actions.md`](./docs/github-actions.md) |
| **Examples** | [`examples/nextjs-basic`](./examples/nextjs-basic/) shows a Before / After of AI-generated code under `ai-check-template` |
| **Profiles** | `react-nextjs`, `react-vanilla`, `expo-rn`, `node-cli`, `supabase-rls` |
| **CLI** | [`docs/cli.md`](./docs/cli.md) documents the `ai-check-template` CLI, `init`, read-only `doctor`, guarded `update`, repository-current structured `run`, and `expect` validation commands, install state (`.ai-check-template.json`), profile-aware package script migrations, profile docs migration, support script defaults, package manager detection, Claude hook / review template / CI workflow command rendering, optional `--install-deps`, exact-managed workflow cleanup, diagnostics warnings, `doctor --strict`, `--dry-run`, and `--overwrite` |
| **Project docs** | [`docs/usage-model.md`](./docs/usage-model.md), [`docs/vision.md`](./docs/vision.md), [`docs/roadmap.md`](./docs/roadmap.md), Phase 1 dogfooding protocol, [`initial dogfooding report`](./docs/phase-1-initial-dogfooding-report.md) |

## Where This Fits

`ai-check-template` is a post-implementation verification stack. It does not make AI write code; it helps teams verify, repair, and safely accept AI-generated code after implementation.

Use it through five loops: **Local loop** for fast checks after AI edits, **Repair loop** for diagnostic-driven fixes, **E2E loop** for critical Playwright journeys, **CI gate** for shared pull-request enforcement, and **Review gate** for human acceptance with design, risks, tests, and understanding evidence. The Review gate can be installed with CLI `--review-templates` or copied manually from [`package-templates/.github/`](./package-templates/.github/) and [`package-templates/worksheet/`](./package-templates/worksheet/). First-time readers should start with the one-page flow in [`docs/usage-model.md`](./docs/usage-model.md) and the prompt flow in [`package-templates/prompts/README.md`](./package-templates/prompts/README.md).

Security checks are intentionally split: keep `ai:check` for functional quality, and run `ai:check:secure` for secret scan, dependency audit, supply-chain, and Semgrep SAST evidence.

## Quick start

Start with a dry-run from the root of an existing project. It does not write files.

```bash
npx -y ai-check-template init --target . --profile react-nextjs --dry-run
```

If the preview looks right, apply it with `--yes`, then run `doctor`.

```bash
npx -y ai-check-template init --target . --profile react-nextjs --yes
npx -y ai-check-template doctor --target .
npx -y ai-check-template update --target . --dry-run
```

`update` resolves each managed file 3-way against the baseline hash recorded at install time, the local content, and the latest template. Only unmodified files are updated; locally modified files are kept by default (`skip-modified`). Inspect differences with `--diff`, or overwrite with `--force-managed`, which writes a `<file>.bak-<version>` backup first (add `*.bak-*` to `.gitignore`). To roll back, move the `.bak-<version>` file back to its original path. If you need the previous always-overwrite behavior, pin the previous release, e.g. `npx -y ai-check-template@0.4.0`. See [`docs/cli.md`](./docs/cli.md) for details.

### Local overlay — put customizations here, not in managed files

Editing managed files (`scripts/ai-check*.sh`, `.claude/rules/test-rules.md`, ...) directly turns them into `skip-modified` and drops them out of automatic update tracking. Put project-specific customization into the **overlay** instead — the installer (init / update / doctor) never touches it (overlay = first-choice mechanism, skip-modified = the safety net for direct edits):

- `scripts/ai-check.local.sh`: when present, all three distributed scripts source it from their own directory before delegating to the package manager (without it, behavior is unchanged). No execute permission is needed, and failures such as syntax errors propagate as a non-zero exit

  ```bash
  # scripts/ai-check.local.sh — committed by you, never distributed
  PM=npm                                       # override the package manager
  echo "[local] project-specific pre-check"    # extra checks
  ```

- `.claude/rules/local/`: home for project-specific rules. `init --claude-hooks` seeds a guidance README once; after that the directory is entirely yours

Note: `ai-check.local.sh` runs exactly as committed (arbitrary code execution). Never hardcode secrets / tokens / API keys — pass them via environment variables or a secret manager.

Migrating existing direct edits: inspect with `update --diff`, move the custom parts into `ai-check.local.sh`, then restore managed scripts with `update --yes --force-managed` (a `.bak-<version>` backup is written first, so you can roll back). See the "Local overlay" section in [`docs/cli.md`](./docs/cli.md).

Then run the target project's checks.

```bash
pnpm ai:check
pnpm ai:check:secure
npx -y ai-check-template run --target . --script ai:check --json
npx -y ai-check-template expect --file docs/ai-check-template/docs/ac-test-matrix.example.json --json
npx -y ai-check-template report --expect docs/ac-test-matrix.json --run .ai-check/run-result.json --strict
```

`report` machine-matches declared acceptance criteria (the same AC/Test Matrix file `expect` validates) against the measured JSON from `run --output`, producing PASS / FAIL / UNVERIFIED per AC. Matching uses explicit keys only: the optional AC `step` field must exactly equal a run step `name`; without `step`, the AC `command` must equal exactly one step `command` after trimming (multiple matches yield `ambiguous-command` and UNVERIFIED — add `step` to disambiguate). A `step` typo also becomes UNVERIFIED, so wiring `--strict` (exit 1 when any AC is FAIL / UNVERIFIED) into CI catches typos too. The `--format markdown` table can be pasted directly into the PR body Verification section. See "Report options" in [`docs/cli.md`](./docs/cli.md).

`run`, `expect`, and `report` are repository-current CLI additions. Before the next npm publish, use this repository checkout or an `npm pack` tarball to try them.

The steps `run` executes per gate (fast / full / secure) can be declaratively replaced or disabled by placing `.ai-check.yaml` (or `.ai-check.json`) at the project root — opt-in, user-owned, and never touched by the installer. Without the file, behavior is unchanged; deleting it fully restores the default behavior. Each step in `--json` output records its origin via `name` / `source` (`config` / `default`) plus a root-level `configPath`. Config `command` values run exactly as committed, so never hardcode secrets / tokens / API keys — pass them via environment variables or a secret manager. See the "Step config" section in [`docs/cli.md`](./docs/cli.md) for the schema and a complete example.

For non-Next.js projects, switch the profile to `node-cli`, `react-vanilla`, `expo-rn`, or `react-nextjs+supabase-rls`. See [`docs/cli.md`](./docs/cli.md) for options and [`docs/usage-model.md`](./docs/usage-model.md) for the operating model.

## Other install paths

Preview another profile:

```bash
npx -y ai-check-template init --target . --profile node-cli --package-manager npm --ci none --dry-run
npx -y ai-check-template doctor --target . --ci none
npx -y ai-check-template update --target . --dry-run
```

Manual copy:

```bash
git clone https://github.com/heidayo/ai-check-template.git
cat ai-check-template/package-templates/profiles/react-nextjs/README.md
cp -r ai-check-template/package-templates/scripts ./scripts
cp -r ai-check-template/package-templates/.claude ./.claude
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check.yml .github/workflows/
cp ai-check-template/package-templates/ci-examples/github-actions/ai-check-fast.yml .github/workflows/
cp ai-check-template/package-templates/.github/PULL_REQUEST_TEMPLATE.md .github/
cp -r ai-check-template/package-templates/worksheet ./worksheet
cat ai-check-template/package-templates/package.scripts.fragment.json
```

The Review gate can be installed with `--review-templates`, or copied manually through the [reviewability PR template](./package-templates/.github/PULL_REQUEST_TEMPLATE.md) and [AI code understanding worksheet](./package-templates/worksheet/ai-code-understanding.md). For the hosted reusable workflow and Composite Action, see [`docs/github-actions.md`](./docs/github-actions.md).

To inspect a runnable Before / After example, see [`examples/nextjs-basic`](./examples/nextjs-basic/). To prepare your own task before implementation, start from [`test-design-template.md`](./package-templates/docs/test-design-template.md), then use [`diagnostic-repair.md`](./package-templates/prompts/diagnostic-repair.md) when `ai:check` or CI returns a failing diagnostic.

Detailed walkthrough: see [`docs/roadmap.md`](./docs/roadmap.md) and the per-profile README under [`package-templates/profiles/`](./package-templates/profiles/).

## Supported profiles

| Profile | Target stack | Notes |
|---|---|---|
| [`react-nextjs`](./package-templates/profiles/react-nextjs/) | Next.js App Router + TypeScript | Full toolchain (RD / Knip / Playwright / Semgrep) |
| [`react-vanilla`](./package-templates/profiles/react-vanilla/) | Plain React + TypeScript (Vite / CRA) | Next.js-specific RD checks skipped |
| [`expo-rn`](./package-templates/profiles/expo-rn/) | Expo / React Native | React Doctor supported for RN diagnostics; use Maestro / Detox for E2E |
| [`node-cli`](./package-templates/profiles/node-cli/) | Node CLI / library | No UI / E2E; Static + Unit focus |
| [`supabase-rls`](./package-templates/profiles/supabase-rls/) | Supabase + RLS (addon) | Combine with any of the above (e.g. `react-nextjs+supabase-rls`) |

## Roadmap

Release wording: v0.1.0 is the manual-template release, v0.2.0 is the first stable npm CLI package, v0.3.0 is the GitHub Actions integration foundation release, and v0.4.0 is the structured CLI evidence + security gate expansion release. v0.5.0 is the current published stable npm CLI package `ai-check-template@0.5.0` (dist-tag `latest`). Repository validation still uses `npm pack` readiness checks and `npm publish --dry-run --tag latest` preflight before future publishes.

| Version | Theme | Status |
|---|---|---|
| **v0.1.0** | Manual templates for AI code verification | Released ([notes](./docs/releases/v0.1.0.md)) |
| **v0.2.0** | CLI scaffolding (`npx ai-check-template init`) | Released ([notes](./docs/releases/v0.2.0.md), [alpha notes](./docs/releases/v0.2.0-alpha.0.md), [CLI docs](./docs/cli.md)) |
| **v0.3.0** | Hosted reusable workflow + Composite Action ([GitHub Actions guide](./docs/github-actions.md)); GitHub Marketplace later | Released ([notes](./docs/releases/v0.3.0.md)) |
| **v0.4.0** | Structured CLI evidence (`run` / `expect`) + security gate expansion | Released ([notes](./docs/releases/v0.4.0.md)) |
| **v0.5.0** | Update-safe customization (3-way / overlay), external check config, formal-name-match reporting, profile composition / monorepo / custom profiles, CI monorepo / SARIF, RLS parameterization, authz Semgrep | Released ([notes](./docs/releases/v0.5.0.md)) |

Full breakdown: [`docs/roadmap.md`](./docs/roadmap.md).

## Contributing

We welcome contributions. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the PR flow and lane selection, [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) for community standards, and [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.

Issue and PR templates live under [`.github/`](./.github/).

## License

[Apache-2.0](./LICENSE)

---

> This repository is itself developed under the [SAGE Development System](https://github.com/heidayo/sage-ai-template) (Spec → Plan → Task → Execute → Verify). Contributors do not need SAGE installed to use the templates; SAGE coexistence is opt-in. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for details.
