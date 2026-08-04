# Copy Candidate Protocol

## Requirement

Before generating an image, call the text model to generate exactly 3 ecommerce main-image copy candidates from:

- structured user brief
- product facts
- selected platform
- image type/theme
- design intent
- selected references, summarized by role

Use the skill's model policy. If the user did not specify a text model, use `gpt-5.6-terra`.

## Output Contract

Ask the text model to return strict JSON:

```json
{
  "candidates": [
    {
      "id": "solid-wood-material-story",
      "angle": "事实表达",
      "score": 92,
      "headline": "Solid Wood, Distinct Style",
      "subheadline": "Built with a spruce top, maple back, and yellow-green faux tiger-stripe finish.",
      "sellingPoints": [
        "Spruce top",
        "Maple back",
        "Ebony fittings and tailpiece"
      ],
      "positioning": "兼顾明确实木材质依据与特色外观的4/4小提琴",
      "evidence": [
        "面板：云杉",
        "背板：枫木",
        "配件及拉弦板：乌木",
        "黄绿色假虎纹油漆"
      ],
      "layoutInstruction": "将主标题与卖点放在商品外侧的有效留白区，避免遮挡商品主体和品牌 Logo。",
      "typographyInstruction": "Use bold, clean, mobile-readable sans-serif typography with a clear headline hierarchy.",
      "rationale": "直接传达已验证材质，建立可感知的材质价值。"
    }
  ],
  "selectedCandidateId": "solid-wood-material-story",
  "selectionReason": "最高分且产品事实、场景意图和主图可读性最平衡。"
}
```

## Candidate Angles

Generate 3 distinct angles. Choose angles that fit the product and image theme:

- `solid-wood-material-story`: verified solid-wood/material value
- `full-size-playable-violin`: 4/4 full-size playable instrument
- `material-detail-value`: spruce, maple, ebony, strings, fittings
- `distinct-yellow-green-style`: yellow-green faux tiger-stripe appearance
- `complete-practice-set`: complete accessories or kit value
- `daily-practice-confidence`: learning confidence and daily practice
- `stage-or-scene-ready`: recital, stage, or lifestyle scene readiness

For scene images, at least 2 selling points must be product facts, not scene mood.

## Scoring

Each candidate must include a 0-100 score. Score with:

- Product fact accuracy: 30
- Ecommerce conversion strength: 20
- Mobile readability: 15
- Theme/scene fit: 15
- Avoids generic parameter dumping: 10
- Layout feasibility: 10

Prefer candidates scoring 88 or higher. If all 3 score below 85, retry once with a stricter copy request when feasible.

## Selection Rules

Select the highest-scoring candidate unless it:

- contains unverified hard claims
- conflicts with product facts
- is too generic for a marketplace main image
- is too long for visible image text
- depends on internal layout instructions as visible copy

Separate visible copy from prompt instructions:

- Use `headline`, `subheadline`, and `sellingPoints` as visible image text.
- Use `layoutInstruction`, `typographyInstruction`, `positioning`, `evidence`, and `rationale` only as internal prompt/report context.

## Report

Include all 3 candidates in the task report, not only the selected one.
