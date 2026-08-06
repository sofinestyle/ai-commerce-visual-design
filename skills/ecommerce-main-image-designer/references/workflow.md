# Workflow

## Structured Brief

Convert the user's short request into JSON-like working fields:

- platform: normalize Temu/TEMU/temu to `temu`
- sku: exact product number
- imageCount: requested final output count
- imageType: main image / lifestyle / detail / kit / back pattern / white background
- scenes: ordered list, one per intended image when possible
- subject: person/product/action
- textModel: requested prompt/copy model, default to `gpt-5.6-terra` if absent
- imageModel: requested image model, default to `gpt-image-2-03` if absent
- language: infer from platform; Temu product image copy should usually be English unless the user asks otherwise

Do not ask for missing creative details if they can be inferred from platform and product context. Do ask for missing required commercial/product facts.

## Required Facts Gate

Before design planning, copy generation, prompt generation, or image generation, validate the brief:

1. Required for any product-specific ecommerce image:
   - exact SKU/product number
   - existing product record or repository data for that SKU
   - at least one verified usable product reference image for that SKU
2. Required when marketplace rules affect layout, language, logo, background, or copy:
   - platform/marketplace, unless explicitly inferable from the request
3. Required for claim-sensitive copy:
   - verified promotion, discount, limited-time offer, price, ranking, certification, guarantee, or performance evidence before using those claims
4. Required for generation:
   - image count and image role/type; if absent, ask rather than silently choosing a marketplace role that changes compliance

If any required item is missing, stop before design or generation and return `needs_input` with the missing fields and concise questions. Do not fill missing product facts with assumptions, another SKU, generic product assets, or invented offers.

Creative defaults are allowed only after required facts pass:

- light/commercial lighting
- clean composition
- shopper-facing copy tone
- neutral or platform-appropriate background
- inferred copy language from platform

## Model Policy

Use this policy before copy generation or image generation:

1. If the user explicitly names a text model or image model, use the named model.
2. If the user does not mention models, use:
   - text model: `gpt-5.6-terra`
   - image model: `gpt-image-2-03`
3. If the user asks for model choices, discover current supported models from the project/platform before generating.
   - Prefer local APIs such as `/api/ai/models` when a dev server and auth are available.
   - Otherwise inspect local model config files such as `data/custom-models.json`, `data/model-capability-results.json`, `src/lib/modelDefaults.ts`, and provider capability lists.
   - Present text models and image models as numbered lists.
   - Ask the user to reply with the text-model number and image-model number.
   - Continue only after the user selects, unless the user says to use defaults.
4. If the requested or selected model fails, retry according to the copy/image failure policy and report the exact fallback.

## Platform Chain Policy

Use the ecommerce visual design platform's official generation chain for normal Codex image generation tasks:

1. Prefer `POST /api/ai-workspace/ecommerce-generate` when available.
2. Use platform product/media/project context.
3. Use platform copy-generation API/workflow for visible copy when available, unless the user has already confirmed exact visible copy from a design plan or explicit copy instruction.
4. Use platform prompt-generation API/workflow for image prompts when available.
5. Use platform image-generation API/workflow for final images.
6. Verify generated media and generation chain/history records exist when the platform supports them.

The unified endpoint request should include:

- `sku`, `platform`, `imageType`, `theme`, and `imageCount`
- `scene`, `subject`, `sellingAngle`, or `designIntent` when provided
- `brandLogoMode`: `auto`, `required`, or `forbidden`
- `copyMode`: `auto`, `user_confirmed`, or `none`
- `confirmedCopy` only when exact visible copy is user-approved
- `confirmedPlanItems` when a prior multi-row plan has been confirmed; each item should carry its own subject, scene, selling angle, design intent, and approved visible copy when available
- `promotion.verifiedOffer` before any promotion/limited-time/discount claim
- `textModel` and `imageModel` when user selected models
- `options.generationConcurrency` for confirmed multi-row generation; default to `2`, do not exceed `3`

Do not call provider APIs directly or save generated images only as files unless the user explicitly asks to bypass the platform chain, or the platform chain is unavailable and the user confirms fallback. If fallback is used, state that platform history may not include the result.

## Codex Unified Endpoint Protocol

In new Codex conversations, execute through the unified endpoint as a state machine:

