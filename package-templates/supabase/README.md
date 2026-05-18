# Supabase RLS Testing Templates

> Manual-copy templates for projects using Supabase Row Level Security.
> They are examples, not generated migrations. Replace every placeholder with
> your own table, column, role, and test data.

## Purpose

RLS bugs are trust-boundary bugs. A UI that hides a button is not enough. These
templates split verification into three layers:

| Layer | Template | What it proves |
|---|---|---|
| DB policy | `tests/database/rls_policy.test.sql` | PostgreSQL policy allows and denies rows correctly |
| API integration | `tests/rls/rls.integration.test.ts` | Supabase client calls behave correctly with real user sessions |
| Auth E2E | `tests/e2e/magic-link.spec.ts` | Magic Link flow works against local mail capture |

Use these with the `supabase-rls` addon profile and
[`../prompts/rls-permission.md`](../prompts/rls-permission.md).

## Commands

Recommended target-project scripts:

```json
{
  "scripts": {
    "test:db": "supabase test db",
    "test:integration:rls": "vitest run --dir tests/rls",
    "test:e2e:auth": "playwright test tests/e2e/magic-link.spec.ts"
  }
}
```

Run locally:

```bash
supabase start
pnpm test:db
pnpm test:integration:rls
pnpm test:e2e:auth
```

`supabase test db` is the Supabase CLI pgTAP command. Confirm your installed
CLI version if your local command output differs.

## Copy Paths

```bash
mkdir -p supabase/tests/database tests/rls tests/e2e
cp package-templates/supabase/tests/database/rls_policy.test.sql supabase/tests/database/rls_policy.test.sql
cp package-templates/supabase/tests/rls/rls.integration.test.ts tests/rls/rls.integration.test.ts
cp package-templates/supabase/tests/e2e/magic-link.spec.ts tests/e2e/magic-link.spec.ts
```

## Replacement Checklist

Replace these placeholders before running:

- `app_items`: table under RLS
- `owner_id`: owner column
- `tenant_id`: tenant or organization column, if your app uses one
- `00000000-0000-0000-0000-000000000001`: user A test id
- `00000000-0000-0000-0000-000000000002`: user B test id
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- test user session environment values
- local mail capture endpoint

Do not use `service_role` or another privileged server key for RLS correctness
tests. It can bypass RLS and make a broken policy look safe.

## Local Mail Capture

Supabase local development exposes a mail capture service for auth flows. The
name and API can vary by CLI version, so this template uses:

```bash
SUPABASE_LOCAL_MAIL_API_URL=http://127.0.0.1:54324/api/v1
```

Adjust the endpoint to match your local stack. Keep this local-only; do not use
production inboxes in automated tests.

## AI Workflow

1. Use `rls-permission.md` to build the role x resource x action matrix.
2. Convert each OK / NG cell into a pgTAP or integration test.
3. Run `supabase test db` and `pnpm test:integration:rls`.
4. If a check fails, use `diagnostic-repair.md` with redacted output.
5. Do not weaken the permission matrix to make the test pass.

## Sources

- Supabase Testing Overview: https://supabase.com/docs/guides/local-development/testing/overview
- Supabase pgTAP docs: https://supabase.com/docs/guides/database/extensions/pgtap
- Supabase CLI testing and linting: https://supabase.com/docs/guides/local-development/cli/testing-and-linting
- pgTAP official docs: https://pgtap.org/documentation.html
