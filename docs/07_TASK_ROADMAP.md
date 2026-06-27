# Task Roadmap

## Sprint 1 Completed

- Task001: Project scaffold
- Task002: Application Shell
- Task003: Dashboard UI
- Task004: Navigation architecture
- Task005: Design System V1
- Task006: Primary page scaffolds
- Task007: Project documentation knowledge base
- Task008: Product Bible documentation expansion

## Sprint 1 Result

Sprint 1 establishes the foundation of the application:

- Folder structure and documentation areas exist.
- Application shell exists.
- Dashboard UI exists.
- Navigation architecture exists.
- Design System V1 exists.
- Primary module pages exist.
- Product documentation is now a source of truth.

## Sprint 2 Placeholder

Sprint 2 may focus on early module depth while still avoiding premature backend complexity.

Potential Sprint 2 directions:

- Project data model planning
- Product module UI expansion
- Media Library UI expansion
- AI Generate workflow design
- Prompt structure documentation
- Export workflow planning
- History and traceability design

Final Sprint 2 scope must be approved before implementation.

## Sprint 3 Completed

Sprint 3 establishes the first real data layer while keeping the application read-only and local-first.

- Task11.1: SQLite + Prisma foundation
- Task11.2: Prisma singleton database client
- Task11.3: Database design document
- Task11.3.1: Database design document optimization
- Task11.4: Prisma models
- Task11.4.1: Task model correction
- Task11.5: Initial Prisma migration
- Task11.5.1: Prisma migrate schema engine fix
- Task11.6: Seed base data
- Task11.7: Repository data access layer
- Task11.8: Read-only API Routes
- Task11.9: Read-only API Route testing
- Task11.10: Projects page connected to real API data
- Task11.11: Products page connected to real API data
- Task11.12: Media Library page connected to real API data
- Task11.13: Prompt Center page connected to real API data
- Task11.14: Workflow page connected to real API data
- Task11.15: Task Center page connected to real API data

## Sprint 3 Result

- Prisma and SQLite are initialized.
- Prisma is fixed on the stable `6.19.3` line.
- SQLite local database exists at `prisma/dev.db`.
- Initial database migration exists.
- Repeatable seed data exists.
- Repository modules provide read-only access to core entities.
- Read-only API Routes expose seeded data.
- Projects, Products, Media Library, Prompt Center, Workflow, and Task Center pages read real API data.

## Sprint 4 Placeholder

Sprint 4 may focus on the next layer of product behavior after confirming the v0.2.0 baseline.

Potential Sprint 4 directions:

- API route tests
- Detail pages
- Create flows
- Repository write methods
- Form validation
- Data refresh patterns
- Error and empty state polish

Final Sprint 4 scope must be approved before implementation.

## Sprint 3.6 Completed: v0.3.0 First AI Generation

Sprint 3.6 completes the first real AI generation milestone.

- Task14.2: AI environment configuration and mode switching
- Task14.3: AI Provider Framework
- Task14.4: DMXAPI connection test API
- Task14.5: Real DMXAPI connection verification
- Task14.6: DMXAPI real text-to-image generation
- Task14.6.1: AI Workspace rendering restoration
- Task14.6.2: AI Workspace default model and real image display

## v0.3.0 Result

- AI Provider Framework supports `mock`, `dmxapi`, `openai`, and `custom`.
- DMXAPI is the first real provider.
- Current real image model is `gpt-image-2`.
- `GET /api/ai/test-provider` verifies provider configuration and connectivity.
- `POST /api/ai/generate` can generate real images through DMXAPI.
- `/ai` page can display generated `data:image/png;base64,...` images and URL images.
- Mock provider remains available for local fallback and development.

## Next Suggested Scope

Future work should be approved as a new task before implementation.

- Persist generated images into Media Library.
- Save generation history to the database.
- Add download/save/reuse actions for generated images.
- Improve provider error taxonomy.
- Add provider and model settings UI.