1. Parse natural language into endpoint fields:
   - `sku`: product number/SKU exactly as written.
   - `platform`: Amazon, TEMU, SHEIN, 天猫, 抖店, or 独立站 when present.
   - `imageType`: use `主图` for marketplace main/listing images, `详情页` for detail-page images.
   - `theme`: use `首图`, `产品图`, `使用场景图`, or `详情页` based on the user wording and platform rule vocabulary.
   - `imageCount`: requested count.
   - `scene`, `subject`, `sellingAngle`, `brandLogoMode`, `copyMode`, `confirmedCopy`, `textModel`, and `imageModel` from explicit user instructions or prior confirmed plan items.
2. Choose mode:
   - `plan_only` when the user asks for a design plan, analysis, proposal, options, or different angles.
   - `generate` when the user directly asks to create/generate images and required facts are present.
   - After the user confirms a plan, generate from the confirmed `designPlan.items`, not from a generic count request when rows differ.
3. Call `POST /api/ai-workspace/ecommerce-generate` when the app server/auth path is available. If direct HTTP auth is unavailable in Codex, call the underlying platform service function with the same structured request.
4. Handle response status:
   - `needs_input`: ask only the returned questions; do not continue planning or generating.
   - `planned`: present `designPlan.items` as the design方案 table and wait for confirmation. Treat AI copy in the table as copy candidates until the user confirms or edits it.
   - `succeeded`: return output links, actual models, platform history/generation-chain visibility, and QA summary.
   - `failed` or thrown error: report the exact platform failure and stop unless the user approves a retry or fallback.
5. Confirmation rules:
   - If the plan row includes AI-generated copy candidates, ask the user to confirm, edit, or reject the copy before treating it as final visible copy.
   - If the user confirms exact visible copy, generate that row with `copyMode: "user_confirmed"` and `confirmedCopy`.
   - If the user confirms only subject, scene, or selling direction, generate that row with `copyMode: "auto"`.
   - Preserve each row's scene, subject, selling angle, and logo mode in the generation request.
   - For two or more confirmed rows, call the endpoint once with `confirmedPlanItems` instead of sending separate sequential requests. Use `options.generationConcurrency: 2` by default; use `3` only for faster batches when provider/platform load is acceptable.

Do not write temporary platform-chain scripts for normal tasks once this endpoint/service is available.

Example model-choice prompt:

```text
当前可用文字模型：
1. gpt-5.6-terra（默认）
2. gpt-5.6-sol
3. gpt-5.5

当前可用生图模型：
1. gpt-image-2-03（默认）
2. gpt-image-2
3. gemini-3-pro-image

请回复：文字模型序号 + 生图模型序号，例如 `1, 1`。
```

## Product Context

Read product facts before copy or image prompts:

- For Prisma/SQLite projects, inspect the Product and Media tables for the SKU.
- Read tags for material, color, size, accessories, packaging, supplier notes, and selling points.
- Resolve brand name and brand assets.
- Find previous outputs for the same SKU to learn preferred visual direction, but treat AI outputs as style references, not product-fact references.

If a fact is absent, leave it absent. Do not invent.

If the SKU cannot be found, product data is empty, or no verified product image can be selected, stop and ask the user to correct the SKU or add product references.

## Brief Intent Examples

Handle compact user instructions as follows:

- `制作1张 亚马逊主图，产品编号 W102-BR。` -> enough to plan/generate if SKU and references exist; apply Amazon main-image rules.
- `制作1张产品图，产品编号 W102-BR，文案突出限时促销。` -> ask for platform and verified promotion details before design; do not invent limited-time copy.
- `制作1张天猫使用场景图，产品编号 W102-BR，不要有logo，在室内拉琴。` -> enough if SKU/references exist; set logo mode to forbidden.
- `制作3张主图，天猫使用，产品编号W102-BR，请从不同角度帮我分析如何设计。` -> use `plan_only` first; do not generate until the user confirms.
- `制作2张电商图片，要有logo。` -> ask for SKU/product number and platform/image role before design.

## Design Intent

For each final image, create an internal design intent:

- ecommerce objective: fast product recognition and high click appeal
- product role: hero product must remain prominent
- scene role: support the buying story without overpowering the product
- copy role: short, readable, shopper-facing
- platform: apply marketplace style and output size
- negative constraints: no unrelated products, no collage unless requested, no product color changes, no text covering the product

