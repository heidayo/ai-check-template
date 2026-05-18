# e2e-test-creation prompt

## Purpose

Create stable Playwright E2E tests from a natural-language user journey without
changing the original acceptance criteria. Use this before adding or rewriting
`tests/e2e/*.spec.ts`.

## Prompt

````text
You are creating Playwright E2E tests for an AI-generated implementation.

## Requirement

(Paste the original requirement. Do not rewrite it after implementation.)

## Acceptance Criteria

(Paste the fixed acceptance criteria. These must not be weakened.)

## Target Journey

- User role:
- Starting route:
- Preconditions / test data:
- Main actions:
- Expected visible result:
- Error or boundary case to cover:

## Existing Test Context

- Test directory:
- Existing fixtures:
- Auth setup, if any:
- Base URL / webServer command:
- Commands to run:

## Locator Rules

Use this priority order:

Priority summary: getByRole > getByLabel > getByText > getByTestId > CSS/XPath

1. getByRole
2. getByLabel
3. getByText
4. getByTestId
5. CSS / XPath only as a last resort

If the UI cannot be tested with user-facing locators, report the missing
accessibility label, role, or stable test id instead of writing a brittle test.

## Test Design Rules

- Keep PR smoke tests small and deterministic.
- Mark the critical PR test with @smoke.
- Do not depend on test ordering.
- Do not use arbitrary timeouts as synchronization.
- Prefer web-first assertions such as toBeVisible, toHaveURL, and toHaveText.
- Keep setup data explicit.
- Do not commit credentials, generated storage state, screenshots, or traces.
- Do not change the acceptance criteria to make the test pass.

## Output Format

### Test Plan

- Journey:
- Preconditions:
- Assertions:
- Data setup:
- Flake risks:

### Files To Create Or Change

- path:

### Playwright Test

```ts
// Provide the proposed test code here.
```

### Verification Commands

```bash
pnpm test:e2e:smoke
pnpm ai:check
```

### Review Notes

- Locator quality:
- Trace/report artifact location:
- Remaining risk:
````

## Usage

1. Run this prompt before implementing the E2E test.
2. Review the proposed locator strategy.
3. Add the test under `tests/e2e/`.
4. Run `pnpm test:e2e:smoke`.
5. If it fails, use [`diagnostic-repair.md`](./diagnostic-repair.md) with the
   redacted failure output and the same acceptance criteria.

## Review Output

The generated response should make these review points explicit:

- whether the test is smoke or full-suite
- which user-facing locators are used
- which setup data is required
- which Playwright artifacts will exist after failure
- why any `getByTestId` or CSS selector was necessary

## Sources

- Playwright Best Practices: https://playwright.dev/docs/best-practices
- Playwright Locators: https://playwright.dev/docs/locators
- Playwright Trace Viewer: https://playwright.dev/docs/trace-viewer
