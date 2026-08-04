# Visible Copy

## Copy Objective

Main-image copy should sell the product in shopper language, not merely list parameters.

Good copy balances:

- an emotional or usage-driven headline
- a factual, benefit-oriented subheadline
- 2-4 short proof points

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
  - Full-Size 4/4 Design
  - Natural Wood Structure
  - Beginner-Friendly Setup
  - Yellow-Green Finish
  - Complete Accessory Kit

Use only proof points supported by product facts.

## Avoid Bland Fallbacks

After a safety/content filter event, do not downgrade to weak copy such as only:

- `4/4 violin`
- `Yellow-green finish`
- `Solid wood body`

Instead, keep a safe emotional shopper promise plus factual support:

- `Practice With Confidence`
- `Made for daily learning`
- `Full-Size 4/4 Design`

## Text Model Failure Recovery

If the requested text model is filtered:

1. Retry with a smaller, safer copy-only request.
2. Remove unnecessary sensitive descriptors.
3. Ask for "student musician" or "young learner" copy rather than detailed child scene narration.
4. Keep `response_format: json_object` where supported.
5. If still blocked, use a high-quality local fallback and clearly report the failure.

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
