# Quality Review

## Critical Checks

Reject or retry when any critical check fails:

- wrong product type or SKU appearance
- packaging is freely invented or materially different when a real packaging reference is required
- accessory mismatch, missing verified accessories in a set image, or unverified accessories added
- product scale/proportion is inconsistent with verified size or real usage context
- wrong platform size/aspect ratio
- requested scene missing
- visible copy is illegible, misspelled, or covers the product
- product color materially changed
- main subject is cropped in a way that harms ecommerce use
- severe face/hand/body/instrument artifacts
- unsafe or inappropriate depiction

## Main-Image Checks

Score mentally from 0-100:

- Product accuracy: 30
- Ecommerce composition and product prominence: 20
- Scene match: 15
- Copy quality and readability: 15
- Technical quality: 10
- Brand/platform fit: 10

Below 75: retry if feasible.
75-85: usable with caveats.
Above 85: deliver.

## Lifestyle Scene Specifics

- The product must still read as the hero.
- The person should support scale and use, not replace the product as the only focal point.
- For instrument scenes, hands, bow, strings, and posture should be plausible enough for ecommerce.
- Background should establish the scene but remain less important than product and copy.

## Comparing Against Prior Good Images

When a prior image is supplied as a quality benchmark, compare:

- product size and clarity
- typography hierarchy
- headline strength
- copy placement
- lighting and realism
- shopper appeal

If the new image loses badly on copy or layout, regenerate or explain why.

## Platform Feedback

For recurring quality issues, prefer platform-level fixes over one-off Codex prompt workarounds:

- Strengthen platform reference selection when real packaging, accessory, or detail photos are required.
- Strengthen platform prompt rules when generated packaging, accessories, product proportions, or visible copy drift from facts.
- Strengthen platform QA when defects can be detected from prompt metadata, selected-reference roles, or visual review.
- Use direct provider calls only as an explicitly approved fallback, and note that they may not appear in platform history.
