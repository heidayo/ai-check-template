# Playwright Stabilization Templates

> Manual-copy templates for projects that use Playwright as the E2E layer of
> `ai:check`. Copy only the files that match your application.

## Purpose

AI can generate UI quickly, but unstable E2E tests create a slow repair loop.
These templates keep Playwright focused on critical user journeys:

- small smoke tests for pull requests
- deterministic setup data
- user-facing locators
- trace / report artifacts for diagnosis
- CLI execution in CI

Use MCP, browser tools, or UI Mode for exploration. Use the Playwright test
runner CLI for committed tests and CI because it is repeatable and produces
stable artifacts.

## Files

| File | Copy to | Purpose |
|---|---|---|
| `playwright.config.ts` | project root | Next.js / React-oriented stable defaults |
| `tests/smoke.spec.ts` | `tests/e2e/smoke.spec.ts` | First `@smoke` journey template |

## Setup

Install Playwright in the target project:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```

Copy the template files:

```bash
mkdir -p tests/e2e
cp package-templates/playwright/playwright.config.ts ./playwright.config.ts
cp package-templates/playwright/tests/smoke.spec.ts ./tests/e2e/smoke.spec.ts
```

Adjust these values before committing:

- `PLAYWRIGHT_WEB_SERVER_COMMAND` or the `webServer.command` default
- `PORT` / `PLAYWRIGHT_BASE_URL`
- the first `@smoke` test's route and expected landmark
- authentication setup, if your app needs it

## Recommended Scripts

```json
{
  "scripts": {
    "test:e2e:smoke": "playwright test --grep @smoke",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:trace": "playwright show-trace test-results/**/trace.zip"
  }
}
```

Keep `test:e2e:smoke` small enough for pull requests. Run broader E2E suites
nightly or before release.

## Locator Priority

Prefer locators that describe what the user sees or operates:

1. `getByRole`
2. `getByLabel`
3. `getByText`
4. `getByTestId`
5. CSS / XPath only as a last resort

If a test needs a brittle CSS selector, treat it as feedback that the UI may
need better labels, roles, or test IDs.

## Authentication

Do not commit credentials or generated storage state.

Recommended pattern:

1. Create `tests/e2e/auth.setup.ts` in the target project.
2. Login with test-only data.
3. Save storage state under `playwright/.auth/user.json`.
4. Add that generated directory to the target project's `.gitignore`.
5. Reference the generated file from project-specific config.

The template config intentionally does not include a real storage state file.

## CI Artifacts

When Playwright fails in CI, keep artifacts for the repair loop:

- `playwright-report/`
- `test-results/`
- `trace.zip`
- screenshots and videos retained on failure

Before uploading traces in a sensitive application, confirm that screenshots,
network payloads, and local storage do not expose private values.

## AI Workflow

Use [`../prompts/e2e-test-creation.md`](../prompts/e2e-test-creation.md)
before writing a new E2E test. Use
[`../prompts/diagnostic-repair.md`](../prompts/diagnostic-repair.md) after a
failed run. The acceptance criteria must stay fixed between creation and repair.

## Sources

- Playwright Best Practices: https://playwright.dev/docs/best-practices
- Playwright Locators: https://playwright.dev/docs/locators
- Playwright CI: https://playwright.dev/docs/ci-intro
- Playwright Trace Viewer: https://playwright.dev/docs/trace-viewer
- Next.js Playwright guide: https://nextjs.org/docs/app/guides/testing/playwright
