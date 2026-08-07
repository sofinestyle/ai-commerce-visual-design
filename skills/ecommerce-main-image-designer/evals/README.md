# Ecommerce Main Image Designer Evals

These evals define expected Codex skill behavior after the skill triggers. They are intended for regression review when editing:

- `SKILL.md`
- `references/*.md`
- `src/lib/ai-workspace/ecommerceGenerationOrchestrator.ts`
- platform copy, prompt, generation, or QA services

## How To Use

For each case in `eval-cases.json`:

1. Start a fresh Codex conversation with the user prompt.
2. Confirm the skill reads the expected reference files.
3. Inspect the structured request or final response.
4. Compare observed behavior with `expected.behavior`, `expected.request`, `expected.status`, and `expected.mode`.
5. Record pass/fail and notes.

Do not require actual paid image generation for cases whose expected behavior stops at `needs_input`, `planned`, conflict handling, or fallback reporting.

## Evidence To Capture

- selected reference files
- endpoint request payload
- endpoint status
- final user-facing response
- QA summary or retry/fallback notes when applicable

## Suggested Summary

```text
Skill Eval
Cases: 12
Passed: 12
Failed: 0
Skill Success Rate: 100%
Required Facts Accuracy: 100%
Platform Compliance Rate: 100%
Chain Usage Rate: 100%
```
