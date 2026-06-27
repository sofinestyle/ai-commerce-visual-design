# Database Design

## 1. Database Design Principles

The database layer starts with a conservative foundation. The goal is to support future repository implementation without locking the product into premature business rules.

- SQLite: Use a local-first SQLite database for early development and desktop-oriented workflows.
- Prisma: Use Prisma ORM as the database access layer and schema management tool.
- Prisma version: Use Prisma and `@prisma/client` `6.19.3` for the current stable local development baseline.
- UUID: Use UUID-style IDs for primary identifiers so records remain portable across future local/cloud sync.
- `createdAt`: Every core entity should include a creation timestamp.
- `updatedAt`: Every core entity should include an update timestamp.
- Soft delete: Prefer `deletedAt` over hard deletion for user-created business records.
- Repository Pattern: Application features should access data through repository modules, not directly through Prisma calls in UI components.
- Media ownership: All images and visual assets should be managed through Media instead of duplicated image fields on Project or Product.
- Derived statistics: Counts such as product totals and image totals should be calculated by queries instead of stored on parent entities.

## Current Sprint 3 Implementation Status

Sprint 3 moved the project from UI-only mock data toward a local read-only data foundation.

Current technical baseline:

- Prisma ORM is fixed to `6.19.3`.
- `@prisma/client` is fixed to `6.19.3`.
- The database is local SQLite.
- The active local database file is `prisma/dev.db`.
- Initial migrations live under `prisma/migrations/`.
- Prisma Client is generated and consumed through `src/lib/prisma.ts`.

Current data access chain:

`Page -> API Route -> Service -> Repository -> Prisma -> SQLite`

Layer responsibilities:

- Page: Renders UI and calls API Routes.
- API Route: Handles HTTP request/response shape and calls Service methods.
- Service: Owns business-facing operations and orchestration points.
- Repository: Owns database query details.
- Prisma: Provides ORM access and generated database client.
- SQLite: Stores local-first application data.

Current seed data volume:

- Brand: 2
- Platform: 6
- Project: 5
- Product: 20
- Media: 40
- Workflow: 5
- PromptTemplate: 10
- Task: 20
- GenerationHistory: 20

Repository layer:

- Repository modules live under `src/lib/repositories/`.
- Repositories are read-only at this stage.
- Every repository includes `findAll()` and `findById(id)`.
- Queries default to `deletedAt: null`.
- Entity-specific read helpers exist for Project, Product, Media, and Task.

Service layer:

- Service modules live under `src/lib/services/`.
- Services are thin wrappers at this stage.
- API Routes call Service methods instead of calling Repository modules directly.
- Future business logic, orchestration, validation, upload coordination, and AI generation coordination should live in Service modules before reaching Repository modules.

Read-only API Routes:

- `/api/projects`
- `/api/products`
- `/api/media`
- `/api/workflows`
- `/api/prompts`
- `/api/tasks`
- `/api/generation-history`
- `/api/brands`
- `/api/platforms`

Pages connected to real API data:

- Projects reads `/api/projects`.
- Products reads `/api/products`.
- Media Library reads `/api/media`.
- Prompt Center reads `/api/prompts`.
- Workflow reads `/api/workflows`.
- Task Center reads `/api/tasks`.

Current data layer restrictions:

- No write API exists yet.
- No Repository write methods exist yet.
- No authentication guards exist yet.
- No upload pipeline exists yet.
- No AI execution pipeline exists yet.
- Page integrations are read-only and use client-side `fetch`.

## 2. Project Data Boundary

Project represents a visual production workspace or campaign.

Final planned fields:

- `id`
- `name`
- `description`
- `platformId`
- `language`
- `status`
- `coverMediaId`
- `createdAt`
- `updatedAt`
- `deletedAt`

Notes:

- `productCount` is not stored. It should be calculated by querying Products.
- `imageCount` is not stored. It should be calculated by querying Media.
- `coverMediaId` points to the Media record used as the project cover.

Potential future fields:

- `ownerId`
- `workspaceId`
- `exportPreset`
- `deadline`
- `priority`

## 3. Product Data Boundary

Product represents commerce product information and asset context.

Final planned fields:

- `id`
- `projectId`
- `brandId`
- `platformId`
- `name`
- `sku`
- `category`
- `language`
- `description`
- `coverMediaId`
- `status`
- `tags`
- `createdAt`
- `updatedAt`
- `deletedAt`

Notes:

- Product does not store `thumbnail`, `gallery`, `sourceImages`, `generatedImages`, or `coverImage`.
- All product images should be represented by Media records.
- `coverMediaId` points to the Media record used as the product cover.

Potential future fields:

- `price`
- `currency`
- `marketplaceUrl`
- `attributes`
- `sellingPoints`
- `complianceNotes`

## 4. Media Data Boundary

Media represents source, generated, and exportable visual assets.

Final planned fields:

