# Excel Task Workflow

## Purpose

This workflow lets users drive ecommerce visual work with four short commands:

- `生成方案 VIS-XXXX`
- `修改方案 VIS-XXXX`
- `执行生图 VIS-XXXX`
- `查看任务 VIS-XXXX`

The task workbook says what to do for this run. This skill says how to do it safely and professionally. The ecommerce visual design platform remains the only source for product facts, verified references, logo assets, prompt generation, image generation, media registration, and history.

## Workbook

Use the workbook at:

```text
task/AI电商视觉生产管理系统_V3.2_最终精简版.xlsx
```

Expected sheets:

- `视觉任务清单`
- `AI设计方案库`
- `执行记录`

The current workbook uses row 3 as the header row. Match columns by exact header names, not by hard-coded column letters, so the workflow can survive harmless layout changes.

If the workbook, required sheet, required header, or task row cannot be found, return `BLOCKED`, write the clearest possible error to `错误信息` when a task row is available, and stop.

## Command Routing

Parse the user's command as:

- action: `生成方案`, `修改方案`, `执行生图`, or `查看任务`
- task id: exact `VIS-XXXX`

Do not ask the user for repository path, skill path, SKU, platform, image count, image structure, reference-image requirements, logo requirements, scene requirements, or standard "please generate a plan first" wording when those fields exist in the workbook.

For every writable command:

1. Open `视觉任务清单`.
2. Find exactly one row whose `任务编号` equals the requested task id.
3. Re-read the row immediately before writing.
4. Update only that task row and only related rows in `AI设计方案库` or `执行记录`.
5. Preserve workbook formatting, formulas, validation, colors, existing user fields, column structure, and unrelated task records.
6. Save, then re-open and verify the key fields just written.

Never ask the user to manually maintain AI-owned fields.

## Task Row Fields

User-filled fields in `视觉任务清单`:

- `任务编号`
- `产品编号`
- `平台`
- `套数`
- `图片结构`
- `参考图片要求`
- `Logo要求`
- `场景及特殊要求`

User review fields:

- `已批准版本`
- `方案锁定`

AI-maintained fields:

- `每套图片数量`
- `创建日期`
- `当前动作`
- `任务状态`
- `当前方案版本`
- `最后执行智能体`
- `最后执行时间`
- `错误信息`

Treat missing required user fields as `BLOCKED`: product number, platform, set count, image structure, reference-image requirements, logo requirements, and scene/special requirements. Do not infer missing product facts from the workbook.

## Product Facts Rule

The workbook is not a product database. After reading `产品编号`, call the visual design platform or its repository-backed services to resolve official product facts and verified media:

- product name, brand, category, material, color, size, specifications
- accessories, packaging, selling points, descriptions, tags
- exact-SKU product images
- verified logo and brand assets
- platform rules and prior platform-visible generation history

If the product record, required facts, or usable verified references cannot be found, return `BLOCKED`, write the reason to `错误信息`, and stop. Do not guess, copy facts from another SKU, or generate from generic product knowledge.

## Requirement Priority

For Excel-driven tasks, apply this priority:

1. Verified product facts.
2. Platform hard rules.
3. Verified reference images.
4. Excel task requirements.
5. User-approved scheme content.
6. AI inferred creative choices.

Within Excel fields, task variables are:

1. `图片结构`
2. `参考图片要求`
3. `Logo要求`
4. `场景及特殊要求`
5. `套数`
6. `平台`

If an Excel requirement conflicts with product truth, verified references, logo policy, claim safety, or platform rules, do not silently override it. Return a clear conflict, write it to `错误信息`, and stop or apply the safer skill rule only when the rule explicitly allows omission.

## 生成方案

When receiving `生成方案 VIS-XXXX`:

1. Locate the workbook and task row.
2. Validate required user fields.
3. Parse `图片结构` into per-set image rows and compute `每套图片数量`.
4. Resolve official product facts and verified references from the platform using `产品编号`.
5. Run the Required Facts Gate in `product-facts.md`.
6. Use `reference-selection.md`, `workflow.md`, `copy.md`, and `copy-candidate-protocol.md` as needed to create a complete design scheme.
7. For every set and every image, write a distinct row to `AI设计方案库`.

Each design row must include:

- `任务编号`
- `方案版本`
- `套图编号`
- `图片编号`
- `图片类型`
- `设计目的`
- `主体设计`
- `参考图片`
- `场景设计`
- `主图文案`
- `视觉重点`
- `记录状态`
- `更新时间`

