# Product Architecture

## Architecture Summary

AI 电商视觉设计平台 is organized around a desktop application shell with a left Sidebar, top Header, central Main Content area, and right AI Panel. Primary modules are exposed through centralized navigation and should share the same Design System components.

## Dashboard

Purpose: Provide the starting overview for the workspace.

Future responsibility: Show project status, recent work, statistics, quick actions, task reminders, and production health.

Relationships: The Dashboard summarizes activity from Projects, Products, Media Library, AI Generate, and History. It should not own deep business logic; it should surface key state from other modules.

## Projects

Purpose: Organize visual design work into project containers.

Future responsibility: Manage campaign workspaces, project status, related products, selected media, prompt sets, review states, and export targets.

Relationships: Projects connect Products, Media, AI Generate outputs, review decisions, exports, and History. A project is the main unit of visual production.

## Products

Purpose: Store product information needed for visual design.

Future responsibility: Manage product names, categories, descriptions, platform requirements, brand details, SKU references, and associated source media.

Relationships: Products provide the commercial context used by Projects and AI Generate. Product data should help prompts, composition choices, export naming, and review context.

## Media Library

Purpose: Store and organize visual source material.

Future responsibility: Manage images, PSD files, brand assets, reference visuals, generated outputs, and export-ready media.

Relationships: Media assets are attached to Products and Projects. AI Generate consumes source media and produces generated media. History should preserve media usage and output lineage.

## AI Generate

Purpose: Provide the workspace for AI-assisted visual generation.

Future responsibility: Manage prompt inputs, model selection, generation presets, source media selection, output previews, comparisons, and confirmation before saving results.

Relationships: AI Generate depends on Products, Media Library, and Projects for context. Outputs feed Review, Export, Media Library, and History.

## History

Purpose: Preserve traceability of user and AI-assisted work.

Future responsibility: Record generation attempts, prompts, selected models, source media, user decisions, edits, exports, and project changes.

Relationships: History is downstream of Projects, AI Generate, Media Library, and Export. It should help users understand how a result was created.

## Settings

Purpose: Hold application preferences and future configuration.

Future responsibility: Manage workspace preferences, export defaults, model provider settings, UI preferences, local storage behavior, and integration settings.

Relationships: Settings influences the behavior of AI Generate, Export, workspace layout, and future account or cloud features.

## AI Panel

Purpose: Provide persistent contextual AI assistance on the right side of the application shell.

Future responsibility: Offer workflow guidance, prompt suggestions, review checklists, product insight, and context-aware help without taking control away from the user.

Relationships: The AI Panel observes the current module context and assists across Dashboard, Projects, Products, Media Library, AI Generate, History, and Settings. It should remain supportive, not authoritative.
