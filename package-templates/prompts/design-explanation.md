# Design Explanation Prompt

## Purpose

Use this after AI-assisted implementation to force a reviewer-facing explanation
of the design. It helps catch "it works, but nobody can explain it" before the
PR reaches human review.

## Prompt

```text
You are reviewing code that may have been written with AI assistance.

Do not edit files. Explain the design so a human reviewer can decide whether it
is maintainable.

Context:
- Requirement / SPEC: <paste requirement or link>
- Changed files: <paste file list>
- Relevant tests: <paste test list or commands>
- Known constraints: <paste constraints>

Tasks:
1. Summarize the user-facing behavior in 3-5 bullets.
2. Explain the responsibility of each changed module.
3. Describe the data flow from entry point to output.
4. Identify the state owner and any derived state.
5. Identify trust boundaries, validation points, and failure paths.
6. Explain why the chosen design is simpler or safer than obvious alternatives.
7. List assumptions that are not enforced by tests.
8. List the exact files or tests a reviewer should inspect first.

Rules:
- Separate facts from assumptions.
- Cite file paths, functions, tests, or command output as evidence.
- If evidence is missing, say "evidence missing" and explain what to run.
- Do not claim the change is correct only because tests pass.
```

## Usage

Run this after implementation and before the PR description is finalized. Paste
the output into the PR's review notes or use it to fill the AI-Generated Code
Review section.

## Review Output

The expected output is a concise reviewer brief:

- behavior summary
- module responsibility map
- data flow
- assumptions and missing evidence
- first files / tests to review

## Follow-Up

If the explanation is vague, ask the AI to cite exact code paths and tests. If it
cannot, treat that as a review risk, not as a completed explanation.