First generated version is `V1` unless a later unlocked version already exists for the same task; never overwrite existing history. For multi-set tasks, design each set separately. Do not create one generic set and copy it without adapting scene, subject, references, copy, and visual focus.

After writing the plan:

- `当前动作` = `生成方案`
- `当前方案版本` = generated version
- `任务状态` = `方案审核中`
- `最后执行智能体` = current agent name, usually `Codex`
- `最后执行时间` = current timestamp
- `错误信息` = blank

Then stop. Plan generation must never call an image generation interface, even when the plan is complete.

## 修改方案

When receiving `修改方案 VIS-XXXX`:

1. Locate the task row.
2. Find the latest scheme version for the task in `AI设计方案库`.
3. Read user-entered `修改意见` from rows for the latest version.
4. If no modification comments exist, return `BLOCKED`, write `修改方案但没有修改意见` to `错误信息`, and stop.
5. Create the next version (`V1` -> `V2`, `V2` -> `V3`, etc.).
6. Copy the full latest-version scheme, changing only the rows/fields requested by user comments.
7. Append the new complete version to `AI设计方案库`.

Do not overwrite or delete older versions. If the currently approved and locked version needs changes, the changes must become a new version that requires review and locking again.

After writing the revision:

- `当前动作` = `修改方案`
- `当前方案版本` = new version
- `任务状态` = `方案审核中`
- `最后执行智能体` = current agent name
- `最后执行时间` = current timestamp
- `错误信息` = blank

Then stop. Revision must never call an image generation interface.

## 执行生图

When receiving `执行生图 VIS-XXXX`, first run the approval gate:

- `已批准版本` must be non-empty.
- `方案锁定` must equal `是`.

If either condition fails, return `BLOCKED`, write the exact reason to `错误信息`, and stop without calling any image generation interface.

If approved and locked:

1. Read `已批准版本`.
2. Load all rows from `AI设计方案库` matching the task id and approved version.
3. Treat those rows as a frozen scheme.
4. Do not redesign, optimize, or change image count, image structure, subject, references, scene, logo, copy, or visual focus.
5. Build `confirmedPlanItems` from the frozen rows.
6. Execute generation through the official platform chain, following `workflow.md`, `product-facts.md`, `reference-selection.md`, `copy.md`, `copy-candidate-protocol.md`, `quality-review.md`, and `failure-recovery.md`.

At start:

- `当前动作` = `执行生图`
- `任务状态` = `生成中`
- create a new row in `执行记录`

The execution record must include:

- `执行编号`
- `任务编号`
- `方案版本`
- `方案确认时间` when known
- `执行时间`
- `执行智能体`
- `GitHub仓库`
- `Skill版本/提交号`
- `计划生成数量`

After generation:

- record `成功数量`
- record `失败数量`
- record `生成结果路径/链接`
- record `最终状态`
- record `备注` with failed image ids and exact reasons when any fail

If all images succeed, set `最终状态` = `成功` and task `任务状态` = `生成完成`.

If some or all images fail, set `最终状态` = `部分成功` or `失败` as appropriate and task `任务状态` = `执行失败`. Never record a failed or partial batch as fully successful.

## 查看任务

When receiving `查看任务 VIS-XXXX`, use read-only mode. Do not modify or save the workbook.

Return a concise summary:

- product number
- platform
- set count
- per-set and total image count
- current scheme version
- approved version
- lock status
- current task status
- latest execution status
- whether an error exists

## Version Governance

Use strict scheme versioning:

```text
V1
-> user requests changes
-> V2
-> user requests changes
-> V3
-> user approves
-> 已批准版本 = V3
-> 方案锁定 = 是
-> 执行生图 is allowed
```

Historical versions are permanent. Never overwrite old scheme rows. Locked versions are frozen. Any post-lock changes require a new version and another human approval/lock cycle.

## Blocking Conditions

Return `BLOCKED` and stop for:

- workbook not found
- task id not found
- duplicate task id rows
- missing product number
- product not found in the platform
- missing required Excel user fields
- image structure cannot be parsed
- reference-image requirement conflict
- modification requested without modification comments
- generation requested without approved version
- generation requested when `方案锁定` is not `是`
- approved scheme version not found
- product reference images cannot be read
- visual platform call failure
- workbook write/verification failure

When blocked, do not continue to the next phase. Write the reason to `错误信息` when the task row exists and the command is not read-only.
