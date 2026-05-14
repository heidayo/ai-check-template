# Vision

> The verification gap is the bottleneck of AI-driven development.

## The problem we solve

AI coding tools (Claude Code, Codex, Cursor, etc.) have made implementation **fast**. They have not made **verification** fast. The bottleneck of AI-driven development is no longer "how do I get the model to write code" but "how do I tell whether the code is actually correct, safe, and complete."

In practice, AI-generated code often:

- Compiles and looks complete, but fails type checks under strict mode
- Implements the happy path, but ignores boundary conditions, authorization, rate limiting, or RLS
- Leaves unused exports, dead branches, or accidental scope drift behind
- Self-reports "Done" when the reality is "Partially done in the happy path"

The cost of these failures is borne later — in code review, in QA, in production incidents — not in the AI session itself. AI saves implementation time and shifts the cost downstream. `ai-check-template` is built to bring that cost back into the AI session, where it is cheapest to fix.

## The principle: Formal Name Match (形名参同)

The core idea is borrowed from classical Chinese governance and re-applied to software quality:

- **名 (Name)**: the success criteria, declared **before** implementation, in a machine-verifiable form (commands, tests, thresholds)
- **形 (Form)**: the actual output, measured **after** implementation, by running those commands

A change is "complete" only when **Name = Form**. The AI cannot grade itself. Either the criteria were satisfied or they were not, and the evidence is reproducible.

Concretely, this manifests as:

- A `Plan-First` prompt that forces the model to declare acceptance criteria, verification commands, and risk scenarios before writing code
- An `ai:check` integrated script that runs the verification commands as a single deterministic step
- A hook stack (Claude Code Edit / Stop hooks) that triggers `ai:check` automatically inside the AI session
- A CI workflow that runs the same `ai:check` on every PR

Same script, same criteria, three execution points (local editor, AI session, CI) — so no inconsistency between what the AI says, what the developer sees, and what CI enforces.

## What "check" means concretely

`ai-check-template` does not invent a new test runner. It composes existing tools into a single deterministic command, and assigns each tool to the verification layer where it is cheapest to run:

| Layer | Question it answers | Typical tools |
|---|---|---|
| **Static** | Does the code compile and obey project conventions? | `tsc --noEmit`, `eslint`, `prettier --check` |
| **Diagnostics** | Does the project have dead exports, unused dependencies, accidental cycles? | `knip`, `React Doctor`, `madge` |
| **Unit** | Do small pieces of logic behave per their acceptance criteria? | `vitest`, `jest`, `pgTAP` |
| **Integration** | Do components correctly compose at boundaries? | `vitest` + test doubles, route handler tests |
| **E2E (smoke)** | Does the happy path render and respond? | `playwright`, `maestro` |
| **Security** | Does the diff introduce known-bad patterns or secrets? | `semgrep`, `gitleaks` |

The `ai:check` command runs these in order, fails fast on the first hard error, and produces a single PASS/FAIL line. The AI sees the same output the developer sees, so it cannot self-grade with a softer rubric.

## How the loop runs in practice

A typical AI session under this template looks like:

1. Developer writes a short Issue or instruction: "Add a `/api/users/:id` endpoint that returns the user's public profile."
2. The `plan-first` prompt forces the AI to produce: acceptance criteria, error cases, RLS expectations, and the verification commands — **before** writing code.
3. AI implements. On every file write, the **Edit hook** runs `ai:check:fast` (Static + Diagnostics only) — fast feedback inside the session.
4. When the AI stops, the **Stop hook** runs the full `ai:check` — including Unit / Integration / E2E smoke / Security.
5. On any failure, the AI receives the failing output verbatim and is asked to repair. The same `ai:check` then re-runs.
6. The PR opens with the `ai:check` PASS line and the original acceptance criteria. Human review is about judgment, not about catching what `ai:check` already catches.
7. CI re-runs `ai:check` on the PR. Same script, same answer.

The loop is intentionally boring. The interesting part — judgment, design, taste — is left to humans. Verification is mechanized.

## Failure modes the templates explicitly target

These are concrete failure patterns observed in unguided AI sessions. Each has at least one template, prompt, or hook designed to surface it before merge:

