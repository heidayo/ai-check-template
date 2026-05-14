# After: verified implementation

The runnable app implements the repaired version of the same feature. The key
change is that the public contract is explicit and testable.

## Acceptance criteria

| ID | Criteria | Evidence |
|---|---|---|
| AC-01 | A known user returns only `id`, `displayName`, `handle`, and `bio` | `tests/users.test.ts` checks the exact response shape |
| AC-02 | An invalid id is rejected before lookup | `isValidUserId` test + API route status 400 |
| AC-03 | An unknown id returns not found | `hasUser` / `getPublicUser` test + API route status 404 |
| AC-04 | The local quality gate runs typecheck, unit tests, and build | `pnpm ai:check` |

## Test mapping

| Risk | Test |
|---|---|
| Private fields leak into public response | `returns only public fields for known users` |
| Invalid id reaches lookup | `rejects invalid ids before lookup` |
| Unknown user looks like success | `detects unknown users` |
| Future record fields leak by accident | `keeps the allowlist explicit when records gain private fields` |

## Implementation choices

The important pattern is the allowlist projection:

```ts
export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    bio: user.bio
  };
}
```

This is deliberately more explicit than returning a spread object with fields
removed. If a future private field is added to `UserRecord`, it does not
automatically become public.

## Quality loop

Run:

```bash
pnpm ai:check
```

That command runs:

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm build`

The After state is accepted only when the checks pass and the tests demonstrate
the original acceptance criteria.
