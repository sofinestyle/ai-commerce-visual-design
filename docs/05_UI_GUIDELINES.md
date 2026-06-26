# UI Guidelines

## Desktop First

The application is desktop-only for Sprint 1 and early product development. Layouts should assume a large workspace, stable sidebar, persistent right AI Panel, and enough horizontal room for professional production tools.

Mobile layouts are not a current requirement.

## Professional SaaS

The interface should feel like a serious enterprise SaaS product: calm, structured, consistent, and optimized for repeated use. Visual hierarchy should help users scan, compare, and act without decoration getting in the way.

## Blue And White

The core visual language is blue and white:

- White backgrounds for primary workspace surfaces.
- Blue primary actions and accents.
- Soft blue borders and shadows.
- Slate text for readable hierarchy.
- Minimal use of strong color outside status indicators.

## Minimal Interface

The UI should be minimal but not empty. Every visible element should support navigation, workflow, status, review, or action.

Avoid noisy decoration, oversized marketing-style sections, and one-off styling that makes modules feel unrelated.

## Large Workspace

The center of the application is the workspace. It should have room for tables, cards, image previews, generation controls, comparison views, and review surfaces.

The Sidebar and AI Panel should support the workspace, not dominate it.

## Reusable UI

Reusable components come first. Prefer `src/components/ui` for buttons, cards, inputs, search bars, toolbars, tables, badges, empty states, loading states, and page titles.

If a UI pattern repeats, it should become a component before it spreads across pages.

## Layout Standards

- Sidebar remains on the left.
- AI Panel remains on the right.
- Header stays at the top of the workspace area.
- Cards should use rounded corners, soft borders, and optional subtle shadows.
- Page content should be readable, aligned, and consistent across modules.
