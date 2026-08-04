---
name: ecommerce-main-image-designer
description: Execute professional ecommerce main-image design tasks from short user prompts in Codex conversations. Use when the user asks to create, regenerate, improve, or QA marketplace product main images for platforms such as Temu, Amazon, Tmall, TikTok Shop, SHEIN, or independent stores, especially when the user provides only SKU/product number, platform, image count, scene/theme, subject, or desired selling angle and expects Codex to read product facts, choose reference images, write main-image copy, generate prompts, call image models, save outputs, and inspect quality without requiring a long design brief.
---

# Ecommerce Main Image Designer

## Goal

Turn a short ecommerce image request into a complete design execution inside Codex: product facts, reference image selection, design intent, visible copy, image prompt, generation, media registration, and quality review.

The user should be able to write a compact task such as:

```text
制作2张Temu主图使用场景图，产品编号 L301-GN。
场景：公园、音乐厅。
主体：小男孩演奏小提琴。
```

Do not ask the user to provide a professional prompt unless required information cannot be found locally.

## Mandatory Workflow

1. Parse the short request into a structured brief:
   - platform
   - SKU/product number
   - image count
   - image type/theme
   - scenes or selling angles
   - subject/action
   - text model and image model, using the model policy below
2. Read local platform/product context before generating:
   - product record from the database or repository data
   - product tags, material, color, size, packaging, accessories, selling points
   - brand assets and logo
   - existing reference images and previous high-quality generated images for the same SKU
3. Select reference images automatically:
   - choose product photos that match the requested theme
   - choose brand logo when visible logo is appropriate
   - choose accessory/set references only when the theme needs them
   - prefer verified final product photography over prior AI output unless using prior output as a style reference
4. Generate design intent internally:
   - platform-specific ecommerce objective
   - composition
   - product prominence
   - scene/background
   - copy placement
   - negative constraints
5. Generate exactly 3 visible-copy candidates using the requested text model when available.
   - Base the candidates on product facts and design intent.
   - Include candidate angle, headline, subheadline, selling points, positioning, evidence, score, and rationale.
   - Translate product facts into shopper benefits for visible selling points; keep raw facts in evidence instead of using them as parameter-only badges.
   - Select the best candidate before image prompt generation.
   - If the text model is blocked, retry with a safer but equally commercial request.
   - Do not collapse into bland parameter-only copy after a filter event.
6. Generate image prompts for the requested image model.
   - Keep the user prompt simple; put professional prompting details inside Codex execution.
   - Use reference images through the platform/provider path when available.
7. Generate enough candidates to satisfy quality.
   - For high-risk scenes, produce at least one candidate per final image and retry failed/weak candidates when feasible.
8. Inspect outputs before final response.
   - Check image dimensions, file existence, platform fit, product accuracy, scene match, visible copy, composition, and obvious artifacts.
   - Register or save images to the relevant project/media location when the local platform supports it.

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
- Before image generation, call the text model to generate exactly 3 main-image copy candidates and choose one. Do not generate images from a single unranked copy draft.
- Keep product facts factual. Use emotional benefits and shopper language, but do not invent certifications, rankings, guarantees, medical claims, prices, or unverified performance claims.
- Preserve SKU-specific product appearance over generic scene aesthetics.
- For marketplace main images, prioritize product recognizability, clean composition, and readable copy over cinematic atmosphere.
- If the requested subject includes children, use safe phrasing such as "school-age student musician" or "young student player" in internal prompts unless the user requires exact wording. Avoid unnecessary age details.
- Do not let safety/filter recovery degrade copy quality. Replace risky phrasing with safe shopper-value phrasing.
- Save a concise report with: product facts used, references used, copy, prompts, models, outputs, and QA notes.

## Final Response

Return:

- model names actually used
- output file links
- short QA summary
- any caveats, especially model fallback/filtering

Do not overwhelm the user with internal prompt dumps unless asked.
