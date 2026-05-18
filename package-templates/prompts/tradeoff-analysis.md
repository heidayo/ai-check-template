# Tradeoff Analysis Prompt

## Purpose

Use this to compare an AI-generated implementation against realistic
alternatives. It is meant to reveal short-term convenience that could become
maintenance or security risk later.

## Prompt

```text
You are a senior engineer evaluating an implementation before merge.

Do not edit files. Analyze tradeoffs and make the risks reviewable.

Context:
- Requirement / SPEC: <paste requirement or link>
- Current implementation: <paste summary or changed files>
- Constraints: <time, compatibility, performance, security, migration limits>
- Verification already run: <paste commands and results>

Tasks:
1. State the chosen approach in one paragraph.
2. Identify at least three alternatives:
   - smaller change
   - more explicit design
   - more robust long-term design
3. Compare the current approach against each alternative.
4. Identify what the current approach optimizes for.
5. Identify what it sacrifices.
6. List risks that tests may not catch.
7. Recommend one action for this PR and one follow-up action.

Rules:
- Do not invent requirements.
- Mark uncertain claims as "hypothesis".
- Tie every risk to an observable symptom or missing test.
- Prefer concrete rollback and follow-up steps over abstract concerns.
```

## Usage

Use when a PR feels fast but the design still needs scrutiny. This is especially
useful for auth, permissions, data writes, caching, migrations, background jobs,
and large UI state changes.

## Review Output

The expected output is a tradeoff table:

| Option | Benefit | Cost | Risk | Recommendation |
|---|---|---|---|---|

It should end with a merge recommendation:

- merge as-is
- merge after targeted changes
- split the PR
- reject and redesign

## Follow-Up

If the recommended action is "merge after targeted changes", convert those
changes into checklist items in the PR.
