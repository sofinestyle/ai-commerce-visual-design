# Decisions

## Product Direction

- The product is named AI 电商视觉设计平台.
- The product is local Web first.
- The product should be cloud-ready later.
- The product is desktop first.
- Mobile is not supported in the current scope.
- The product focuses on AI-powered e-commerce visual design workflows.

## Development Process

- Codex is the primary developer.
- Work is organized into explicit sprint tasks.
- One task should have one responsibility.
- Application code should not change during documentation-only tasks.
- Architecture should not change without approval.
- `npm run lint` must be run after changes.

## Documentation

- Documentation is the source of truth.
- Product knowledge lives in `docs/`.
- Project knowledge must not rely on chat memory.
- Product vision, architecture, workflow, AI principles, UI guidelines, development rules, roadmap, decisions, and changelog must be documented.

## Architecture

- The application uses a persistent AppShell.
- Sidebar is on the left.
- AI Panel is on the right.
- Main Content fills the remaining workspace.
- Header height is 64px.
- Sidebar width is 260px.
- AI Panel width is 360px.
- Navigation is centralized in `src/config/navigation.ts`.

## UI

- The visual style is blue and white enterprise SaaS.
- The UI is card-based.
- Reusable Design System components should be used before duplicated markup.
- The Dashboard remains the Home page.

## AI

- AI assists.
- Human decides.
- Human confirmation is required for important actions.
- AI should be workflow-driven.
- The AI Engine should be centralized.
- Model providers should be abstracted.
- Future model support may include OpenAI, Gemini, Flux, and local models.

## Scope Boundaries

- No authentication unless explicitly requested.
- No backend unless explicitly requested.
- No API connections unless explicitly requested.
- No uploads unless explicitly requested.
- No real AI generation unless explicitly requested.
