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

Each template keeps its schema-dependent values in a single "設定変数" block at
the top of the file. Edit that one block, or inject the matching environment
variable — you no longer have to find-replace the same name across the body.

| Template | Variable | env var | Meaning |
|---|---|---|---|
| `rls_policy.test.sql` | `\set table_name` | `psql -v table_name=<name>` | table under RLS |
| `rls_policy.test.sql` | `\set owner_column` | `psql -v owner_column=<name>` | owner column |
| `rls.integration.test.ts` | `const TABLE` | `RLS_TABLE=<name>` | table under RLS |
| `rls.integration.test.ts` | `const OWNER` | `RLS_OWNER_COLUMN=<name>` | owner column |
| `magic-link.spec.ts` | `const mailApiUrl` | `SUPABASE_LOCAL_MAIL_API_URL=<url>` | local mail capture endpoint |
| `magic-link.spec.ts` | `const testEmail` | `SUPABASE_TEST_EMAIL=<email>` | test email |

Two ways to set them:

1. **Edit the block** — open the file and change the default next to each
   variable (`\set table_name app_items`, `const TABLE = ... ?? "app_items"`).
2. **Inject an env var** — leave the defaults and pass the value at run time
   (`psql -v table_name=orders ...`, `RLS_TABLE=orders vitest run ...`,
   `SUPABASE_TEST_EMAIL=me@example.test playwright test ...`). Unset env falls
   back to the in-file default, so behavior is unchanged when nothing is passed.

Connection and identity values are already env-driven and stay that way:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, test user session values, and the test
user ids. Replace the seed UUIDs
(`00000000-0000-0000-0000-000000000001` / `...0002`) with deterministic users
from your local seed data.

### SQL identifier injection

`rls_policy.test.sql` builds each test query with `format()` and the `%I`
(identifier) placeholder, e.g.
`format($q$ select id from %I where %I = ... $q$, :'table_name', :'owner_column')`.

- Use `:'var'` (single quotes) to pass the value: psql expands it to a quoted
  string literal, and `format('%I', ...)` renders it as a properly quoted
  identifier, so a reserved word or a space in a table/column name will not
  break the query.
- Do **not** expect `:"var"` (double quotes) or `:'var'` to interpolate *inside*
  a dollar-quoted string (`$$...$$`): psql does not perform variable
  interpolation within quoted SQL literals, so the variables are passed to
  `format()` from outside the quoted template text.

Do not use `service_role` or another privileged server key for RLS correctness
tests. It can bypass RLS and make a broken policy look safe.

> Manual-copy note: these templates are copied by hand, not managed by the CLI.
> Changing a template here does **not** flow to copies you already made — the
> new form only applies to the next fresh copy. Re-copy a file if you want the
> updated template.

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
