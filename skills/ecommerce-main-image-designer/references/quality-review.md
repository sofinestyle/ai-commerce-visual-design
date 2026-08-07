# Quality Review

## Critical Checks

Reject or retry when any critical check fails:

- wrong product type or SKU appearance
- packaging is freely invented or materially different when a real packaging reference is required
- accessory mismatch, missing verified accessories in a set image, or unverified accessories added
- visible logo, pseudo-logo, wordmark, trademark, or branded label appears without a verified `brand_logo` reference
- branded case/bag/packaging appears without the relevant verified accessory/packaging reference
- product scale/proportion is inconsistent with verified size or real usage context
- wrong platform size/aspect ratio
- requested scene missing
- visible copy is illegible, misspelled, or covers the product
- product color materially changed
- main subject is cropped in a way that harms ecommerce use
- severe face/hand/body/instrument artifacts
- unsafe or inappropriate depiction

## Main-Image Checks

Use the platform's structured quality review when available. The review should include critical check statuses, weighted category scores, total score, decision, and reasons. If only manual review is available, score from 0-100 with this weighting:

- Product accuracy: 30
- Ecommerce composition and product prominence: 20
- Scene match: 15
- Copy quality and readability: 15
- Technical quality: 10
- Brand/platform fit: 10

Below 75: retry according to the retry budget.
75-85: usable with caveats.
Above 85: deliver.

## Structured QA Contract

When recording QA, use this shape when the platform supports it:

```json
{
  "criticalChecks": {
    "skuAccurate": true,
    "productTypeAccurate": true,
    "colorAccurate": true,
    "accessoriesAccurate": true,
    "packagingAccurate": true,
    "platformCompliant": true,
    "sceneMatchesRequest": true,
    "copyReadable": true,
    "severeArtifact": false,
    "safeDepiction": true
  },
  "scores": {
    "productAccuracy": 30,
    "composition": 20,
    "sceneMatch": 15,
    "copy": 15,
    "technical": 10,
    "platformFit": 10
  },
  "total": 100,
  "decision": "pass",
  "reasons": [],
  "retryRecommended": false,
  "attempt": 1,
  "maxAttempts": 1
}
```

Decision values:

- `pass`: deliver.
- `usable_with_caveats`: deliver with caveats.
- `retry`: retry within the retry budget.
- `fail_stop`: stop automatic generation and report the failure.

## Retry Budget

- Normal QA failure: retry at most 1 time.
- Critical failure: retry at most 2 times.
- Local edit drift or missed localized fix: retry once with a narrower edit request, then switch to redesign/regeneration if the defect is structural.
- After the maximum attempts, stop automatic generation, return the current best usable result when one exists, and explain the remaining failure reason.

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

## Local Revision Checks

For image edit / local revision outputs, inspect both the requested fix and preservation quality:

- The requested local defect is fixed.
- Verified edit references were used where required, especially true brand logos, packaging, accessories, or product details.
- No incorrect logo, wrong brand wordmark, pseudo-logo, unrelated brand, or self-generated logo remains. If no true logo file was selected, the image must be logo-free/unbranded.
- Approved visible copy is preserved unless the user explicitly requested text changes.
- Existing composition, background, lighting, product position, canvas ratio, and typography remain consistent when the task was local edit.
- Product color, structure, scale, material, and verified accessories did not drift.
- No new unverified text, badges, certifications, ratings, prices, discounts, or extra accessories were introduced.
- Edited output is saved as media and links back to the parent image through `parentImageId` or equivalent edit metadata.
- `editMetadata` includes the edit intent, edit references, preserve-text setting, edit session id, and `revisionMode: "local_edit"` when supported.

If the edit changes unrelated areas, damages product accuracy, rewrites approved copy, or fails to fix the requested defect, retry once with a narrower edit request. If the defect is structural or the edit keeps drifting, switch to redesign/regeneration through the ecommerce generation chain.

## Platform Feedback

For recurring quality issues, prefer platform-level fixes over one-off Codex prompt workarounds:

- Strengthen platform reference selection when real packaging, accessory, or detail photos are required.
- Strengthen platform prompt rules when generated packaging, accessories, product proportions, or visible copy drift from facts.
- Strengthen platform QA when defects can be detected from prompt metadata, selected-reference roles, or visual review.
- Use direct provider calls only as an explicitly approved fallback, and note that they may not appear in platform history.
