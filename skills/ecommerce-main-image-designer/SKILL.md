---
name: ecommerce-main-image-designer
description: Execute professional ecommerce main-image design tasks from short user prompts in Codex conversations. Use when the user asks to create, regenerate, improve, or QA marketplace product main images for platforms such as Temu, Amazon, Tmall, TikTok Shop, SHEIN, or independent stores, especially when the user provides only SKU/product number, platform, image count, scene/theme, subject, or desired selling angle and expects Codex to read product facts, choose reference images, write main-image copy, generate prompts, call image models, save outputs, and inspect quality without requiring a long design brief.
---

# Ecommerce Main Image Designer

## Goal

Turn a short ecommerce image request into a complete design execution inside Codex through the ecommerce visual design platform's official generation chain: product facts, reference image selection, design intent, visible copy, image prompt, generation, media registration, generation history, and quality review.

The user should be able to write a compact task such as:

```text
制作2张Temu主图使用场景图，产品编号 L301-GN。
场景：公园、音乐厅。
主体：小男孩演奏小提琴。
```

Do not ask the user to provide a professional prompt unless required commercial/product facts cannot be found locally.

Also support Excel task workflow commands:

```text
生成方案 VIS-0128
修改方案 VIS-0128
执行生图 VIS-0128
查看任务 VIS-0128
```

For these commands, read the workbook at `task/AI电商视觉生产管理系统_V3.2_最终精简版.xlsx` and follow `references/excel-task-workflow.md`. The workbook supplies the task variables for this run; product facts and generation capability still come only from the ecommerce visual design platform.

## Core Workflow

1. If the user command is one of the Excel workflow commands, follow `excel-task-workflow.md` first and use this skill's normal product, reference, prompt, generation, and QA rules as the execution engine.
2. Parse the user's compact request into a structured ecommerce brief.
3. Run the Required Facts Gate in `product-facts.md`; stop with `needs_input` before planning or generation when required facts are missing.
4. Read platform/product context and select exact-SKU references using `reference-selection.md`.
5. Choose endpoint mode:
   - planning/analysis/proposal language -> `plan_only`
   - direct create/generate language -> `generate`
   - confirmation after a plan -> generate from confirmed plan items
6. Resolve visible copy only when allowed and useful; use `copy.md` and `copy-candidate-protocol.md`.
7. Execute through the platform chain, inspect QA, and follow `quality-review.md` and `failure-recovery.md` for retry/fallback decisions.

Never ask the user to write a professional image prompt. Codex should translate short business intent into the platform's structured request.

## Platform Chain Policy

- Use the ecommerce visual design platform's official generation chain for normal image generation tasks from Codex.
- Prefer the unified Codex/platform endpoint when available: `POST /api/ai-workspace/ecommerce-generate`.
- Prefer the platform edit endpoint for localized second-pass modifications when available: `POST /api/ai-workspace/edit-image`.
- Treat the unified endpoint as the stable Codex agent contract. Convert user language into its structured request fields, call it, then follow its returned status instead of recreating platform logic in conversation.
- Do not call low-level image providers directly by default.
- Do not implement one-off generation scripts that call provider APIs directly for normal ecommerce image generation.
- Do not save generated images only as filesystem files when the platform can register them.
- The official chain should create platform-visible generation history, selected-reference records, prompt records, generated media records, and QA metadata when the platform supports them.
- If the unified endpoint returns `status: "needs_input"`, ask the user to provide the missing fields before design or generation.
- Direct provider calls are allowed only when the user explicitly asks to bypass the platform chain, or when the platform chain is unavailable and the user confirms fallback.
- If bypassing the platform chain, clearly state before generating that the result will not appear in platform history.
- If the platform chain fails, stop and report the exact failure unless the user explicitly approves a fallback path.

## Load References

Read only the relevant reference files:

- For Excel task commands (`生成方案 VIS-XXXX`, `修改方案 VIS-XXXX`, `执行生图 VIS-XXXX`, `查看任务 VIS-XXXX`), read [excel-task-workflow.md](references/excel-task-workflow.md) before all other workflow references.
- For every task, read [workflow.md](references/workflow.md).
- For every product-specific task, read [product-facts.md](references/product-facts.md).
- For visible copy tasks or text-model failures, read [copy.md](references/copy.md).
- Before generating visible copy, read [copy-candidate-protocol.md](references/copy-candidate-protocol.md).
- For selecting SKU/product references, read [reference-selection.md](references/reference-selection.md).
- For local image edits or second-pass modifications, read [local-revision.md](references/local-revision.md).
- For final inspection or retry decisions, read [quality-review.md](references/quality-review.md).
- For model/provider filtering, fallback, platform-chain failure, or safety wording issues, read [failure-recovery.md](references/failure-recovery.md).
- When updating this skill or checking request/response fields, read [field-alignment.md](references/field-alignment.md).

## Execution Rules

- Use the platform's current configured default models when the user does not specify models. The code single source of truth is `src/lib/modelDefaults.ts`.
- Use the user's requested models if explicitly provided; report exact failures and fallbacks.
- Use `confirmedPlanItems` for confirmed multi-row plans and default `options.generationConcurrency` to `2`, up to `3` only when speed is explicitly preferred.
- Handle endpoint statuses strictly: `needs_input`, `planned`, `succeeded`, `partial`; report thrown errors or failed batch items exactly.
- For `plan_only`, show a concise design-plan table and wait for confirmation; do not generate final image prompts.
- Do not create standalone reports unless the user explicitly asks for a report, detailed breakdown, prompt trace, or execution record.

## Constraint Priority

When instructions conflict, apply constraints in this order:

1. Verified product facts.
2. Platform rules.
3. Verified reference images.
4. User-confirmed commercial facts or exact copy.
5. User creative direction.
6. AI inferred creative choices.

## Final Response

Return:

- model names actually used
- output file links
- platform history/generation-chain visibility status when images were generated
- short QA summary
- any caveats, especially model fallback/filtering

Do not overwhelm the user with internal prompt dumps unless asked.
