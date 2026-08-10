<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Excel Visual Task Command Routing

When the user enters one of these minimal commands:

- `生成方案 VIS-XXXX`
- `修改方案 VIS-XXXX`
- `执行生图 VIS-XXXX`
- `查看任务 VIS-XXXX`

Load `skills/ecommerce-main-image-designer/SKILL.md`, then execute according to that Skill and `skills/ecommerce-main-image-designer/references/excel-task-workflow.md`.

AGENTS.md only routes these commands to the Skill. Do not duplicate the Excel workflow here, bypass the Skill, interpret the Excel task directly, or call image models directly.
