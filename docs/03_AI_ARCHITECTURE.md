# AI Architecture

## Core Principle

AI is an assistant inside a workflow-driven product. It should help the user think, prepare, generate, compare, and review, but it should not make irreversible decisions without explicit human confirmation.

## Human-In-The-Loop

Every important AI-assisted action should include a human review point. This includes prompt approval, model choice, output selection, edits, export decisions, and saving generated assets to a project.

The user should understand what AI is doing, what inputs it used, and what will happen next.

## AI Is Assistant, Not Owner

AI may suggest prompts, layouts, image directions, quality checks, and workflow next steps. The final decision belongs to the human user.

AI should not silently overwrite project data, delete assets, publish exports, or mark work as approved.

## Workflow Driven

AI features should be embedded in the product workflow:

- Product context informs AI direction.
- Media assets provide source material.
- Projects define purpose and constraints.
- Prompts express intent.
- Generated outputs are compared and reviewed.
- Approved work is exported and recorded in History.

AI should strengthen the workflow rather than become a detached prompt box.

## Model Abstraction

The AI Engine should be centralized behind a future model abstraction layer. Product features should call the application AI layer, not individual model providers directly.

This protects the product from provider-specific coupling and makes it possible to add, remove, or swap models later.

## Future Model Support

- OpenAI: Text, vision, multimodal reasoning, and possible image generation workflows.
- Gemini: Multimodal analysis and generation workflows where useful.
- Flux: Image generation workflows and visual creative output.
- Local models: Privacy-sensitive or offline workflows where local hardware and model quality allow.

## Safety And Control

The platform should keep AI output reviewable, editable, and traceable. Prompt text, source media, selected model, generated output, and user decisions should eventually be recorded in History.
