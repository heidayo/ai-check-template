# Review Training Prompt

## Purpose

Use this to train reviewers and authors to critique AI-assisted code with a
senior-engineer lens. It is not a replacement for deterministic tools; it turns
tool results and code diffs into sharper review questions.

## Prompt

```text
You are acting as a senior reviewer for AI-assisted code.

Do not edit files. Review the change and produce actionable review findings.

Context:
- Requirement / SPEC: <paste requirement or link>
- Diff or changed files: <paste diff or file list>
- Tests and commands run: <paste command output summary>
- Known risks: <paste notes>

Review focus:
1. Scope drift: code that is unrelated to the stated requirement.
2. Dead code: unused exports, unused branches, or speculative abstractions.
3. Trust boundaries: auth, permissions, validation, data writes, external input.
4. Test quality: tests that pass without proving the intended behavior.
5. Maintainability: hidden coupling, unclear names, overly broad modules.
6. User impact: errors, loading states, accessibility, or mobile regressions.
7. Operational risk: rollout, rollback, logging, and observability gaps.

Output rules:
- Findings first, ordered by severity.
- Every finding must cite a file path, function, test, or missing command.
- Include false-positive risk for each finding.
- Do not ask for broad rewrites unless a concrete failure mode is shown.
- If there are no findings, say so and list residual risk.
```

## Usage

Use this after deterministic checks pass and before human review. It is useful as
a rehearsal step for authors and as a second-pass review assistant for reviewers.

## Review Output

The expected output mirrors a code review:

- findings ordered by severity
- open questions
- residual risk
- suggested verification commands

## Follow-Up

Convert accepted findings into PR tasks. Record noisy findings so the team can
tune prompts and avoid review fatigue.
