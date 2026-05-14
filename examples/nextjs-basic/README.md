# Next.js Basic Example

This example shows how `ai-check-template` turns an AI-generated endpoint from
"looks done" into "verified against acceptance criteria."

The runnable app is the **After** state. The intentionally flawed **Before** state
is documented in [`docs/before.md`](./docs/before.md) so it cannot be copied by
accident.

## What it demonstrates

- A small Next.js App Router project
- A public user profile API route at `GET /api/users/[id]`
- Unit tests that verify the public API contract
- An `ai:check` script that combines typecheck, tests, and build
- A Before / After narrative tied to Formal Name Match

## Run it

```bash
cd examples/nextjs-basic
pnpm install
pnpm ai:check
pnpm dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/users/ada`
- `http://localhost:3000/api/users/ada`

## Acceptance criteria

| ID | Requirement | Verification |
|---|---|---|
| AC-01 | Known user returns only public fields | `tests/users.test.ts` |
| AC-02 | Invalid user id is rejected before lookup | `tests/users.test.ts`, API route status 400 |
| AC-03 | Unknown user returns not found | `tests/users.test.ts`, API route status 404 |
| AC-04 | `ai:check` runs the full local quality gate | `package.json` scripts |

## Files

| Path | Purpose |
|---|---|
| `app/page.tsx` | Example landing page with links to user pages and API |
| `app/users/[id]/page.tsx` | User profile page that renders public fields |
| `app/api/users/[id]/route.ts` | Public API route with 400 / 404 handling |
| `lib/users.ts` | In-memory fixture and public projection contract |
| `tests/users.test.ts` | Unit tests for public fields and error cases |
| `docs/before.md` | What the unverified AI output looked like |
| `docs/after.md` | How the verified implementation maps AC to tests |

## Why this is small

The point is not to teach Next.js. The point is to make the verification loop
visible:

```
Requirement → Acceptance Criteria → Test Design → AI Implementation → Quality Check → Repair → Re-check → Human Acceptance
```

The example intentionally avoids a database, authentication provider, browser E2E,
or external API. Those belong in larger examples.