- **Happy-path-only implementations** → `boundary-value` and `decision-table` prompts force equivalence classes and edge cases into the test design
- **Silent RLS / authorization gaps** → `rls-permission` prompt declares the permission matrix as a table, generating one test per cell
- **Stuck state transitions** → `state-transition` prompt requires a state diagram + transition table, then tests every transition
- **Dead exports and accidental scope drift** → `knip` and File Scope rules detect them on every `ai:check` run
- **Premature E2E bias** ("the AI wrote a screen, so let's write a Playwright test") → Test Pyramid philosophy doc + Locator priority rule re-balance toward Static + Unit
- **AI declaring "Done" while criteria are unmet** → Formal Name Match: PASS is `ai:check` exit code 0, not the AI's natural-language summary

## Adoption model

The project assumes incremental adoption. There is no all-or-nothing flag day. A team can:

- Start with **only the philosophy docs** (read-only, no code change)
- Add **only the `plan-first` prompt** (used in any AI tool that supports custom prompts)
- Adopt **only `ai:check.sh`** (run manually, no hooks, no CI)
- Layer **the Claude Code hooks** (Edit-fast / Stop-full) on top
- Finally, **wire the GitHub Actions workflow** so CI enforces the same criteria

Each step provides value on its own. The full loop is the long-term target, not a prerequisite.

## Boundary: what this project is and is not

### This project provides

- Reusable templates and prompts for the Formal Name Match loop
- Profile-specific configurations for common stacks (Next.js, vanilla React, Expo, Node CLI, Supabase + RLS)
- GitHub Actions templates that run the same loop on PRs
- A philosophy document set that explains the reasoning

### This project does NOT provide

- A specific LLM, agent framework, or vendor lock-in
- A test framework or test runner (it expects you to bring your own — `vitest`, `playwright`, `pgTAP`, etc.)
- A replacement for code review or human judgment
- Security guarantees beyond the templates' surface (the underlying tools — Semgrep, knip, React Doctor, Playwright — own those guarantees)
- A way to make AI "smarter" (the project assumes AI output is unreliable and works around that)

## Related ideas

The Formal Name Match approach overlaps with several well-known practices, but combines them specifically for AI-driven development:

- **Test-Driven Development**: declare expected behavior first, implement to satisfy it. `ai-check-template` extends TDD with prompt templates that force the AI to participate in declaration.
- **Behavior-Driven Development (Given-When-Then)**: structure acceptance criteria so they map directly to tests. Used here as the bridge between human intent and machine verification.
- **The Test Pyramid**: assign verification responsibility to the layer where it is cheapest. AI tends to bias toward E2E ("if I write a screen, I should test the screen"); the templates re-balance toward static and unit tests.
- **Property-Based Testing**: declare invariants instead of examples. Compatible but not required; the QA technique prompts cover equivalence partitioning and boundary value which serve a similar role.
- **Contract Testing**: verify the contract between services. Out of scope for v0.1.0; relevant for v0.3.0+ when multi-service workflows become common.

## Why this matters

AI-driven development is shifting the bottleneck. Pre-AI, implementation was slow and verification was relatively cheap (because there was less code per unit time). Post-AI, implementation is fast and verification, **if done poorly**, becomes the new bottleneck.

A team that produces AI-generated code at high speed but cannot verify it at the same speed produces **expensive technical debt**. The debt is hidden during development (the AI doesn't warn you) and surfaces in production (incidents, rework, customer trust).

`ai-check-template` aims to make verification keep pace with AI-driven implementation, so the speed gain compounds instead of being absorbed by downstream cost.

## Status and roadmap

See [`./roadmap.md`](./roadmap.md). The current focus (v0.1.0) is shipping a manual-copy template set that can be adopted today, without waiting for CLI scaffolding or a marketplace action.

## References

- [`../package-templates/docs/philosophy/formal-name-match.md`](../package-templates/docs/philosophy/formal-name-match.md) — Formal Name Match concept and implementation patterns
- [`../package-templates/docs/philosophy/test-pyramid.md`](../package-templates/docs/philosophy/test-pyramid.md) — Layered verification responsibilities
- [`../package-templates/docs/philosophy/given-when-then.md`](../package-templates/docs/philosophy/given-when-then.md) — Acceptance criteria notation
- [`../package-templates/docs/philosophy/qa-techniques.md`](../package-templates/docs/philosophy/qa-techniques.md) — Observation design techniques
