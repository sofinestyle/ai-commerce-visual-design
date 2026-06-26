import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppSearchBar,
  AppToolbar,
  PageTitle,
} from "@/components/ui";
import { mockProjects, type ProjectStatus } from "@/lib/mockProjects";

const platformOptions = ["All Platforms", "Amazon", "Temu", "Tmall", "TikTok", "Shopify"];
const statusOptions = ["All Status", "Draft", "Working", "Completed", "Archived"];

const statusBadgeVariant: Record<ProjectStatus, "default" | "success" | "warning" | "danger"> = {
  Draft: "default",
  Working: "warning",
  Completed: "success",
  Archived: "danger",
};

export default function ProjectsPage() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="Projects"
            subtitle="Manage all visual design projects and prepare structured AI image workflows."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Project Management"
              subtitle="High-fidelity placeholder workspace for project planning."
              actions={
                <>
                  <AppButton size="sm">New Project</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Import
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Export
                  </AppButton>
                </>
              }
            />
            <div className="mt-5 grid grid-cols-[1fr_180px_160px_auto] gap-3">
              <AppSearchBar placeholder="Search projects" />
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <AppButton variant="ghost">Sort Updated</AppButton>
            </div>
          </AppCard>

          <section className="grid grid-cols-3 gap-5">
            {mockProjects.map((project) => (
              <AppCard
                key={project.id}
                className="group cursor-pointer overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100"
              >
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                  <div className="absolute left-4 top-4 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                    {project.thumbnail}
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white text-lg font-semibold text-blue-600 shadow-sm">
                    {project.platform.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-950">
                        {project.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {project.description}
                      </p>
                    </div>
                    <AppBadge>{project.platform}</AppBadge>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-y border-blue-50 py-4">
                    <div>
                      <p className="text-xs text-slate-500">Products</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {project.productCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Images</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {project.imageCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Language</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                        {project.language}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Updated</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {project.updatedAt}
                      </p>
                    </div>
                    <AppBadge variant={statusBadgeVariant[project.status]}>
                      {project.status}
                    </AppBadge>
                  </div>
                </div>
              </AppCard>
            ))}
          </section>

          <AppCard className="flex items-center justify-between p-4">
            <AppButton variant="secondary">Previous</AppButton>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Page 1 of 2
            </div>
            <AppButton variant="secondary">Next</AppButton>
          </AppCard>
        </div>
      </main>
    </AppShell>
  );
}
