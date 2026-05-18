# security-scan prompt

## Purpose

Use this prompt after `ai:check:secure` or another security scanner reports a
finding. It keeps the AI grounded in deterministic tool output and separates
security repair from normal feature test repair.

## When To Use

- `pnpm ai:check:secure` failed
- `semgrep scan --config auto` reported a finding
- CodeQL, dependency audit, or another SAST tool produced output that needs triage
- A reviewer wants a security-focused repair plan before accepting a PR

## Prompt

````text
You are reviewing security diagnostic output for AI-generated code.

## Redaction Rules

Before analysis, assume this diagnostic output has been redacted.

- Do not request raw credentials, private values, personal data, session values,
  or token-like values.
- If a value is needed for context, refer to it as [REDACTED].
- Do not infer or reconstruct redacted values.
- Keep file paths, rule IDs, line numbers, stack traces, and short code
  excerpts when they are necessary to understand the finding.

## Security Tool Output

Paste redacted output from one or more tools.

### Semgrep

Command:

```bash
pnpm ai:check:secure
# or
semgrep scan --config auto
```

Output:

(paste redacted Semgrep output)

### CodeQL

(paste redacted CodeQL / code scanning output if available)

### Dependency Audit

(paste redacted package manager audit output if available)

## Original Requirement

(paste the original requirement or SPEC)

## Acceptance Criteria

(paste the fixed acceptance criteria. Do not weaken them to avoid the finding.)

## Security Boundary

- User-controlled input:
- Authentication / authorization boundary:
- Data written or exposed:
- External service or network call:
- Files likely in scope:

## Rules

- Treat scanner output as evidence, not as an automatic verdict.
- Do not dismiss a finding without explaining why the flagged code path is not
  reachable, not exploitable, or already mitigated.
- Do not fix by deleting assertions, weakening tests, or changing acceptance
  criteria.
- Prefer code changes that remove the risky data flow.
- If suppression is the right answer, require reason, owner, and expiration.
- If evidence is insufficient, report "needs human security review" instead of
  guessing.

## Required Analysis

1. Identify each finding by tool, rule ID, severity, file, and line.
2. Explain the source -> sink path, or state that the path is not proven.
3. Classify each finding as:
   - fix now
   - false positive
   - suppress with owner and expiration
   - accept risk with explicit business justification
   - needs human security review
4. Propose the smallest safe patch.
5. List re-check commands.

## Output Format

### Findings

| id | tool | rule | severity | file | decision | reason |
|---|---|---|---|---|---|---|

### Evidence

- Source:
- Sink:
- Trust boundary:
- Existing mitigation:

### Repair Plan

- File scope:
- Patch:
- Tests to add or preserve:
- Acceptance criteria unchanged:

### Suppression Policy

Only fill this if suppressing:

- Rule:
- Reason:
- Owner:
- Expiration date:
- Follow-up issue:

### Re-check Commands

```bash
pnpm ai:check:secure
pnpm ai:check
```

### Human Review Notes

- Residual risk:
- What a human reviewer must verify:
````

## Usage

1. Run `pnpm ai:check:secure`.
2. Redact the output.
3. Paste the redacted output into this prompt.
4. Apply only the smallest security-relevant patch.
5. Re-run `pnpm ai:check:secure` and the relevant functional checks.

## Review Output

The final answer should make these points visible:

- whether each finding is fixed, suppressed, accepted, or escalated
- what evidence supports the decision
- which files changed
- which command proved the result
- which risk remains for human review

## Sources

- Semgrep CLI docs: https://semgrep.dev/docs/cli-reference
- Semgrep local CLI scans: https://semgrep.dev/docs/getting-started/cli
- GitHub CodeQL Action: https://github.com/github/codeql-action
- GitHub code scanning workflow options: https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options
