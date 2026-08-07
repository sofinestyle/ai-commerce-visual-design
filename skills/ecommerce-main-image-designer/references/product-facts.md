# Product Facts

## Required Facts Gate

Before design planning, copy generation, prompt generation, or image generation, validate:

1. Product-specific ecommerce images require:
   - exact SKU/product number
   - existing product record or repository data for that SKU
   - at least one verified usable product reference image for that SKU
2. Marketplace rules require:
   - platform/marketplace when layout, language, logo, background, output size, or copy rules affect the result
3. Claim-sensitive copy requires verified support before use:
   - promotion, discount, limited-time offer
   - price, savings, ranking, award
   - certification, guarantee, warranty
   - medical, education outcome, performance, durability, or better-sound claims
4. Generation requires:
   - image count
   - image role/type/theme

If any required item is missing, stop before design or generation and return `needs_input` with concise questions. Do not fill missing facts with assumptions, another SKU, generic product assets, or invented offers.

## Fact Sources

Read product facts before copy or image prompts:

- product record from the database or repository data
- SKU, name, brand, category, material, color, size
- accessories, packaging, supplier notes, selling points, description, tags
- brand assets and logo
- verified reference images for the exact SKU
- previous high-quality generated images for the same SKU only as style/layout memory

If a fact is absent, leave it absent. Do not invent.

Visible logos, wordmarks, trademarks, brand labels, or branded packaging may appear only when a verified `brand_logo` image asset is selected as a reference. If no usable logo file is found, default to no visible logo and no brand text; never synthesize a similar logo from the brand name.

## Creative Defaults

Creative defaults are allowed only after required facts pass:

- light/commercial lighting
- clean composition
- shopper-facing copy tone
- neutral or platform-appropriate background
- inferred copy language from platform

Creative defaults may never override verified product facts, platform rules, or verified reference images.

## Conflict Handling

Apply the skill's constraint priority:

1. Verified product facts.
2. Platform rules.
3. Verified reference images.
4. User-confirmed commercial facts or exact copy.
5. User creative direction.
6. AI inferred creative choices.

Examples:

- If the user asks for Amazon first-image marketing badges but platform rules forbid copy, do not add badges; suggest using a secondary image.
- If the user asks for a discount or limited-time claim without a verified offer, ask for the verified offer or remove the claim.
- If the user asks for accessories not present in product facts or references, ask for verification before showing them.
- If the user asks for visible logo, branded case/bag, or branded packaging, require the true `brand_logo` asset and the relevant accessory/packaging reference. If either reference is missing, omit the visible logo/branded detail or ask for the missing file when the user explicitly requires it.
- If the user asks for a different color than the verified SKU, treat it as a conflict unless they are explicitly requesting a new variant and accept the product-fact risk.
