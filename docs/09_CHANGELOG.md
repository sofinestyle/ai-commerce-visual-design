# Changelog

## Sprint 1

### Task001: Project Scaffold

Created the basic project folder structure for application modules, documentation, prompts, media, backup, cache, logs, and configuration.

### Task002: Application Shell

Created the reusable application shell components:

- AppHeader
- Sidebar
- MainContent
- AIPanel
- AppShell

The shell established the desktop layout with left navigation, top header, central workspace, and right AI Panel.

### Task003: Dashboard UI

Created a professional dashboard interface with:

- Welcome card
- Quick actions
- Recent projects table
- Statistics cards

The dashboard uses the blue and white enterprise SaaS direction.

### Task004: Navigation Architecture

Created centralized navigation configuration in `src/config/navigation.ts` and updated Sidebar to render from that configuration.

Added future route folders for Dashboard, Projects, Products, Media Library, AI Generate, History, and Settings.

### Task005: Design System V1

Created reusable UI components in `src/components/ui`:

- AppButton
- AppCard
- AppInput
- AppSearchBar
- AppToolbar
- AppTable
- AppBadge
- EmptyState
- LoadingState
- PageTitle

### Task006: Primary Page Scaffolds

Created primary application pages using Design System components for:

- Dashboard
- Projects
- Products
- Media Library
- AI Generate
- History
- Settings

Pages remain placeholder-only and do not implement business logic.

### Task007: Project Documentation Knowledge Base

Created the initial documentation set under `docs/`:

- Project overview
- Product architecture
- AI architecture
- Workflow
- UI guidelines
- Development rules
- Task roadmap
- Decisions
- Changelog

### Task008: Product Bible Expansion

Expanded the documentation into a fuller Product Bible covering product purpose, users, vision, architecture, AI principles, workflow, UI direction, development rules, roadmap, decisions, and Sprint 1 changelog.

## Sprint 1 Notes

- No authentication has been implemented.
- No backend has been implemented.
- No API integrations have been implemented.
- No upload flow has been implemented.
- No real AI generation has been implemented.
- The project remains local-first, desktop-only, and documentation-led.

## Sprint 3

### Task11.1: SQLite + Prisma Foundation

Initialized the database foundation using Prisma ORM with a local SQLite database.

- Added Prisma schema infrastructure.
- Added local SQLite database file.
- Generated Prisma Client.
- Kept the initial schema focused on datasource and generator setup before business models.

### Task11.2: Prisma Singleton

Created the shared Prisma client access layer.

- Added `src/lib/prisma.ts`.
- Used a Next.js hot reload-safe singleton pattern.
- Exported `prisma` as the single application-wide database client.

### Task11.3: Database Design Document

Created the database design source of truth in `docs/10_DATABASE_DESIGN.md`.

- Recorded database principles.
- Defined entity boundaries.
- Documented relationship expectations.
- Marked flexible fields for later confirmation.

### Task11.3.1: Database Design Document Optimization

Refined the database design before creating Prisma models.

- Moved image ownership to Media.
- Replaced stored count fields with derived query counts.
- Added Brand and Platform entities.
- Split Prompt Template content into `systemPrompt`, `userPrompt`, and `negativePrompt`.
- Split Generation History parameters into explicit fields.

### Task11.4: Prisma Models

Created Prisma models for the core data entities.

- Project
- Product
- Media
- Workflow
- PromptTemplate
- GenerationHistory
- Task
- Brand
- Platform

### Task11.4.1: Prisma Model Correction

Added `updatedAt` to the Task model and regenerated Prisma Client.

### Task11.5: Prisma Migration

Created the initial SQLite database tables through Prisma migration.

- Generated `prisma/dev.db`.
- Generated the initial migration under `prisma/migrations/`.

### Task11.5.1: Prisma Migration Engine Fix

Resolved Prisma schema engine issues by using the official stable Prisma 6.x line.

- Fixed validate/generate/migrate status compatibility.
- Standardized Prisma and `@prisma/client` on `6.19.3`.

### Task11.6: Seed Data

Created repeatable seed data for the database.

- Brand: 2
- Platform: 6
- Project: 5
- Product: 20
- Media: 40
- Workflow: 5
- PromptTemplate: 10
- Task: 20
- GenerationHistory: 20

### Task11.7: Repository Layer

Created read-only repository modules for core entities.

- Added default `deletedAt: null` filtering.
- Added `findAll()` and `findById(id)` methods.
- Added entity-specific read helpers for Projects, Products, Media, and Tasks.

### Task11.8: Read-only API Routes

Created read-only GET API Routes backed by repositories.

- `/api/projects`
- `/api/products`
- `/api/media`
- `/api/workflows`
- `/api/prompts`
- `/api/tasks`
- `/api/generation-history`
- `/api/brands`
- `/api/platforms`

### Task11.9: API Route Verification

Verified all read-only API Routes return the seeded database records using the shared response format.

### Task11.10 - Task11.15: Page Data Integration

Connected primary data pages to real read-only API data.

