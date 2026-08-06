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

## Mandatory Workflow

1. Parse the short request into a structured brief:
   - platform
   - SKU/product number
   - image count
   - image type/theme
   - scenes or selling angles
   - subject/action
   - text model and image model, using the model policy below
2. Validate required facts before planning or generating:
   - Never invent or default missing product facts. If SKU/product number is absent, ambiguous, not found, or has no usable verified product reference, stop and ask the user to provide or correct it.
   - Do not default platform when marketplace rules affect the output. If platform is absent and cannot be safely inferred from the user request, ask the user to choose one before design or generation.
   - If the user requests promotion, discount, limited-time, ranking, certification, guarantee, or price language without verified supporting facts, ask for the verified offer/fact or remove that claim.
   - Creative details such as lighting, composition, or neutral background may be inferred from product and platform context; commercial facts may not.
3. Read local platform/product context before generating:
   - product record from the database or repository data
   - product tags, material, color, size, packaging, accessories, selling points
   - brand assets and logo
   - existing reference images and previous high-quality generated images for the same SKU
4. Select reference images automatically:
   - choose product photos that match the requested theme
   - choose brand logo when visible logo is appropriate
   - choose accessory/set references only when the theme needs them
   - prefer verified final product photography over prior AI output unless using prior output as a style reference
5. Generate design intent internally:
   - platform-specific ecommerce objective
   - composition
   - product prominence
   - scene/background
   - copy placement
   - negative constraints
   - if the user asks to analyze, plan, propose, or design from different angles, use `mode: "plan_only"` first and return a confirmable design plan before generation
6. Resolve visible copy before image prompt generation.
   - If the user requested a design plan that included specific visible copy, and then confirms that plan or explicitly asks to use that copy, treat the confirmed copy as approved user copy and use it directly.
   - If the user only confirms the subject, scene, selling angle, or design direction without locking exact wording, generate exactly 3 visible-copy candidates using the requested text model when available.
   - If no specific visible copy is provided or confirmed, generate exactly 3 visible-copy candidates using the requested text model when available.
   - Base AI copy candidates on product facts and design intent.
   - Include candidate angle, headline, subheadline, selling points, positioning, evidence, score, and rationale.
   - Translate product facts into shopper benefits for visible selling points; keep raw facts in evidence instead of using them as parameter-only badges.
   - Select the best AI candidate before image prompt generation.
   - If the text model is blocked, retry with a safer but equally commercial request.
   - Do not collapse into bland parameter-only copy after a filter event.
7. Generate image prompts through the platform prompt-generation chain when available.
   - Keep the user prompt simple; put professional prompting details inside platform/Codex execution.
   - Use selected reference images through the official platform request path.
8. Generate images through the platform image-generation chain.
   - Call the ecommerce visual design platform's official generation API/workflow by default.
   - Ensure generated media, selected references, prompt records, generation chain/history, and QA metadata are registered when the platform supports them.
   - For high-risk scenes, produce at least one candidate per final image and retry failed/weak candidates through the platform chain when feasible.
9. Inspect outputs before final response.
   - Check image dimensions, file existence, platform fit, product accuracy, scene match, visible copy, composition, and obvious artifacts.
   - Confirm the output is visible in platform history/generation chain when the task generated images through Codex.
   - Do not create a standalone report file unless the user explicitly asks for a report, detailed step breakdown, prompt trace, or execution record.

## Platform Chain Policy

- Use the ecommerce visual design platform's official generation chain for normal image generation tasks from Codex.
- Prefer the unified Codex/platform endpoint when available: `POST /api/ai-workspace/ecommerce-generate`.
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

- For every task, read [workflow.md](references/workflow.md).
- For visible copy tasks or text-model failures, read [copy.md](references/copy.md).
- Before generating visible copy, read [copy-candidate-protocol.md](references/copy-candidate-protocol.md).
- For selecting SKU/product references, read [reference-selection.md](references/reference-selection.md).
- For final inspection or retry decisions, read [quality-review.md](references/quality-review.md).

## Execution Rules

- Default to text model `gpt-5.6-terra` and image model `gpt-image-2-03` when the user does not specify models.
- Use the user's requested models if explicitly provided. If unavailable or blocked, report the exact failure and the fallback used.
- If the user asks to choose models, inspect the current system/project-supported text and image models, list them by numbered options, and ask the user to reply with option numbers. Do not ask the user to type raw model IDs unless model discovery fails.
- If required facts are missing, ask concise follow-up questions before design or generation. Do not generate placeholder products, generic accessories, imagined promotions, or default marketplace facts.
- When the unified ecommerce endpoint is available, pass the structured brief to it instead of creating temporary platform-chain scripts.
- Interpret user intent into endpoint mode: planning/analysis language -> `plan_only`; direct create/generate language -> `generate`; confirmation after a plan -> generate from the confirmed plan items.
- Handle endpoint statuses strictly: `needs_input` -> ask only the missing questions; `planned` -> show the design plan table and wait for confirmation; `succeeded` -> return image links, model names, history visibility, and QA summary; `failed` -> report the exact failure.
- For `plan_only`, return the endpoint's `designPlan.items` as a concise table with one row per intended image. Include subject, scene, selling angle, visible copy, reference roles, logo mode, and missing fact notes if any.
- When the user confirms a design plan, generate from the confirmed plan items. If exact visible copy is confirmed, use `copyMode: "user_confirmed"`; if only angles or scenes are confirmed, use `copyMode: "auto"`.
- Before image generation, use confirmed user-approved copy directly when the user has confirmed exact visible wording. Otherwise call the text model to generate exactly 3 main-image copy candidates and choose one. Do not generate images from a single unranked unconfirmed copy draft.
- For actual image generation, prefer platform APIs such as copy generation, prompt generation, and workspace image generation over direct provider calls.
- Keep product facts factual. Use emotional benefits and shopper language, but do not invent certifications, rankings, guarantees, medical claims, prices, or unverified performance claims.
- Preserve SKU-specific product appearance over generic scene aesthetics.
- For marketplace main images, prioritize product recognizability, clean composition, and readable copy over cinematic atmosphere.
- If the requested subject includes children, use safe phrasing such as "school-age student musician" or "young student player" in internal prompts unless the user requires exact wording. Avoid unnecessary age details.
- Do not let safety/filter recovery degrade copy quality. Replace risky phrasing with safe shopper-value phrasing.
- When generated output reveals systematic issues such as packaging hallucination, accessory mismatch, instrument scale errors, or weak copy, prefer proposing improvements to platform rules/code over compensating only with one-off Codex prompts.
- Do not save extra report files by default. Save a concise report only when the user explicitly asks for a report, detailed breakdown, prompt trace, or execution record.

## Final Response

Return:

- model names actually used
- output file links
- platform history/generation-chain visibility status when images were generated
- short QA summary
- any caveats, especially model fallback/filtering

Do not overwhelm the user with internal prompt dumps unless asked.
