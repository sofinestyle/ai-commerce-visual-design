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

Do not ask for missing creative details if they can be inferred from platform and product context.

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

## Design Intent

For each final image, create an internal design intent:

- ecommerce objective: fast product recognition and high click appeal
- product role: hero product must remain prominent
- scene role: support the buying story without overpowering the product
- copy role: short, readable, shopper-facing
- platform: apply marketplace style and output size
- negative constraints: no unrelated products, no collage unless requested, no product color changes, no text covering the product

## Generation Loop

Use this loop:

1. Build facts and references.
2. Call the text model to generate exactly 3 visible-copy candidates from product facts and design intent.
3. Validate and select the best copy candidate.
4. Build image prompt from design intent, references, and the selected copy.
5. Generate image.
6. Inspect result.
7. Retry if the result fails a critical check and time/model budget allows.
8. Save output. Create a standalone report only when the user explicitly asks for a report, detailed breakdown, prompt trace, or execution record.

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
