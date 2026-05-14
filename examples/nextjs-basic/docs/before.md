# Before: unverified AI output

This is the kind of implementation an AI coding tool might produce after a short
instruction such as:

> Add a user profile API route for `/api/users/[id]`.

Do not copy this snippet. It is intentionally flawed.

```ts
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = users.find((item) => item.id === params.id);
  return Response.json(user);
}
```

## Failure 1: no acceptance criteria

The implementation never states what a valid response is. Without a declared
contract, reviewers cannot tell whether returning the whole record is acceptable.

The missing questions are:

- Which fields are public?
- What happens for an unknown id?
- What happens for an invalid id format?

## Failure 2: private fields cross the trust boundary

The backing record contains fields that are not part of a public profile:

- `email`
- `role`
- `internalNotes`
- `createdAt`

Returning the whole record would expose those fields. This is exactly the kind of
mistake that can pass a quick visual review because the happy path still works.

## Failure 3: unknown users are treated like success

If the id does not exist, the route returns `undefined` with a success-shaped
response. A caller cannot distinguish "not found" from "server returned an empty
record by mistake."

The verified behavior should be `404`.

## Failure 4: invalid ids are not rejected

The route accepts any string as an id. A basic public endpoint should reject
unexpected id shapes before lookup.

The verified behavior should be `400`.

## Why Formal Name Match catches this

Formal Name Match requires the "Name" to be declared before the implementation:

- public fields only
- invalid id => 400
- unknown id => 404

Then the "Form" is measured after implementation through tests and `ai:check`.
The AI's natural-language claim that the route is done is not evidence.
