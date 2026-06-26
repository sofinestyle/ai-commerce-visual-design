import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppToolbar,
  PageTitle,
} from "@/components/ui";

const workflows = [
  {
    name: "Amazon Hero Image Flow",
    status: "Draft",
    updatedAt: "2026-06-26",
  },
  {
    name: "Tmall Campaign Batch",
    status: "Ready",
    updatedAt: "2026-06-25",
  },
  {
    name: "TikTok Product Video Prep",
    status: "Paused",
    updatedAt: "2026-06-24",
  },
  {
    name: "Shopify Collection Export",
    status: "Archived",
    updatedAt: "2026-06-22",
  },
];

const workflowSteps = [
  {
    title: "Import Product",
    description: "Load selected product context into the workflow.",
    badge: "Input",
  },
  {
    title: "Select Media",
    description: "Choose source images and reference assets.",
    badge: "Asset",
  },
  {
    title: "Prompt",
    description: "Prepare generation direction and visual constraints.",
    badge: "Text",
  },
  {
    title: "AI Model",
    description: "Select future model provider and generation preset.",
    badge: "Model",
  },
  {
    title: "Generate",
    description: "Placeholder node for future image generation.",
    badge: "Run",
  },
  {
    title: "Compare",
    description: "Review output candidates before approval.",
    badge: "Review",
  },
  {
    title: "Export",
    description: "Prepare final assets for platform delivery.",
    badge: "Output",
  },
];

const executionLogs = [
  "09:12 Workflow canvas initialized",
  "09:14 Product import node configured",
  "09:18 Media selection placeholder attached",
  "09:21 Prompt node awaiting human review",
  "09:24 Execution disabled in UI-only mode",
];

export default function WorkflowPage() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="Workflow Center"
            subtitle="Design and review the AI commerce visual production flow."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Workflow Builder"
              subtitle="High-fidelity UI preview for workflow planning."
              actions={
                <>
                  <AppButton size="sm">New Workflow</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Duplicate
                  </AppButton>
                  <AppButton size="sm" variant="ghost">
                    Save Draft
                  </AppButton>
                </>
              }
            />
          </AppCard>

          <section className="grid min-h-[620px] grid-cols-[260px_1fr_320px] gap-5">
            <AppCard className="overflow-hidden">
              <div className="border-b border-blue-100 p-4">
                <AppToolbar
                  title="Workflow List"
                  subtitle="Saved workflow drafts."
                  actions={<AppButton size="sm" variant="ghost">Filter</AppButton>}
                />
              </div>
              <div className="space-y-3 p-4">
                {workflows.map((workflow, index) => (
                  <button
                    key={workflow.name}
                    className={[
                      "w-full rounded-lg border p-4 text-left transition",
                      index === 0
                        ? "border-blue-200 bg-blue-50"
                        : "border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50/60",
                    ].join(" ")}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {workflow.name}
                      </p>
                      <AppBadge>{workflow.status}</AppBadge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Updated {workflow.updatedAt}
                    </p>
                  </button>
                ))}
              </div>
            </AppCard>

            <AppCard className="overflow-hidden">
              <div className="border-b border-blue-100 p-4">
                <AppToolbar
                  title="Workflow Editor"
                  subtitle="Step flow canvas for future execution logic."
                  actions={
                    <>
                      <AppButton size="sm" variant="secondary">
                        Validate
                      </AppButton>
                      <AppButton size="sm" disabled>
                        Execute
                      </AppButton>
                    </>
                  }
                />
              </div>
              <div className="bg-slate-50 p-6">
                <div className="flex flex-col gap-4">
                  {workflowSteps.map((step, index) => (
                    <div key={step.title} className="flex items-center gap-4">
                      <AppCard className="flex flex-1 items-center justify-between p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-950">
                              {step.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {step.description}
                            </p>
                          </div>
                        </div>
                        <AppBadge>{step.badge}</AppBadge>
                      </AppCard>
                      {index < workflowSteps.length - 1 ? (
                        <div className="text-lg font-semibold text-blue-300">↓</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </AppCard>

            <AppCard className="overflow-hidden">
              <div className="border-b border-blue-100 p-4">
                <AppToolbar
                  title="Properties"
                  subtitle="Selected node settings."
                />
              </div>
              <div className="space-y-4 p-4">
                <AppInput label="Workflow Name" value="Amazon Hero Image Flow" readOnly />
                <AppInput label="Selected Step" value="Prompt" readOnly />
                <AppInput label="Owner" value="Design Operations" readOnly />
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Step Status</p>
                  <div className="flex gap-2">
                    <AppBadge variant="warning">Pending Review</AppBadge>
                    <AppBadge>UI Only</AppBadge>
                  </div>
                </div>
                <AppCard className="p-4" withShadow={false}>
                  <p className="text-sm font-semibold text-slate-950">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Properties are placeholders for future workflow configuration.
                    No node execution or business logic is active.
                  </p>
                </AppCard>
              </div>
            </AppCard>
          </section>

          <AppCard className="overflow-hidden">
            <div className="border-b border-blue-100 p-4">
              <AppToolbar
                title="Execution Log"
                subtitle="Static placeholder log for workflow visibility."
                actions={<AppButton size="sm" variant="ghost">Clear</AppButton>}
              />
            </div>
            <div className="grid grid-cols-5 gap-3 bg-slate-50 p-4">
              {executionLogs.map((log) => (
                <div
                  key={log}
                  className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                >
                  {log}
                </div>
              ))}
            </div>
          </AppCard>
        </div>
      </main>
    </AppShell>
  );
}
