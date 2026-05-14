# Phase 1 Initial Dogfooding Report

> **Status**: Public initial report for v0.1.0. This report is based on repository-internal dogfooding and the runnable Next.js example. It is not external production project data and is not Phase 2 graduation evidence.

## Summary

This report documents the first public dogfooding pass for `ai-check-template` v0.1.0.

The goal was to verify whether the manual template set can support the core loop:

```
Requirement -> AC -> Test Design -> AI Implementation -> Quality Check -> Repair -> Re-check -> Human Acceptance
```

The dogfooding targets were intentionally anonymized. No external customer, employer, user, or production project data is included.

## Anonymization

| Public label | What it represents | Data included | Data excluded |
|---|---|---|---|
| `project-template-repo` | This repository while building v0.1.0 templates | PR flow, SAGE artifacts, validation commands, public docs | private workspace details, local credentials, personal data |
| `project-nextjs-example` | The runnable example added under `examples/nextjs-basic` | public fixture data, test commands, build output category | real user data, external services, production traffic |

Anonymization rules:

- Use generic project labels only.
- Include public PR numbers and command names, not local private paths beyond repository-relative paths.
- Include findings and fixes, not raw private diagnostic output.
- Do not claim external production adoption.

## Scope

Included:

- PR #5: repository GitHub Actions strengthening and reusable workflow template validation.
- PR #6: `examples/nextjs-basic` Before / After example and `pnpm ai:check` run.
- PR #7: test design template and diagnostic repair prompt.
- Root validation through `make validate` and `scripts/sage-validate.sh`.
- SAGE scoring discipline for SPEC / PLAN / TASK artifacts.

Excluded:

- External production project dogfooding.
- Two-project / two-profile Phase 2 graduation evidence.
- CLI scaffolding or package installation.
- Runtime behavior changes outside the v0.1.0 manual template set.

## Methodology

1. Build each v0.1.0 deliverable under SAGE standard lane.
2. Require SPEC / PLAN / TASK before implementation.
3. Score SPEC / PLAN / TASK to 100/S++ before or during implementation.
4. Run local validation commands.
5. Open PR with Japanese PR template and verification evidence.
6. Wait for GitHub Actions `validate`.
7. Merge only after CI passes.
8. Record the public findings below.

The method intentionally treats "AI said it is done" as insufficient. Evidence must come from commands, tests, or merged PR state.

## Evidence

| Evidence | Target | Result |
|---|---|---|
| `make validate` | `project-template-repo` | PASS after PR #5, PR #6, PR #7 |
| `bash scripts/sage-validate.sh` | `project-template-repo` | PASS during SPEC-0011, SPEC-0012, SPEC-0013 work |
| `cd examples/nextjs-basic && pnpm ai:check` | `project-nextjs-example` | PASS: typecheck, Vitest tests, Next build |
| GitHub Actions `validate` | PR #5, PR #6, PR #7 | PASS |
| SAGE artifact scoring | SPEC-0010..SPEC-0012 | 100/S++ after explicit scoring closure |

Command-level evidence used in this report:

```bash
make validate
bash scripts/sage-validate.sh
cd examples/nextjs-basic && pnpm ai:check
git diff --check
```

## Findings

### DF-001: Scoring must happen per artifact, not only per SPEC

- **Observed in**: `project-template-repo`
- **Evidence**: During SPEC-0010 closure, scoring was initially summarized at SPEC / PLAN level. The user explicitly asked whether TASKs were scored individually.
- **Impact**: high
- **Status**: fixed
- **Fix applied**: SPEC-0011 and SPEC-0012 were executed with per-TASK scoring updates while implementation progressed.
- **Follow-up**: Keep PR descriptions explicit about SPEC / PLAN / TASK scoring coverage.

### DF-002: Validation must ignore generated dependency and build output

- **Observed in**: `project-nextjs-example`
- **Evidence**: Running example checks generated nested `node_modules` / `.next` output. Root JSON validation initially scanned nested generated files and could report noisy failures.
- **Impact**: medium
- **Status**: fixed
- **Fix applied**: `Makefile` validation now excludes nested `node_modules` and `.next`, and parse failures fail the command instead of being hidden by a later echo.
- **Follow-up**: Keep future example validation structural unless the SPEC explicitly opts into dependency install.

### DF-003: Text-based gates can false-positive on the rule text itself

- **Observed in**: `project-template-repo`
- **Evidence**: Checks for unfinished marker patterns flagged docs that were explaining the prohibited marker names.
- **Impact**: medium
- **Status**: fixed
- **Fix applied**: SPEC-0011 and SPEC-0012 changed public wording to "unfinished markers" where the literal marker names would create validation noise.
- **Follow-up**: Prefer semantic wording in docs when the literal pattern is also used as a gate.

### DF-004: Repair prompts need redaction and AC immutability

- **Observed in**: `project-template-repo`
- **Evidence**: The repair flow needed a stable way to hand failing diagnostic output back to AI without allowing acceptance criteria to drift.
- **Impact**: high
- **Status**: fixed
- **Fix applied**: SPEC-0012 added `package-templates/prompts/diagnostic-repair.md` and `package-templates/docs/test-design-template.md`.
- **Follow-up**: External dogfooding should test whether the prompt works with real CI logs after sensitive values are redacted.

### DF-005: Initial report must distinguish internal dogfooding from graduation evidence

- **Observed in**: `project-template-repo`
- **Evidence**: The protocol requires at least two real projects and two profile types for Phase 2 graduation, but this session only has repository-internal evidence.
- **Impact**: high
- **Status**: open
- **Fix applied**: This report states its limitation clearly and does not claim Phase 2 readiness.
- **Follow-up**: Run external dogfooding on at least two projects before starting CLI scaffolding.

## Limitations

This report is not external production project data.

This report is not Phase 2 graduation evidence.

The Phase 1 protocol still requires:

- At least two dogfooding projects.
- At least two profile types.
- At least five recorded feedback items.
- At least one approved SPEC revision driven by external dogfooding feedback.
- Explicit maintainer approval before Phase 2 begins.

The current report only proves that the repository's own v0.1.0 workflow and the bundled Next.js example can pass the declared checks.

## Next Actions

1. Use this report as SPEC-0014 release evidence for v0.1.0.
2. Recruit at least two external or forked projects for Phase 1 dogfooding.
3. Cover at least two profiles, preferably one UI profile and one data or CLI profile.
4. Record external findings through `docs/phase-1-feedback-template.md`.
5. Revise this report after external dogfooding is complete.
6. Do not start Phase 2 CLI scaffolding until the protocol's graduation conditions are met.

## Related Documents

- [`./phase-1-dogfooding-protocol.md`](./phase-1-dogfooding-protocol.md)
- [`./phase-1-feedback-template.md`](./phase-1-feedback-template.md)
- [`./roadmap.md`](./roadmap.md)
- [`../examples/nextjs-basic/README.md`](../examples/nextjs-basic/README.md)
