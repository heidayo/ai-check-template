# AI Code Understanding Worksheet

Use this worksheet after AI-assisted implementation and before human acceptance.
The goal is not to prove that the code runs. The goal is to prove that a human
can explain, critique, and maintain the change.

## Change

- Branch / PR:
- Files changed:
- Feature or bug:
- Requirement / SPEC:

## AI Request

Record the prompt or task that produced the change.

- Tool used:
- Original request:
- Constraints given to the AI:
- Files or APIs the AI was allowed to touch:

## Adopted Design

Explain the design that was kept.

- Main responsibility of the changed code:
- Data flow:
- State ownership:
- Error handling:
- Trust boundaries:
- Why this design was accepted:

## Alternatives Considered

List at least two alternatives, including "do less" when possible.

| Alternative | Why it was not chosen | Risk if we were wrong |
|---|---|---|
|  |  |  |
|  |  |  |

## API and Type Choices

- Why these functions, hooks, routes, or modules?
- Why these types or schemas?
- What assumptions are encoded in names?
- What would break if the input shape changes?

## Fragile Areas

Call out places that are likely to fail later.

- Coupling:
- Async / race conditions:
- Auth or permissions:
- Caching or invalidation:
- External services:
- Browser or device differences:

## Tests and Evidence

- Tests added:
- Tests updated:
- Commands run:
- Screenshots / traces / logs reviewed:
- Known gaps:

## Reimplementation Check

Answer before merging.

- [ ] I can explain the change without reading the AI transcript.
- [ ] I can name the highest-risk line or module.
- [ ] I can describe how I would reimplement the change without AI.
- [ ] I can explain why each new test would fail before the fix.
- [ ] I can identify at least one future refactor or simplification.

## Reviewer Questions

Ask these when the worksheet exposes uncertainty.

1. What behavior is guaranteed by tests rather than by intent?
2. Which part of this implementation would be hardest to debug in production?
3. What input, role, or state was not tested?
4. What did the AI assume that the product did not explicitly specify?
5. What is the smallest rollback that removes the risk?

## Follow-Up

- Required before merge:
- Safe to defer:
- Owner:
