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
  mockMediaAssets,
  type MediaSource,
  type MediaStatus,
  type MediaType,
} from "@/lib/mockMedia";

const typeOptions: Array<"All Types" | MediaType> = [
  "All Types",
  "image",
  "psd",
  "png",
  "jpg",
  "webp",
];
const sourceOptions: Array<"All Sources" | MediaSource> = [
  "All Sources",
  "Camera",
  "Upload",
  "AI",
];
const statusOptions: Array<"All Status" | MediaStatus> = [
  "All Status",
  "Draft",
  "Ready",
  "Processing",
  "Archived",
];

const statusBadgeVariant: Record<MediaStatus, "default" | "success" | "warning" | "danger"> = {
  Draft: "default",
  Ready: "success",
  Processing: "warning",
  Archived: "danger",
};

const sourceBadgeVariant: Record<MediaSource, "default" | "success" | "warning" | "danger"> = {
  Camera: "default",
  Upload: "success",
  AI: "warning",
};

export default function MediaPage() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <PageTitle
              title="Media Library"
              subtitle="Store, browse, and organize product images, PSD files, and AI-ready assets."
            />
            <div className="flex rounded-lg border border-blue-100 bg-white p-1 shadow-sm shadow-blue-100/70">
              <AppButton size="sm">Grid</AppButton>
              <AppButton size="sm" variant="ghost">
                List
              </AppButton>
            </div>
          </div>

          <AppCard className="p-5">
            <AppToolbar
              title="Asset Management"
              subtitle="High-fidelity placeholder workspace for media operations."
              actions={
                <>
                  <AppButton size="sm">Upload</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Import
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Delete
                  </AppButton>
                </>
              }
            />
            <div className="mt-5 grid grid-cols-[1fr_140px_150px_160px_auto] gap-3">
              <AppSearchBar placeholder="Search media assets" />
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {typeOptions.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {sourceOptions.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <AppButton variant="ghost">Sort</AppButton>
            </div>
          </AppCard>

          <section className="grid grid-cols-4 gap-5">
            {mockMediaAssets.slice(0, 32).map((asset) => (
              <AppCard
                key={asset.id}
                className="group relative cursor-pointer overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100"
              >
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                  <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                    {asset.thumbnail}
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white text-sm font-semibold uppercase text-blue-600 shadow-sm">
                    {asset.type}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-950">
                        {asset.name}
                      </h3>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {asset.filename}
                      </p>
                    </div>
                    <AppBadge variant={statusBadgeVariant[asset.status]}>
                      {asset.status}
                    </AppBadge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-y border-blue-50 py-3">
                    <div>
                      <p className="text-xs text-slate-500">Size</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {asset.width}x{asset.height}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Format</p>
                      <p className="mt-1 text-sm font-semibold uppercase text-slate-950">
                        {asset.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">File</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {asset.fileSize}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {asset.tags.map((tag) => (
                      <AppBadge key={tag}>{tag}</AppBadge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <AppBadge variant={sourceBadgeVariant[asset.source]}>
                      {asset.source}
                    </AppBadge>
                    <p className="text-xs font-medium text-slate-500">
                      Updated {asset.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="pointer-events-none absolute right-3 top-3 w-32 rounded-lg border border-blue-100 bg-white py-1 text-sm font-medium text-slate-600 opacity-0 shadow-md shadow-blue-100 transition group-hover:opacity-100">
                  <div className="px-3 py-2">Preview</div>
                  <div className="px-3 py-2">Rename</div>
                  <div className="px-3 py-2">Download</div>
                  <div className="px-3 py-2 text-red-600">Delete</div>
                </div>
              </AppCard>
            ))}
          </section>

          <AppCard className="flex items-center justify-between p-4">
            <AppButton variant="secondary">Previous</AppButton>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Page 1 of 4
            </div>
            <AppButton variant="secondary">Next</AppButton>
          </AppCard>
        </div>
      </main>
    </AppShell>
  );
}
