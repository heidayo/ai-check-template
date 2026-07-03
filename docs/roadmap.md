# Roadmap

Versioned milestones for `ai-check-template`. Each version aims to deliver enough value to be adopted on its own; later versions build on earlier ones rather than replacing them.

## Release wording

`Released` means a tagged project milestone is available. The release vehicle differs by version:

- v0.1.0: manual copy-and-adapt templates.
- v0.2.0: first stable npm CLI package, `ai-check-template@0.2.0`.
- v0.3.0: GitHub Actions integration foundation. This is not an npm package release.
- v0.4.0: stable npm CLI package, `ai-check-template@0.4.0`, for structured check evidence, structured AC/Test Matrix validation, and expanded security gates.
- v0.5.0: current stable npm CLI package, `ai-check-template@0.5.0`, for update customization safety (managed-file hash 3-way, local overlay), external check config, formal-name-match reporting, profile composition rules, monorepo workspaces, CI monorepo/SARIF opt-in, parameterized RLS templates, authz Semgrep examples, and custom profile definitions.

Future npm publishes still require repository validation, including `npm pack` readiness checks and `npm publish --dry-run --tag latest` preflight.

## v0.1.0 — Manual templates for AI code verification

**Status**: Released on 2026-05-14. Release notes: [`./releases/v0.1.0.md`](./releases/v0.1.0.md).

**Theme**: Copy & adapt. No CLI, no npm install. Ship the philosophy, prompts, scripts, hooks, CI templates, and profiles as plain files that a developer can drop into their project.

**Goal**: A reviewer can land on the GitHub repository, understand the philosophy in five minutes, and successfully copy templates into their own project within one hour.

**Deliverables**

- [x] Philosophy documents (4): Formal Name Match, Test Pyramid, Given-When-Then, QA techniques
- [x] AI prompt templates (6): decision-table, state-transition, boundary-value, rls-permission, plan-first, diagnostic-repair
- [x] `ai:check` execution stack: shell scripts, `package.scripts.fragment.json`, Claude Code hook fragment, Locator priority rule
- [x] GitHub Actions CI examples: `ai-check.yml` (full), `ai-check-fast.yml` (PR fast loop)
- [x] Profiles (5): `react-nextjs`, `react-vanilla`, `expo-rn`, `node-cli`, `supabase-rls`
- [x] Phase 1 dogfooding protocol and feedback template
- [x] **OSS positioning**: external-facing README, vision, roadmap, Issue / PR templates, CONTRIBUTING / Code of Conduct / SECURITY (SPEC-0009)
- [x] **GitHub Actions strengthening**: own repo CI, reusable workflow prototype, additional CI variants (SPEC-0010)
- [x] **Example project**: `examples/nextjs-basic` showing a Before / After of AI-generated code under `ai-check-template` (SPEC-0011)
- [x] **Test design template + post-implementation diagnostic prompt**: `package-templates/docs/test-design-template.md` and `package-templates/prompts/diagnostic-repair.md` (SPEC-0012)
- [x] **First public dogfooding report** in an anonymized form: [`phase-1-initial-dogfooding-report.md`](./phase-1-initial-dogfooding-report.md) (SPEC-0013)
- [x] **v0.1.0 git tag and GitHub Release**: [`releases/v0.1.0.md`](./releases/v0.1.0.md) (SPEC-0014)

**Audience**: Early adopters who are comfortable copying files manually, are already doing AI-driven development, and want a verification scaffold quickly.

