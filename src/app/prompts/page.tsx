import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppSearchBar,
  AppToolbar,
  PageTitle,
} from "@/components/ui";
import {
  mockPrompts,
  type PromptCategory,
  type PromptPlatform,
  type PromptStatus,
} from "@/lib/mockPrompts";

const categoryOptions: Array<"All Categories" | PromptCategory> = [
  "All Categories",
  "Amazon",
  "Temu",
  "Tmall",
  "TikTok",
  "Shopify",
  "Banner",
  "Detail",
  "White Background",
  "Lifestyle",
];
const platformOptions: Array<"All Platforms" | PromptPlatform> = [
  "All Platforms",
  "Amazon",
  "Temu",
  "Tmall",
  "TikTok",
  "Shopify",
];
const modelOptions = ["All Models", "OpenAI Image", "Gemini Vision", "Flux Pro", "Local Draft"];

const statusBadgeVariant: Record<PromptStatus, "default" | "success" | "warning" | "danger"> = {
  Draft: "default",
  Ready: "success",
  Review: "warning",
  Archived: "danger",
};

const selectedPrompt = mockPrompts[0];

export default function PromptsPage() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="Prompt Center"
            subtitle="Manage reusable prompt assets for AI commerce visual workflows."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Prompt Library"
              subtitle="High-fidelity prompt asset management UI."
              actions={
                <>
                  <AppButton size="sm">New Prompt</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Import
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Export
                  </AppButton>
                </>
              }
            />
            <div className="mt-5 grid grid-cols-[1fr_190px_170px_170px] gap-3">
              <AppSearchBar placeholder="Search prompts" />
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {modelOptions.map((model) => (
                  <option key={model}>{model}</option>
                ))}
              </select>
            </div>
          </AppCard>

          <section className="grid grid-cols-[1fr_360px] gap-5">
            <div className="grid grid-cols-3 gap-5">
              {mockPrompts.slice(0, 24).map((prompt) => (
                <AppCard
                  key={prompt.id}
                  className="cursor-pointer p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {prompt.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">{prompt.model}</p>
                    </div>
                    <div className="text-lg text-blue-500">
                      {prompt.favorite ? "★" : "☆"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <AppBadge>{prompt.platform}</AppBadge>
                    <AppBadge>{prompt.category}</AppBadge>
                    <AppBadge variant={statusBadgeVariant[prompt.status]}>
                      {prompt.status}
                    </AppBadge>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                    {prompt.content}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <AppBadge key={tag} variant="default">
                        {tag}
                      </AppBadge>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-blue-50 pt-4 text-xs font-medium text-slate-500">
                    <span>{prompt.version}</span>
                    <span>Updated {prompt.updatedAt}</span>
                  </div>
                </AppCard>
              ))}
            </div>

            <AppCard className="sticky top-0 h-fit overflow-hidden">
              <div className="border-b border-blue-100 p-5">
                <AppToolbar
                  title="Prompt Preview"
                  subtitle="Selected prompt content and metadata."
                  actions={<AppBadge variant={statusBadgeVariant[selectedPrompt.status]}>{selectedPrompt.status}</AppBadge>}
                />
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {selectedPrompt.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPrompt.platform} / {selectedPrompt.category}
                  </p>
                </div>

                <AppCard className="bg-slate-50 p-4" withShadow={false}>
                  <p className="text-xs font-semibold uppercase text-blue-600">
                    Prompt Content
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {selectedPrompt.content}
                  </p>
                </AppCard>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-950">Variables</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.variables.map((variable) => (
                      <AppBadge key={variable}>{`{{${variable}}}`}</AppBadge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <AppCard className="p-4" withShadow={false}>
                    <p className="text-xs text-slate-500">Version</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {selectedPrompt.version}
                    </p>
                  </AppCard>
                  <AppCard className="p-4" withShadow={false}>
                    <p className="text-xs text-slate-500">Model</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {selectedPrompt.model}
                    </p>
                  </AppCard>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-600">
                  Preview is static. Editing, AI execution, persistence, and API
                  connections are intentionally disabled in this version.
                </div>
              </div>
            </AppCard>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
