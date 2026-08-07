# Visible Copy

## Copy Objective

Main-image copy should sell the product in shopper language, not merely list parameters. Before image generation, call the text model to produce exactly 3 copy candidates and select the best one only when visible copy is allowed by platform rules, the image role benefits from copy, the user has not confirmed exact visible copy, and `copyMode` is not `none`.

Each candidate balances:

- an emotional or usage-driven headline
- a factual, benefit-oriented subheadline
- 2-4 short shopper-benefit proof points
- a clear positioning statement
- product-fact evidence
- a score and rationale for selection

The visible copy must answer "why should I buy this?" rather than only "what are the specs?" Keep product facts in `evidence`, then translate them into customer benefits for visible badges.

## Preferred Patterns

For learning/music lifestyle images:

- Headline examples:
  - Practice With Confidence
  - Ready for the First Stage
  - Play Anywhere
  - Make Practice Feel Natural
  - A Confident Start
- Subheadline examples:
  - A violin made for daily learning
  - Full-size design for growing players
  - A bright look for practice moments
  - Built for lessons, practice, and recitals
- Proof point examples:
  - Built for Growing Players
  - Beginner-Friendly Setup
  - Standout Green Finish
  - All Essentials Included
  - Start Practice Faster
  - More Value in One Box
  - Everything in One Set

Use only proof points supported by product facts.

## Fact-to-Benefit Translation

When product facts are provided, convert them before writing visible selling points:

| Product fact | Weak visible badge | Better shopper-facing badge |
| --- | --- | --- |
| Included case, bow, rosin, tuner, manual | Accessories Included | All Essentials Included |
| Complete set with practice accessories | Complete Accessory Kit | Everything in One Set |
| Starter/practice configuration | Beginner accessories | Start Practice Faster |
| 4/4 size | 4/4 Full Size | Built for Growing Players |
| Distinct yellow-green finish | Yellow-Green Finish | Standout Green Finish |
| Multiple bundled items | Value Set | More Value in One Box |

The better badge must still be traceable to evidence. Do not imply outcomes that are not verified, such as better tone, faster learning, professional performance, guaranteed durability, or money savings with a numeric amount.

## Avoid Bland Fallbacks

After a safety/content filter event, do not downgrade to weak copy such as only:

- `4/4 violin`
- `Yellow-green finish`
- `Solid wood body`
- `Accessories included`

Instead, keep a safe emotional shopper promise plus factual support:

- `Practice With Confidence`
- `Made for daily learning`
- `All Essentials Included`
- `Start Practice Faster`
- `More Value in One Box`

## Failure Recovery

For text-model filtering, weak candidates, and local fallback copy, follow `failure-recovery.md`.

## Fact Policy

Allowed:

- verified material/color/size/accessory facts
- supported usage language like practice, lessons, beginner-friendly setup
- emotional framing like confidence, stage-ready, daily learning

Avoid unless verified:

- better sound/tone claims
- patented appearance, unless product facts explicitly say it and the user accepts it
- awards, certifications, guarantees, medical or educational outcome claims
- price, discounts, sales rank