**Out of scope for v0.1.0**: anything requiring a Node runtime to bootstrap the templates themselves (the templates expect Node tools in *your* project; they don't need Node to be copied).

## v0.2.0 — CLI scaffolding

**Status**: Released on 2026-05-16 as `ai-check-template@0.2.0`. See [`./releases/v0.2.0.md`](./releases/v0.2.0.md), alpha history in [`./releases/v0.2.0-alpha.0.md`](./releases/v0.2.0-alpha.0.md), and [`./cli.md`](./cli.md).

**Theme**: Reduce friction from manual copy to one command.

**Goal**: `npx -y ai-check-template init --profile react-nextjs+supabase-rls` produces a working setup in an existing project, with safe merging into `package.json`, `.claude/settings.json`, and `.github/workflows/`.

**Planned commands**

- `init` — flag-driven setup that picks profiles, copies templates, and safely merges fragments
- `update` — bring known template-managed files, profile docs, package scripts, CI workflows, and Claude hook commands in an existing setup up to the current package version
- `doctor` — diagnose drift between the installed templates and the current upstream version, including package scripts, files, CI workflows, Claude hooks, profile warnings, and strict warning mode

**Delivered scope**

- [x] Repository-local `node bin/ai-check-template.mjs init`
- [x] `--profile`, `--ci`, `--claude-hooks`, `--dry-run`, `--yes`, and `--overwrite`
- [x] Safe package script merge and file copy defaults
- [x] Node built-in tests wired into repository validation
- [x] `npm pack` dry-run contents check and local tarball-installed CLI smoke
- [x] `npm publish --dry-run --tag next` preflight for prerelease publish
- [x] Read-only `doctor` foundation for scripts, files, CI, and Claude hook drift
- [x] Guarded `update` foundation for package scripts, files, CI, and Claude hook drift
- [x] Install state foundation (`.ai-check-template.json`) for profile / CI / Claude hook defaults
- [x] Non-blocking profile diagnostics warnings in `doctor`
- [x] Profile-aware package script migrations for `init`, `doctor`, and `update`
- [x] Support script defaults for generated package script references
- [x] Package manager detection for generated package scripts (`pnpm`, `npm`, `yarn`, `bun`)
- [x] Missing referenced package script diagnostics in `doctor`
- [x] Strict doctor warning mode (`doctor --strict`) for CI or release prep
- [x] Stale managed CI workflow diagnostics in `doctor`
- [x] Exact-managed workflow cleanup in `update`
- [x] Optional npm dev dependency install with `--install-deps`
- [x] Profile-aware docs migration for test design, philosophy, prompt, and selected profile guidance
- [x] Package-manager-aware Claude hook command migration
- [x] Package-manager-aware CI workflow command migration
- [x] npm publish and `npx ai-check-template init`
- [x] deeper non-doc profile-aware file migrations
- [x] stable release readiness validation for `0.2.0` with `npm publish --dry-run --tag latest`
- [x] stable npm publish, `npx @latest` smoke, `v0.2.0` tag, and GitHub Release

**Dependencies on v0.1.0**

- Stable file layout under `package-templates/`
- At least one round of dogfooding feedback documenting which decisions were ambiguous
- Profile API frozen enough that merging is safe

**Out of scope for v0.2.0**: GitHub Actions Composite Action, Marketplace listing.

## v0.3.0 — Reusable workflow and Composite Action

**Status**: Released on 2026-05-16. Release notes: [`./releases/v0.3.0.md`](./releases/v0.3.0.md). The hosted workflow / Composite Action guide is [`./github-actions.md`](./github-actions.md).

**Release type**: GitHub Actions integration. The npm CLI package remains `ai-check-template@0.2.0`.

**Theme**: Make the CI integration first-class on GitHub.

**Goals**

- A hosted reusable workflow at `.github/workflows/ai-quality.yml` callable via `uses: heidayo/ai-check-template/.github/workflows/ai-quality.yml@v0.3.0`
- A Composite Action at `ai-quality/action.yml` callable via `uses: heidayo/ai-check-template/ai-quality@v0.3.0`
- Documentation that distinguishes the hosted workflow, Composite Action, and local copy examples
- GitHub Marketplace listing once the Composite Action surface is stable

**Foundation scope**

- [x] Hosted reusable workflow foundation
- [x] Composite Action foundation
- [x] GitHub Actions documentation and structure validation
- [x] v0.3.0 tag and GitHub Release
- [ ] GitHub Marketplace listing

**Dependencies on v0.2.0**

- Profile names and the per-profile script set are stable
- Versioning policy is clear (`@v0.3.0` exact-pin first, future `@v1` major alias after contract stability)

## v0.4.0 — Structured CLI evidence and security gate expansion

**Status**: Released on 2026-05-19. Release notes: [`./releases/v0.4.0.md`](./releases/v0.4.0.md).

**Release type**: npm CLI release. The npm package is `ai-check-template@0.4.0`.

**Theme**: Move from a thin script scaffold toward machine-readable evidence that AI agents, CI, and reviewers can use.

**Goals**

- `ai-check-template run` records package-script steps with `PASS`, `FAIL`, `SKIPPED`, timing, exit code, and redacted stdout/stderr.
- `ai-check-template expect` validates AC / Test Matrix JSON or template-subset YAML before implementation.
- `ai:check:secure` separates secret scanning, dependency audit, supply-chain check, and Semgrep SAST.
- Claude hook templates capture `Edit`, `Write`, `MultiEdit`, and `NotebookEdit`.
- First-time readers can follow one map from requirements to prompts, test design, local checks, repair, CI, and review gates.

**Delivered scope**

- [x] Structured run command and tests
- [x] Structured AC/Test Matrix schema, JSON example, YAML example, validator, and init migration
- [x] Expanded security support scripts for `security:secrets`, `security:deps`, `security:supply-chain`, and `security:sast`
- [x] Claude hook matcher expansion for `MultiEdit` and `NotebookEdit`
- [x] First-look map in [`./usage-model.md`](./usage-model.md) and prompt README alignment
- [x] `0.4.0` package metadata and release readiness validation

**Release state**

- [x] `npm publish --tag latest --access public`
- [x] `git tag v0.4.0`
- [x] GitHub Release for `v0.4.0`
- [x] post-publish `npx -y ai-check-template@latest --help` and smoke init

**Dependencies on v0.2.0 and v0.3.0**

- v0.2.0 provides the stable npm CLI scaffolding base.
- v0.3.0 provides the hosted GitHub Actions foundation that can consume the generated `ai:check` scripts.

## v0.5.0 — Update-safe customization, machine-readable verification, and profile extensibility

**Status**: Prepared from real-project dogfooding feedback. Release notes: [`./releases/v0.5.0.md`](./releases/v0.5.0.md).

**Release type**: npm CLI release. The npm package is `ai-check-template@0.5.0`.

**Theme**: Let adopters customize the template safely and drive verification from machine-readable evidence, without forking the managed files.

**Delivered scope**

- [x] Managed-file hash baselines in install state (schema v2) and 3-way `update` that protects locally modified managed files as `skip-modified` with `--force-managed` / `--keep-local` / `--diff` (SPEC-0056)
- [x] Installer-owned overlay slots: auto-sourced `scripts/ai-check.local.sh` and untouched `.claude/rules/local/` (SPEC-0057)
- [x] `.ai-check.yaml` / `.ai-check.json` step configuration for `run` (SPEC-0058)
- [x] `report` command that reconciles declared AC / Test Matrix against `run --json` evidence, plus a pinned `run-result.schema.json` (SPEC-0059)
- [x] Specified base+addon profile composition rules with a snapshot regression guard (SPEC-0060)
- [x] `--workspace <pkg-dir>` monorepo support for `init` / `update` / `doctor` (SPEC-0061)
- [x] CI templates with paths-filter/matrix examples, opt-in Semgrep SARIF for GitHub Code Scanning, and SHA-pin guidance (SPEC-0062)
- [x] Schema-independent, parameterized supabase-rls test templates (SPEC-0063)
- [x] Opt-in authz/RLS Semgrep rule examples in the supabase-rls addon (SPEC-0064)
- [x] Custom profile external definitions via `--profile-file` without changing the built-in profiles (SPEC-0065)

**Breaking behavior change**

- `update` no longer overwrites managed files that the user has modified; it reports them as `skip-modified` and requires `--force-managed` to overwrite (with a `.bak-<version>` backup). Unmodified files still auto-follow upstream. See [`./releases/v0.5.0.md`](./releases/v0.5.0.md).

**Dependencies on prior versions**

- v0.2.0 CLI scaffolding and install state, v0.4.0 `run` / `expect` structured evidence.

**Post-release observation (OPS-03)**: Observe one release cycle of dogfooding to confirm the 3-way `skip-modified` default produces zero false positives before considering any further default changes.

## Beyond v0.4.0

Candidates, not commitments:

- Adoption-focused usage model: [`./usage-model.md`](./usage-model.md) explains the Local loop, Repair loop, E2E loop, CI gate, and Review gate that make the package useful after installation.
- Structured reporting aggregation for `ai-check-template run` results across PRs.
- Reviewability template foundation: [`../package-templates/.github/PULL_REQUEST_TEMPLATE.md`](../package-templates/.github/PULL_REQUEST_TEMPLATE.md), [`../package-templates/worksheet/ai-code-understanding.md`](../package-templates/worksheet/ai-code-understanding.md), and review prompts make AI-generated code explainable before human acceptance.
- GitLab CI / CircleCI / Bitbucket Pipelines templates
- Project-specific dashboards that aggregate `ai:check` results across PRs
- Per-language extensions (Python, Go, Rust) once the Node-first design has matured
- Integration patterns for non-Claude-Code agents (Codex, Cursor, others) at the `ai:check` shell layer

## How decisions get made

This roadmap is a living document. Two inputs drive changes:

1. **Dogfooding feedback** — recorded in [`./phase-1-feedback-template.md`](./phase-1-feedback-template.md) and summarized in [`./phase-1-dogfooding-protocol.md`](./phase-1-dogfooding-protocol.md). Items with high impact or recurring patterns get promoted into roadmap milestones.
2. **External contribution** — Issues filed via the templates under [`../.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/). Feature requests, template requests, and bug reports are triaged into milestones, [`good first issue`](https://github.com/heidayo/ai-check-template/labels/good%20first%20issue), or `wontfix` with rationale.

If a candidate is not on this roadmap, that does not mean it is rejected — it means no one has decided it is the next priority yet. File an Issue.

## References

- [`./vision.md`](./vision.md) — the philosophical motivation
- [`./usage-model.md`](./usage-model.md) — how the package helps after AI implementation
- [`./github-actions.md`](./github-actions.md) — hosted workflow, Composite Action, and copy examples
- [`../README.md`](../README.md) — the external-facing entry point
- [`../README-en.md`](../README-en.md) — English version of the external-facing entry point
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — how to participate
