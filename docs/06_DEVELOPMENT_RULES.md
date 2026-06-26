# Development Rules

## One Task, One Responsibility

Each task should do one thing. A navigation task should not also redesign the dashboard. A documentation task should not modify UI code. A scaffold task should not add business logic.

Small, clear changes make the project easier to review and safer to extend.

## Never Rewrite Architecture Casually

Architecture changes require explicit approval. Do not casually replace the AppShell, navigation structure, folder structure, or module boundaries.

When architecture must change, document the reason and update the relevant files in `docs/`.

## Documentation First

Project knowledge must live in `docs/`, not only in chat memory. When product direction, architecture, workflow, or rules become important, they should be recorded in markdown.

Documentation should be treated as part of the product source.

## Reusable Components First

Use existing Design System components before writing duplicated UI:

- `AppButton`
- `AppCard`
- `AppInput`
- `AppSearchBar`
- `AppToolbar`
- `AppTable`
- `AppBadge`
- `EmptyState`
- `LoadingState`
- `PageTitle`

If a new pattern appears repeatedly, create a reusable component.

## Business Logic Requires Permission

Do not add business logic unless requested. Do not connect APIs, implement uploads, add AI generation, create authentication, or introduce backend behavior without an explicit task.

## Preserve Existing Work

Do not overwrite unrelated user or previous task changes. Work with the current codebase and keep changes scoped to the request.

## Never Skip Lint

Run `npm run lint` after changes. If lint fails, fix the issue or clearly report why it could not be fixed.

## Current Product Constraints

- Desktop only.
- Local-first.
- Blue and white enterprise SaaS style.
- AppShell remains the primary layout.
- Navigation is centralized in `src/config/navigation.ts`.
- Product documentation lives in `docs/`.