## Plan-Only Design Schemes

Use `mode: "plan_only"` when the user asks to "提供设计方案", "分析如何设计", "从不同角度设计", "先给方案", or similar planning language.

Plan-only flow:

1. Codex/platform reads product facts, platform rules, and reference image information.
2. Codex structures the design scheme: subject, scene, selling angle, reference roles, logo mode, and constraints.
3. If exact visible copy is absent, call the platform AI copy model to generate copy candidates and show them for user confirmation.
4. If exact visible copy is already provided, use it directly in the plan.
5. Do not generate the final five-section image prompt during plan-only. Generate final prompts only after the user confirms the plan/copy and asks to generate images.

The unified endpoint should return `designPlan.items`. Present those items to the user as a confirmation table with:

- image index
- image type/theme
- subject
- scene/background
- selling angle
- visible copy or copy direction
- reference roles
- logo mode
- whether user confirmation or missing facts are needed

For multi-image requests, each row should represent a distinct design angle whenever possible. Prefer angles such as product hero, material/detail value, complete set/accessory value, lifestyle usage, storage/carry convenience, or platform-specific trust/readability.

After the user confirms:

- If exact visible copy is confirmed or edited, call generation with `copyMode: "user_confirmed"` and the confirmed copy for each item.
- If only subject, scene, or selling direction is confirmed, call generation with `copyMode: "auto"` so the platform text model generates and selects copy.
- Generate from the confirmed plan items instead of one generic image-count request when the rows have distinct angles.
- For two or more confirmed plan items, send them in one unified endpoint request as `confirmedPlanItems` and allow the platform to run a controlled parallel batch. Keep the concurrency at `2` unless the user or platform context explicitly calls for `3`.

## Visible Copy Decision

Before image prompt generation, decide whether copy is user-approved or AI-generated:

1. Use confirmed user copy directly when both are true:
   - Codex or the user previously provided specific headline/subheadline/selling-point wording in the design plan or instruction.
   - The user confirms that plan/copy, or explicitly says to use that copy.
2. Do not treat a generic approval of subject, scene, image count, or selling angle as approval of exact visible wording.
3. If exact visible copy is absent or not confirmed, call the platform copy-generation chain to generate exactly 3 candidates and select the best one.
4. Pass the copy source into the prompt-generation request when possible:
   - `source: "user_confirmed"` for confirmed plan/user copy.
   - `source: "ai_candidate"` plus candidate id/model/score for platform-generated copy.

## Generation Loop

Use this loop:

1. Run the Required Facts Gate.
2. Build facts and references.
3. Resolve visible copy using the Visible Copy Decision rules above.
4. If AI copy is needed, call the platform copy-generation chain to generate exactly 3 visible-copy candidates from product facts and design intent, then validate and select the best copy candidate.
5. Call the platform prompt-generation chain to build the image prompt from design intent, references, and the selected copy.
6. Call the platform image-generation chain to generate the image.
7. Confirm generated media and generation chain/history records were created when the platform supports them.
8. Inspect result.
9. Retry through the platform chain if the result fails a critical check and time/model budget allows.
10. Create a standalone report only when the user explicitly asks for a report, detailed breakdown, prompt trace, or execution record.

## Quality Feedback Loop

When generated images reveal repeatable defects, route the fix back into the platform system first:

- packaging hallucination -> platform packaging-reference selection and prompt rules
- accessory mismatch or missing real accessory photos -> platform accessory-reference selection and verified-accessory constraints
- product scale/proportion errors -> platform prompt rules and QA checks for size/proportion
- weak visible copy -> platform copy-generation prompt and copy-quality checks

Use one-off Codex prompt patches only as a temporary fallback, not as the primary quality solution.

## Optional Reports

Do not write report files by default. If the user explicitly asks for a report, detailed step breakdown, prompt trace, or execution record, save a small task report near the generated outputs or in `tmp/<sku>/`:

- user brief
- structured brief
- product facts
- selected references
- all 3 text-model copy candidates, selected candidate, and fallback notes
- image prompts
- output paths
- QA notes

When no report is requested, keep this information in working context and include only the concise final summary the user needs.
