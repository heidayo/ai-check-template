# Contributing to ai-check-template

Thank you for considering a contribution. This project exists because AI-driven development moves faster than verification, and we believe that gap is solvable with reusable templates. Your contribution helps close that gap for everyone.

## Before you start

- Read the [README](./README.md) to understand what this project is.
- Skim [`docs/vision.md`](./docs/vision.md) so you know what we are trying to achieve and what is out of scope.
- Skim [`docs/roadmap.md`](./docs/roadmap.md) to see where your idea fits.
- Read the [Code of Conduct](./CODE_OF_CONDUCT.md). We expect contributors to follow it.

## Quick start for contributors

Most contributions are documentation, prompts, or template additions, so you usually do **not** need to install a Node toolchain to contribute. You only need:

- `git`
- A text editor
- Optionally `bash` if you touch shell scripts under `package-templates/scripts/`

For local validation of SAGE governance (optional, only if you are working on multi-file changes):

```bash
bash scripts/sage-validate.sh
```

This is opt-in. If you do not have SAGE installed locally, your PR will still be reviewable.

## How to contribute

### 1. File an issue first

For anything larger than a typo fix, please file an [Issue](https://github.com/heidayo/ai-check-template/issues/new/choose) first. We use Issues as the place to agree on scope before code review. The Issue templates cover the three common cases: bug, feature, and template request.

### 2. Pick a development lane

This project uses [SAGE Development System](https://github.com/heidayo/sage-ai-template) lanes. You can ignore the details if you are not familiar; the short version is:

| Lane | Branch prefix | Use when |
|---|---|---|
| `explore` | `vibe/*` | Prototyping, throwaway experiments, design exploration. No SPEC required. |
| `lite` | `fix/*`, `chore/*`, `docs/*` | Small fixes: typos, link updates, single-file documentation tweaks. Max 3 files. No contract changes. |
| `standard` | `feature/*` | Most contributions go here. Adding a new template, a new profile, a new prompt. SPEC required for non-trivial changes. |
| `promotion` | `promote/*` | Graduating a `vibe/*` experiment into mainline. Retro-SPEC required. |

If unsure, default to `feature/` for new content or `docs/` for documentation tweaks.

### 3. Open a PR

- Reference the Issue you filed (if any) in the PR description.
- Use the [PR template](./.github/PULL_REQUEST_TEMPLATE.md). It covers summary, change type, verification steps, impact, promotion checks, risks, and rollback.
- Every commit message must include a TASK-ID for the `standard` lane (e.g. `TASK-0029: rewrite README`). For `lite` lane PRs this is optional but recommended for traceability.
- Keep PRs focused. One PR per logical change. Multi-purpose PRs are difficult to review.

### 4. Review

- A maintainer will review within a few business days.
- We may suggest changes for clarity, scope, or alignment with existing templates. This is normal — please don't take it personally.
- Once approved and CI passes, a maintainer will merge.

## What we accept

- New philosophy documents, prompts, scripts, CI examples, profiles, example projects
- Documentation improvements (clarity, examples, translation, link fixes)
- Bug fixes in templates that don't behave as documented
- Dogfooding reports anonymized for public consumption (see [`docs/phase-1-feedback-template.md`](./docs/phase-1-feedback-template.md))

## What we are cautious about

- Adding dependencies that the project itself does not need (we are still copy & adapt; CLI bootstrap dependencies arrive in v0.2.0)
- Breaking changes to existing template paths (these affect all downstream users — please file an Issue first)
- Profile or prompt additions that target a specific company's internal stack rather than a general one
- License-incompatible code (we are Apache-2.0; contributions are accepted under the same license)

## Language

You may write Issues, PRs, and review comments in **English or Japanese**. The canonical project documents are English-Primary with Japanese versions where applicable (e.g. `README.md` and `README-ja.md`). Templates and prompts inside `package-templates/` may be Japanese for now — translations to English are welcome contributions.

## SAGE governance, briefly

This repository is itself developed under the [SAGE Development System](https://github.com/heidayo/sage-ai-template). What this means for you:

- The `specs/`, `plans/`, `tasks/` directories contain the design artifacts for each change. They are useful as historical context but not required reading.
- Commits on the `standard` lane must include a TASK-ID. This is enforced by a `commit-msg` hook in maintainer setups.
- Some files (`CLAUDE.md`, `sage/`, `.sage/config.yaml`, `.claude/settings.json`) are protected by SAGE. If your PR needs to touch them, mention it in the Issue first.

You do **not** need SAGE installed locally to contribute. Maintainers will run SAGE checks on the maintainer side.

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](./LICENSE), the same license as the rest of the project. Please make sure you have the right to contribute the code (it is yours, or your employer has authorized you to contribute, or it is already compatibly licensed upstream).

## Where to start

If you want to contribute but don't know where to start, look at Issues labeled [`good first issue`](https://github.com/heidayo/ai-check-template/labels/good%20first%20issue). These are scoped to be small, well-understood, and free of major design debate.

If you are interested in larger work, the [roadmap](./docs/roadmap.md) lists planned milestones. Pick something there and file an Issue saying you would like to take it on.

Welcome aboard.
