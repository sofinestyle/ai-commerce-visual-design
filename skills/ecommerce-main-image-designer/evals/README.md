# Ecommerce Main Image Designer Evals

These evals define expected Codex skill behavior after the skill triggers. They are intended for automated regression review when editing:

- `SKILL.md`
- `references/*.md`
- `src/lib/ai-workspace/ecommerceGenerationOrchestrator.ts`
- platform copy, prompt, generation, or QA services

## Automated Runner

Run:

```bash
npm run eval:ecommerce-skill
```

The P0 runner:

1. Reads `eval-cases.json`.
2. Loads fixed fixtures from `fixtures/`.
3. Builds deterministic contract-level actual results.
4. Compares `status`, `mode`, `endpoint`, `missingFields`, `request`, and `requiredReferences`.
5. Writes `reports/latest.json` and `reports/latest.md`.
6. Returns non-zero exit code when any case fails or pass criteria are not met.

Do not require actual paid image generation for cases whose expected behavior stops at `needs_input`, `planned`, conflict handling, or fallback reporting.

Generated files in `reports/` are ignored by git.

## Manual Review

For behavior that cannot be proven by the P0 deterministic runner, capture:

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
