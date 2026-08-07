# Field Alignment

Use this file to keep skill instructions aligned with the current platform request/response contract.

## Request Fields

The unified endpoint request maps to `EcommerceGenerationRequest`:

```json
{
  "source": "codex",
  "mode": "generate",
  "sku": "L301-GN",
  "platform": "TEMU",
  "imageType": "主图",
  "theme": "使用场景图",
  "imageCount": 2,
  "scene": "公园、音乐厅",
  "subject": "student musician playing violin",
  "sellingAngle": "daily practice confidence",
  "designIntent": "commercial lifestyle main image",
  "brandLogoMode": "auto",
  "copyMode": "auto",
  "confirmedCopy": {
    "headline": "Practice With Confidence",
    "subheadline": "A violin made for daily learning",
    "sellingPoints": ["All Essentials Included"]
  },
  "promotion": {
    "intent": "limited-time offer",
    "verifiedOffer": "Back-to-school sale verified by user"
  },
  "confirmedPlanItems": [],
  "textModel": "platform-selected-text-model",
  "imageModel": "platform-selected-image-model",
  "options": {
    "generationConcurrency": 2,
    "returnCopyCandidates": false,
    "returnPrompt": false
  }
}
```

Field constraints:

- `mode`: `plan_only`, `generate`, or `plan_then_generate`.
- `platform`: `Amazon`, `TEMU`, `SHEIN`, `天猫`, `抖店`, or `独立站`.
- `imageType`: `主图` or `详情页`.
- `brandLogoMode`: `auto`, `required`, or `forbidden`.
  - `auto`: select a verified `brand_logo` only when visible branding is requested or useful and the asset exists; if no logo file exists, default to no visible logo/brand text.
  - `required`: stop for `brandLogoReference` if no verified logo asset exists, unless the user approves continuing without logo.
  - `forbidden`: remove logo references and require no visible logo/brand text.
- `copyMode`: `auto`, `user_confirmed`, or `none`.
- `options.generationConcurrency`: 1-3; default 2.
- `confirmedPlanItems[].visibleCopy.source`: `ai_candidate`, `user_confirmed`, `none`, or `suggested`.

Do not document additional request fields unless the platform code supports them.

## Response Statuses

Expected top-level statuses:

- `needs_input`: missing required fields or verified facts; ask only returned questions.
- `planned`: return `designPlan.items` and wait for confirmation.
- `succeeded`: return output links, models, history visibility, and QA summary.
- `partial`: confirmed multi-item generation had both succeeded and failed items; report both.

Thrown errors or failed batch items should be reported exactly. Do not invent a successful result.

## Batch Shape

When `confirmedPlanItems` are sent with generation mode, the platform may return:

```json
{
  "status": "partial",
  "batch": {
    "concurrency": 2,
    "requestedCount": 3,
    "succeededCount": 2,
    "failedCount": 1,
    "items": [
      { "index": 1, "status": "succeeded" },
      { "index": 2, "status": "failed", "error": "..." }
    ]
  }
}
```

For `partial`, do not silently treat the whole task as succeeded.
