# Workflow

## Structured Brief

Convert the user's short request into JSON-like working fields:

- platform: normalize Temu/TEMU/temu to `temu`
- sku: exact product number
- imageCount: requested final output count
- imageType: main image / lifestyle / detail / kit / back pattern / white background
- scenes: ordered list, one per intended image when possible
- subject: person/product/action
- textModel: requested prompt/copy model, default to project setting if absent
- imageModel: requested image model, default to project setting if absent
- language: infer from platform; Temu product image copy should usually be English unless the user asks otherwise

Do not ask for missing creative details if they can be inferred from platform and product context.

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
2. Generate or refine visible copy.
3. Build image prompt from design intent, references, and copy.
4. Generate image.
5. Inspect result.
6. Retry if the result fails a critical check and time/model budget allows.
7. Save output and report.

## Reports

Save a small task report near the generated outputs or in `tmp/<sku>/`:

- user brief
- structured brief
- product facts
- selected references
- text model result and fallback notes
- image prompts
- output paths
- QA notes

This report helps future Codex conversations recover context without relying on chat history.
