# Local Revision

## Workflow Choice

When the user asks to modify an already generated image, classify the request by scope. Do not add a recommendation step; choose the workflow from the explicit request and defect scope.

Use `POST /api/ai-workspace/edit-image` when the user wants to preserve the existing image and change only a bounded part, such as:

- replacing an incorrect brand logo with a verified logo asset
- correcting a small text or visible-copy issue while keeping the same layout
- repairing a local artifact, shadow, small background defect, hand/finger detail, or one accessory placement
- changing a small element while preserving composition, scene, product position, lighting, and typography

Use `POST /api/ai-workspace/ecommerce-generate` for redesign/regeneration when the change is structural, such as:

- product floating, distortion, wrong scale, or impossible product/scene relationship
- wrong accessories, missing verified accessories, or unverified accessories in the core layout
- scene, subject, camera angle, product arrangement, image type, or overall design direction changes
- user says "重新设计", "重做", "重新生成", "换场景", "换主体", or asks for a new composition
- multiple local edits have degraded the image or failed to fix the defect

## Edit Request

For local revision, build an edit request with:

- `currentImage`: image being edited, including media id and URL
- `parentImageId`: current image media id when available
- `editReferenceImages`: verified references needed for the edit, such as true logo, correct packaging, correct accessory, or product detail
- `productFacts`: verified SKU, brand, category, material, color, size, accessories, and packaging facts
- `visualRule`: relevant platform/image rule when known
- `editIntent`: narrow instruction describing only what to change
- `designIntent`: enough context to preserve the original ecommerce purpose
- `preserveExistingText`: true unless the user asks to remove or rewrite visible text
- `generationGroupId` and `editSessionId`: stable ids for the revision chain
- `revisionMode: "local_edit"` when supported by the platform

## Edit Prompt Boundaries

The local edit prompt must separate:

- Change only: the exact defect or object to modify this turn.
- Preserve: original background, composition, lighting, product position, typography, approved visible copy, product color, structure, scale, accessories, and canvas ratio unless explicitly changed.
- Avoid: wrong brand/logo, invented text, extra accessories, unrelated redesign, full background replacement, product structure changes, or provider-added badges/certifications.

## After Local Revision

- Save the edited image through the platform media service, not only as a filesystem file.
- Confirm `editMetadata` records `parentImageId`, `editIntent`, `editReferenceImages`, `preserveExistingText`, `editSessionId`, and `revisionMode: "local_edit"` when supported.
- Confirm the generation/version chain can show the new image as a child/local-modification result.
- If the local edit changes unrelated layout, rewrites approved copy, damages product accuracy, or still fails the requested fix, retry once with a narrower edit prompt or switch to redesign/regeneration.