- `id`
- `projectId`
- `productId`
- `name`
- `filename`
- `type`
- `mimeType`
- `storagePath`
- `hash`
- `thumbnail`
- `previewImage`
- `width`
- `height`
- `fileSize`
- `status`
- `tags`
- `source`
- `createdAt`
- `updatedAt`
- `deletedAt`

Potential future fields:

- `metadata`
- `originTaskId`
- `isFavorite`
- `usageType`
- `colorProfile`

## 5. Workflow Data Boundary

Workflow represents a reusable AI commerce visual production flow.

Final planned fields:

- `id`
- `projectId`
- `name`
- `description`
- `status`
- `workflowJson`
- `createdAt`
- `updatedAt`
- `deletedAt`

Notes:

- `workflowJson` stores the step flow structure until the product needs a normalized WorkflowStep entity.

Potential future fields:

- `version`
- `lastRunAt`
- `createdBy`
- `defaultModel`
- `defaultExportPreset`

## 6. Prompt Template Data Boundary

Prompt Template represents reusable prompt assets and structured generation instructions.

Final planned fields:

- `id`
- `name`
- `category`
- `platformId`
- `language`
- `model`
- `systemPrompt`
- `userPrompt`
- `negativePrompt`
- `variables`
- `tags`
- `version`
- `status`
- `favorite`
- `createdAt`
- `updatedAt`
- `deletedAt`

Potential future fields:

- `stylePreset`
- `qualityPreset`
- `createdBy`
- `usageCount`
- `lastUsedAt`

## 7. Generation History Data Boundary

Generation History records AI generation attempts, review outcomes, and traceability.

Final planned fields:

- `id`
- `projectId`
- `productId`
- `workflowId`
- `promptTemplateId`
- `taskId`
- `model`
- `prompt`
- `negativePrompt`
- `size`
- `quality`
- `seed`
- `temperature`
- `steps`
- `cost`
- `duration`
- `status`
- `resultCount`
- `outputMediaIds`
- `errorMessage`
- `createdAt`
- `updatedAt`
- `deletedAt`

Potential future fields:

- `reviewStatus`
- `approvedMediaId`
- `exportedAt`
- `providerRequestId`
- `providerMetadata`

## 8. Brand Data Boundary

Brand represents brand-level context for product visual production.

Final planned fields:

- `id`
- `name`
- `code`
- `description`
- `createdAt`
- `updatedAt`
- `deletedAt`

Potential future fields:

- `logoMediaId`
- `brandGuidelines`
- `defaultTone`
- `defaultColorPalette`

## 9. Platform Data Boundary

Platform represents marketplace or commerce channel configuration.

Final planned fields:

- `id`
- `name`
- `code`
- `description`
- `createdAt`
- `updatedAt`
- `deletedAt`

Potential future fields:

- `imageRules`
- `exportPresets`
- `locale`
- `defaultAspectRatio`

## 10. Entity Relationship Notes

- Platform has many Projects.
- Platform has many Products.
- Platform has many Prompt Templates.
- Brand has many Products.
- Project belongs to one Platform.
- Project has many Products.
- Project has many Media assets.
- Project may have many Workflows.
- Project may have one cover Media through `coverMediaId`.
- Product belongs to one Project.
- Product belongs to one Brand.
- Product belongs to one Platform.
- Product may have many Media assets.
- Product may have one cover Media through `coverMediaId`.
- Media belongs to one Project.
- Media may optionally belong to one Product.
- Workflow belongs to one Project.
- Prompt Template belongs to one Platform.
- Prompt Template can be used by many Workflows and many Generation History records.
- Generation History links Project, Product, Workflow, Prompt Template, Task, and output Media for traceability.
- Generation History output media may later use a join table instead of serialized `outputMediaIds`.
- Task records should eventually connect workflow execution with generation history, but Task schema is not finalized in this document.

## 11. Fields To Confirm Later

The following fields are intentionally marked as flexible and may change after repository and workflow design:

- `status`: Needs module-specific lifecycle definitions before schema finalization.
- `tags`: May remain serialized JSON or become a normalized tag table.
- `workflowJson`: May be replaced by WorkflowStep and WorkflowEdge entities.
- `variables`: Prompt variables may remain JSON or become structured child records.
- `outputMediaIds`: May be replaced by a join table between Generation History and Media.
- `coverMediaId`: Needs delete behavior and fallback rules.
- `brandId`: Product may allow optional brand during early imports.
- `platformId`: Some records may need platform-agnostic defaults.
- `category`: May become a taxonomy table.
- `mimeType`: Should be validated against file type rules.
- `storagePath`: Needs local storage and future cloud storage conventions.
- `hash`: Hash algorithm and uniqueness policy need confirmation.
- `cost`: Currency and unit convention need confirmation.
- `duration`: May be stored as milliseconds instead of display text.
- `deletedAt`: Soft-delete behavior needs repository-level conventions.
