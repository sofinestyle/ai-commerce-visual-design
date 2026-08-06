# Reference Selection

## Priority Order

Prefer references in this order:

1. Final product photography for the exact SKU.
2. Cutout/white-background product images for the exact SKU.
3. Raw converted product photos for the exact SKU.
4. Brand assets for logo, packaging, accessories, and set layouts.
5. Prior AI-generated images for the exact SKU only as style or layout references.

Avoid using another SKU's product body unless the exact SKU lacks that view and the user approves or the shared asset is clearly a brand-level accessory.

If no verified product-body reference exists for the requested SKU, stop and ask the user to add/select product references. Do not generate a product-specific ecommerce main image from generic product knowledge alone.

## Theme Mapping

- Front/main product: front, side, detail, logo.
- Back pattern: back, detail, logo.
- Accessory kit/set: front, accessories, kit/set layout, logo.
- Lifestyle scene: front and side product references, logo, optionally one prior high-quality lifestyle output as style reference.
- Detail/craft: detail and back/front references.

## Selection Heuristics

- Prefer `status=final`.
- Prefer `source=product_photography` for product appearance.
- Prefer larger, clean images when model input supports them, but compress/convert for provider compatibility.
- For gpt-image edit endpoints, convert references to ordinary RGB JPG/PNG if needed.
- Use enough references to preserve product identity but not so many that the prompt becomes heavy or unstable.

## Style Memory

When the user says a previous image was better, locate that image if available and treat it as a style benchmark:

- composition
- copy density
- typography hierarchy
- product scale
- lighting
- scene realism

Do not copy mistakes, hallucinated facts, or wrong SKU appearance from style references.