- Projects page reads `/api/projects` and displays 5 seeded records.
- Products page reads `/api/products` and displays 20 seeded records.
- Media Library page reads `/api/media` and displays 40 seeded records.
- Prompt Center page reads `/api/prompts` and displays 10 seeded records.
- Workflow page reads `/api/workflows` and displays 5 seeded records.
- Task Center page reads `/api/tasks` and displays 20 seeded records.

Each page now includes loading, error, and empty states while preserving the existing enterprise SaaS UI direction.

## Sprint 3 Notes

- No write APIs have been implemented.
- No authentication has been implemented.
- No upload flow has been implemented.
- No AI execution has been implemented.
- No database schema changes should be made without updating `docs/10_DATABASE_DESIGN.md`.

## Sprint 3 Service Layer Update

### Task12.1: Service Layer

Created the initial Service Layer under `src/lib/services/`.

- Added service modules for Project, Product, Media, Workflow, Prompt, Task, Generation History, Brand, and Platform.
- Each service exposes `getAll()` and `getById(id)`.
- Services currently wrap Repository read methods without adding business logic.
- Entity-specific helpers were preserved at the Service level where Repository helpers already exist.

### Task12.2: API Routes Connected To Service Layer

Updated read-only API Routes to call Service methods instead of Repository methods.

- `/api/projects` calls `projectService.getAll()`.
- `/api/products` calls `productService.getAll()`.
- `/api/media` calls `mediaService.getAll()`.
- `/api/workflows` calls `workflowService.getAll()`.
- `/api/prompts` calls `promptService.getAll()`.
- `/api/tasks` calls `taskService.getAll()`.
- `/api/generation-history` calls `generationHistoryService.getAll()`.
- `/api/brands` calls `brandService.getAll()`.
- `/api/platforms` calls `platformService.getAll()`.

The current data access chain is now:

`Page -> API Route -> Service -> Repository -> Prisma -> SQLite`

## Sprint 3.6 / v0.3.0 First AI Generation

### Task14.2: OpenAI Environment Configuration And Mode Switching

Prepared AI runtime configuration without calling real OpenAI.

- Added AI environment examples.
- Added `src/lib/aiConfig.ts`.
- Added provider mode support with `mock` as the safe default.
- Kept `/api/ai/generate` response format stable.

### Task14.3: AI Provider Framework

Created the AI Provider Framework for current and future model providers.

- Added provider types and factory.
- Added Mock Provider.
- Added DMXAPI Provider.
- Added OpenAI Provider placeholder.
- Added Custom Provider placeholder for OpenAI-compatible platforms.
- Updated AI Generation Service to call `providerFactory.getProvider().generateImage(input)`.

### Task14.4: DMXAPI Connection Test API

Added provider configuration verification without image generation.

- Added `GET /api/ai/test-provider`.
- Supported mock mode verification.
- Supported DMXAPI missing-config errors.
- Verified configured DMXAPI connection through a lightweight OpenAI-compatible models request.
- Ensured API keys are not exposed in responses.

### Task14.5: Real DMXAPI Connection Test

Verified local DMXAPI configuration.

- Confirmed `AI_PROVIDER=dmxapi`.
- Confirmed `AI_BASE_URL` and `AI_API_KEY` are configured locally.
- Confirmed `AI_IMAGE_MODEL=gpt-image-2`.
- Verified `GET /api/ai/test-provider` returns success for DMXAPI.

### Task14.6: DMXAPI Real Text-To-Image Generation

Implemented real image generation in `dmxProvider.ts`.

- Calls `POST {AI_BASE_URL}/v1/images/generations`.
- Uses `Authorization: Bearer AI_API_KEY`.
- Sends OpenAI-compatible image generation payload.
- Uses `AI_IMAGE_MODEL=gpt-image-2`.
- Supports URL image responses.
- Supports base64 image responses by returning `data:image/png;base64,...`.
- Keeps `/api/ai/generate` response shape stable.

### Task14.6.1: AI Workspace Restoration

Fixed the AI Workspace page rendering.

- Restored Project Selector.
- Restored Product Selector.
- Restored Media Selector.
- Restored Prompt Editor.
- Restored Analyze and Generate actions.
- Ensured fetch errors display as errors instead of hiding the workspace.
- Ensured empty data displays EmptyState instead of hiding the workspace.

### Task14.6.2: AI Workspace Real Generation UX

Updated the AI Workspace for real image generation.

- Replaced `mock-image-model` default with `gpt-image-2`.
- Updated AI parameter copy from mock language to AI language.
- Rendered generated `data:image/png;base64,...` images in the result area.
- Removed Mock Image placeholders.
- Updated result copy to `Generation Result`.

## v0.3.0 Result

v0.3.0 First AI Generation is complete.

- AI Provider Framework exists.
- DMXAPI is the first real provider.
- `gpt-image-2` is the current real image model.
- `/api/ai/test-provider` verifies provider connectivity.
- `/api/ai/generate` supports real DMXAPI image generation.
- `/ai` can display generated URL or base64 data URL images.
