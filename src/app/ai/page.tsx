import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppToolbar,
  PageTitle,
} from "@/components/ui";

const contextPanels = [
  {
    title: "Project",
    items: ["Amazon Hero Image Flow", "Tmall Campaign Batch", "Shopify Export Set"],
  },
  {
    title: "Product",
    items: ["Hydrating Serum Set", "Premium Coffee Beans", "Smart Standing Desk"],
  },
  {
    title: "Media",
    items: ["Hero Front View", "Transparent Cutout", "Lifestyle Scene"],
  },
];

const variables = ["productName", "platform", "sellingPoint", "sourceMedia"];
const promptTemplates = [
  "White background marketplace image",
  "Premium lifestyle scene",
  "Detail closeup with feature callouts",
];
const queueItems = [
  { label: "Waiting", count: 8, variant: "default" as const },
  { label: "Generating", count: 3, variant: "warning" as const },
  { label: "Completed", count: 24, variant: "success" as const },
  { label: "Failed", count: 2, variant: "danger" as const },
];

export default function AIPage() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="AI Workspace"
            subtitle="Control center for AI product image production workflows."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Generation Control"
              subtitle="High-fidelity UI only. No generation engine is connected."
              actions={
                <>
                  <AppButton size="sm">Generate</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Batch Generate
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Save Prompt
                  </AppButton>
                  <AppButton size="sm" variant="ghost">
                    History
                  </AppButton>
                  <AppButton size="sm" variant="ghost">
                    Refresh
                  </AppButton>
                </>
              }
            />
          </AppCard>

          <section className="grid min-h-[640px] grid-cols-[240px_1fr_300px] gap-5">
            <div className="flex flex-col gap-4">
              {contextPanels.map((panel) => (
                <AppCard key={panel.title} className="overflow-hidden">
                  <div className="border-b border-blue-100 p-4">
                    <h2 className="text-base font-semibold text-slate-950">
                      {panel.title}
                    </h2>
                  </div>
                  <div className="space-y-2 p-3">
                    {panel.items.map((item, index) => (
                      <button
                        key={item}
                        className={[
                          "w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition",
                          index === 0
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/70",
                        ].join(" ")}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </AppCard>
              ))}
            </div>

            <AppCard className="overflow-hidden">
              <div className="border-b border-blue-100 p-5">
                <AppToolbar
                  title="Prompt Editor"
                  subtitle="Compose structured prompts for product image generation."
                  actions={<AppBadge>Draft</AppBadge>}
                />
              </div>
              <div className="space-y-5 p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Prompt
                  </span>
                  <textarea
                    className="min-h-40 w-full resize-none rounded-lg border border-blue-100 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Describe the desired e-commerce product image..."
                    defaultValue="Create a clean premium marketplace image for {{productName}} using {{sourceMedia}}. Highlight {{sellingPoint}} and optimize the composition for {{platform}}."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Negative Prompt
                  </span>
                  <textarea
                    className="min-h-24 w-full resize-none rounded-lg border border-blue-100 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Describe what should be avoided..."
                    defaultValue="Avoid distorted product details, unreadable text, extra objects, incorrect packaging, and low-quality lighting."
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <AppCard className="p-4" withShadow={false}>
                    <p className="text-sm font-semibold text-slate-950">Variables</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <AppBadge key={variable}>{`{{${variable}}}`}</AppBadge>
                      ))}
                    </div>
                  </AppCard>

                  <AppCard className="p-4" withShadow={false}>
                    <p className="text-sm font-semibold text-slate-950">
                      Prompt Templates
                    </p>
                    <div className="mt-3 space-y-2">
                      {promptTemplates.map((template) => (
                        <div
                          key={template}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-slate-600"
                        >
                          {template}
                        </div>
                      ))}
                    </div>
                  </AppCard>
                </div>
              </div>
            </AppCard>

            <AppCard className="overflow-hidden">
              <div className="border-b border-blue-100 p-5">
                <AppToolbar title="AI Parameters" subtitle="Static generation settings." />
              </div>
              <div className="space-y-4 p-5">
                <AppInput label="Model" value="OpenAI Image" readOnly />
                <AppInput label="Platform" value="Amazon" readOnly />
                <AppInput label="Size" value="1200 x 1200" readOnly />
                <AppInput label="Quality" value="High" readOnly />
                <AppInput label="Count" value="4" readOnly />
                <AppInput label="Seed" value="42817" readOnly />
                <AppInput label="Style" value="Premium SaaS Commerce" readOnly />
                <AppCard className="bg-blue-50 p-4" withShadow={false}>
                  <p className="text-sm leading-6 text-slate-600">
                    Parameters are placeholders. No AI model, API, database, upload,
                    or image generation workflow is connected.
                  </p>
                </AppCard>
              </div>
            </AppCard>
          </section>

          <AppCard className="overflow-hidden">
            <div className="border-b border-blue-100 p-5">
              <AppToolbar
                title="Generate Queue"
                subtitle="Static queue state for future generation tasks."
              />
            </div>
            <div className="grid grid-cols-4 gap-4 p-5">
              {queueItems.map((item) => (
                <AppCard key={item.label} className="p-4" withShadow={false}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <AppBadge variant={item.variant}>{item.label}</AppBadge>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {item.count}
                  </p>
                </AppCard>
              ))}
            </div>
          </AppCard>
        </div>
      </main>
    </AppShell>
  );
}
