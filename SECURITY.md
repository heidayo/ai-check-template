# Security Policy

## Supported versions

`ai-check-template` is currently pre-1.0 and distributed as copy-and-adapt
templates.

| Version | Supported |
|---|---|
| `main` | Yes |
| Latest tagged release | Yes, after v0.1.0 is published |
| Older commits or forks | No |

Until the first release, security fixes are applied to `main`. After v0.1.0,
maintainers may publish patch releases when a vulnerability affects released
templates.

## Reporting a vulnerability

Please do not open a public Issue for a suspected vulnerability.

Use GitHub Security Advisories as the primary private reporting channel:

1. Open the repository on GitHub.
2. Go to **Security**.
3. Choose **Report a vulnerability**.
4. Include a clear description, affected files, reproduction steps, and expected
   impact.

If GitHub Security Advisories are unavailable, open a minimal public Issue that
asks maintainers to enable private security reporting. Do not include exploit
details in that public Issue.

## Response SLO

Maintainers aim to follow this response schedule:

| Step | Target |
|---|---|
| Acknowledge the report | Within 3 business days |
| Initial triage | Within 7 business days |
| Fix plan for confirmed issues | Within 14 business days |
| Public disclosure | After a fix or mitigation is available |

These are targets, not guarantees. This project is currently maintained as a
small OSS project, so complex reports may take longer.

## What to include

Helpful reports include:

- The affected template, script, prompt, profile, or documentation path.
- The expected security boundary.
- How an attacker or accidental misuse could trigger the issue.
- Any suggested mitigation.

## Out of scope

The following are usually outside this repository's security scope:

- Vulnerabilities in third-party tools referenced by the templates.
- Issues that only affect a downstream project after substantial local changes.
- Social engineering, phishing, or physical attacks.
- Reports without a concrete security impact.

Please report vulnerabilities in third-party dependencies to their upstream
maintainers.

## Disclosure

When a report is confirmed, maintainers will coordinate disclosure through GitHub
Security Advisories where possible. Public notes should describe impact and
mitigation without exposing unnecessary exploit detail.
