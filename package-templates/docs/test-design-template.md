# Test Design Template

> **Status**: Draft v0.1. Copy this file into your project and fill it before asking AI to implement.

This template turns a requirement into observable tests. It is designed for AI-assisted development, where the model should not start implementation until the expected behavior, edge cases, and verification commands are explicit.

Use it between:

```
Requirement -> Acceptance Criteria -> Test Design -> AI Implementation -> Quality Check
```

The goal is Formal Name Match: the "name" is the declared behavior below, and the "form" is the evidence produced by tests and diagnostics.

## How to Use

1. Fill `Requirement` and `Acceptance Criteria` before implementation.
2. Map each acceptance criterion to at least one test row.
3. Assign each test to the cheapest reliable verification layer.
4. Give this completed document to the AI along with the implementation task.
5. After implementation, run the verification commands exactly as written.
6. If a command fails, use [`../prompts/diagnostic-repair.md`](../prompts/diagnostic-repair.md) with redacted diagnostic output.

## Requirement

### Summary

Write the user-visible behavior in one or two sentences.

Example:

> Users can update their display name from the profile settings page. Empty names are rejected and successful updates are reflected immediately on the page.

### Scope

- In scope:
  - [write the files, screens, API routes, or commands that may change]
  - [write the behaviors that must be implemented]
- Out of scope:
  - [write adjacent behaviors that must not change]
  - [write future work that should not be pulled into this task]

### User / Actor

- Primary actor:
- Secondary actor:
- Trust boundary:

### Inputs and Outputs

| Item | Type | Source | Expected shape | Notes |
|---|---|---|---|---|
| input_name | string | UI / API / CLI | 1-50 visible characters | Example row |
| output_state | object | API response / UI state | public fields only | Example row |

## Acceptance Criteria

Write acceptance criteria before implementation. They should be stable even if the implementation approach changes.

| AC ID | Criterion | Verification command or test | Layer |
|---|---|---|---|
| AC-01 | Happy path behavior succeeds | `pnpm test path/to/test` | unit / integration |
| AC-02 | Invalid input is rejected | `pnpm test path/to/test` | unit |
| AC-03 | Unauthorized or out-of-scope access is blocked | `pnpm test path/to/test` | integration / security |
| AC-04 | Existing behavior does not regress | `pnpm ai:check` | full gate |

Rules:

- Each AC must have a command, test name, or explicit manual evidence.
- At least one AC should cover an error path.
- Security or trust boundary changes must have a negative test.
- Do not rewrite AC after implementation just to match the code.

## Test Matrix

Use this table to map behavior to the cheapest reliable test layer.

| Test ID | AC ID | Scenario | Given | When | Then | Layer | Command | Owner |
|---|---|---|---|---|---|---|---|---|
| T-001 | AC-01 | valid happy path | valid precondition | user performs allowed action | expected output appears | unit | `pnpm test path/to/test` | AI |
| T-002 | AC-02 | boundary input | input at minimum / maximum | validation runs | accepted or rejected per rule | unit | `pnpm test path/to/test` | AI |
| T-003 | AC-03 | trust boundary / security | actor lacks permission or data is private | actor requests protected action | request is rejected and private data is not exposed | integration / security | `pnpm test path/to/test` | AI |
| T-004 | AC-04 | regression guard | existing fixture or workflow exists | full check runs | no unrelated failure appears | full gate | `pnpm ai:check` | human + AI |

Layer guidance:

- Static: types, lint, dependency boundaries, dead code.
- Unit: pure logic, validation, formatting, permission predicates.
- Integration: API route, database boundary, service boundary, auth context.
- E2E: core user path only; avoid using E2E for cheap unit-observable behavior.
- Security: RLS, authorization, private field exposure, injection, secret handling.

## Given-When-Then

Convert the most important rows into Given-When-Then statements. This makes the expected behavior easier for both humans and AI to follow.

```gherkin
Scenario: valid display name update
  Given a signed-in user with an existing profile
  When the user submits a display name within the allowed length
  Then the profile is updated
  And the updated display name is visible in the response or UI
```

```gherkin
Scenario: empty display name is rejected
  Given a signed-in user with an existing profile
  When the user submits an empty display name
  Then the request is rejected
  And the existing profile remains unchanged
```

```gherkin
Scenario: private data does not cross the trust boundary
  Given a public API response for another user
  When the response is serialized
  Then private fields are not included
  And the test asserts the exact public field allowlist
```

## Verification Commands

List commands in the order they should run. Prefer fast checks first.

```bash
pnpm typecheck
pnpm lint
pnpm test path/to/changed-area
pnpm ai:check:fast
pnpm ai:check
```

If a command is not available in your project, replace it before implementation. Do not leave placeholder commands in the final task.

## Risks and Gaps

| Risk / Gap | Why it matters | Mitigation | Follow-up trigger |
|---|---|---|---|
| Missing negative test | AI may implement happy path only | Add an invalid input or unauthorized actor row | Any permission or validation change |
| Overusing E2E | Slow and brittle checks hide simple logic failures | Move cheap checks to unit / integration | E2E test duplicates pure logic |
| Private data exposure | AI may return full records by convenience | Use exact public allowlist assertions | API response crosses trust boundary |
| Unclear rollback | Failed implementation may spread unrelated edits | Record files in scope and rollback path | More than one layer changes |

## AI Implementation Brief

After this template is filled, give the AI this instruction:

```
Implement the task using the Requirement, Acceptance Criteria, Test Matrix, and Verification Commands above.

Constraints:
- Do not change the acceptance criteria.
- Do not add files outside the declared scope.
- Add or update tests before or together with implementation.
- Run the verification commands and report exact output.
- If a command fails, stop and provide the failing output instead of claiming success.
```

## Review Checklist

- [ ] Every AC maps to at least one test row.
- [ ] At least one error path is tested.
- [ ] Trust boundary or security behavior has a negative test when applicable.
- [ ] Verification commands are executable in this project.
- [ ] The AI is not allowed to change AC after implementation.
- [ ] Remaining gaps are explicit and assigned to follow-up work.

## Related Philosophy

- [`./philosophy/formal-name-match.md`](./philosophy/formal-name-match.md) — Declare the expected name before comparing the actual form.
- [`./philosophy/test-pyramid.md`](./philosophy/test-pyramid.md) — Put each check at the cheapest reliable layer.
- [`./philosophy/given-when-then.md`](./philosophy/given-when-then.md) — Express behavior as Given / When / Then.
- [`./philosophy/qa-techniques.md`](./philosophy/qa-techniques.md) — Use equivalence classes, boundary values, decision tables, and state transitions.
