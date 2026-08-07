# Copy Candidate Protocol

## Requirement

Before generating an image, call the text model to generate exactly 3 ecommerce main-image copy candidates only when all of these are true:

- Visible copy is allowed by platform rules.
- The image role benefits from visible copy.
- The user has not confirmed exact visible copy from a design plan or explicit copy instruction.
- `copyMode` is not `none`.

Use confirmed copy directly when both are true:

- Codex or the user already supplied exact headline/subheadline/selling-point wording.
- The user confirmed that design plan/copy, or explicitly said to use it.

When exact visible copy is absent or only a selling direction is confirmed, generate exactly 3 ecommerce main-image copy candidates from:

- structured user brief
- product facts
- selected platform
- image type/theme
- design intent
- selected references, summarized by role

Use the skill's model policy. If the user did not specify a text model, use the platform's current configured default prompt model.

## Output Contract

Ask the text model to return strict JSON:

```json
{
  "candidates": [
    {
      "id": "complete-practice-set",
      "angle": "完整套装价值",
      "score": 92,
      "headline": "Complete Violin Kit",
      "subheadline": "Everything needed for daily practice",
      "sellingPoints": [
        "All Essentials Included",
        "Start Practice Faster",
        "More Value in One Box"
      ],
      "positioning": "用完整套装降低新手购买和练习准备成本，突出一套配齐的高性价比。",
      "evidence": [
        "4/4 size",
        "triangle violin case",
        "bridge, strings, 2 rosins, cleaning cloth, tuner, fingerboard sticker, mute, shoulder rest, manual"
      ],
      "layoutInstruction": "将主标题与卖点放在商品外侧的有效留白区，避免遮挡商品主体和品牌 Logo。",
      "typographyInstruction": "Use bold, clean, mobile-readable sans-serif typography with a clear headline hierarchy.",
      "rationale": "把完整套装事实转译成省心、快速开始练习和一套更划算的购买理由。"
    }
  ],
  "selectedCandidateId": "complete-practice-set",
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

## Shopper-Benefit Selling Points

Visible `sellingPoints` must be shopper-benefit phrases, not raw parameter labels. Convert product facts into purchase reasons:

- `Accessories included` -> `All Essentials Included`
- `case, bow, tuner, rosin` -> `Start Practice Faster`
- `complete set` -> `Everything in One Set`
- `4/4 full size` -> `Built for Growing Players` or `Full-Size Practice Ready`
- `yellow-green finish` -> `Standout Green Finish`
- `multiple included items` -> `More Value in One Box`
- `beginner accessories` -> `Beginner-Friendly Setup`

Do not use bare facts as visible selling points unless they are rewritten as customer value. Avoid visible badges such as:

- `Spruce top`
- `Maple back`
- `Ebony fittings`
- `4/4 Full Size`
- `Yellow-Green Finish`
- `Accessories Included`

Use the raw facts in `evidence`, not as the final badge text.

## Scoring

Each candidate must include a 0-100 score. Score with:

- Product fact accuracy: 30
- Ecommerce conversion strength: 20
- Mobile readability: 15
- Theme/scene fit: 15
- Shopper-benefit selling points instead of parameter dumping: 10
- Layout feasibility: 10

Prefer candidates scoring 88 or higher. If all 3 score below 85, follow the copy quality failure policy in `failure-recovery.md`: retry at most once, then use the highest fact-safe candidate with a review note or ask the user to confirm/edit copy.

## Selection Rules

Select the highest-scoring candidate unless it:

- contains unverified hard claims
- conflicts with product facts
- is too generic for a marketplace main image
- is too long for visible image text
- depends on internal layout instructions as visible copy

Separate visible copy from prompt instructions:

- Use `headline`, `subheadline`, and `sellingPoints` as visible image text.
- Use `layoutInstruction`, `typographyInstruction`, `positioning`, `evidence`, and `rationale` only as internal prompt context unless the user explicitly asks for a report or detailed breakdown.

## Optional Report

If the user explicitly asks for a report or detailed breakdown, include all 3 candidates, not only the selected one. Otherwise do not create a standalone report file by default.
