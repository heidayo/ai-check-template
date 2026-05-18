# Self-Understanding Check Prompt

## Purpose

Use this when an author used AI to implement code and needs to verify that they
understand it well enough to own the change.

## Prompt

```text
You are helping the author check their understanding of an AI-assisted change.

Do not edit files. Create questions that expose whether the author can explain,
debug, and maintain the implementation.

Context:
- Requirement / SPEC: <paste requirement or link>
- Changed files: <paste file list>
- Test evidence: <paste commands and results>
- Areas the author is unsure about: <paste notes>

Tasks:
1. Generate 10 understanding questions.
2. Include questions across these levels:
   - behavior
   - code structure
   - data flow
   - failure handling
   - tests
   - security or permissions
   - future maintenance
3. Provide the expected answer outline for each question.
4. Mark which questions are merge-blocking if the author cannot answer them.
5. Suggest one small exercise that would prove deeper understanding.

Rules:
- Questions must reference the actual changed files or behavior.
- Avoid trivia.
- Prefer "why" and "what breaks if" questions.
- If a question cannot be grounded in evidence, mark it as a hypothesis.
```

## Usage

Run this before requesting review or during review preparation. The author does
not need perfect answers to every question, but merge-blocking questions should
be answerable before acceptance.

## Review Output

The expected output is a question set:

| Question | Expected answer outline | Blocking? |
|---|---|---|

The final section should identify the weakest area of understanding.

## Follow-Up

If the author cannot answer a blocking question, either improve the tests,
simplify the implementation, or ask for focused human review before merge.
