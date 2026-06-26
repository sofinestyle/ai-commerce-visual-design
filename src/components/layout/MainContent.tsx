const quickActions = [
  {
    title: "New Project",
    description: "Start a new visual workflow for product campaigns.",
  },
  {
    title: "Product Library",
    description: "Review product assets and commerce-ready details.",
  },
  {
    title: "Media Library",
    description: "Organize source images, exports, and brand materials.",
  },
  {
    title: "AI Generate",
    description: "Prepare prompts for future AI image generation.",
  },
];

const recentProjects = [
  {
    project: "Summer Skincare Launch",
    platform: "Tmall",
    products: "24",
    updated: "Today",
  },
  {
    project: "Premium Coffee Set",
    platform: "JD",
    products: "12",
    updated: "Yesterday",
  },
  {
    project: "Home Storage Refresh",
    platform: "Amazon",
    products: "18",
    updated: "Jun 24",
  },
  {
    project: "Athleisure Collection",
    platform: "Shopify",
    products: "36",
    updated: "Jun 22",
  },
  {
    project: "Smart Desk Campaign",
    platform: "Douyin",
    products: "9",
    updated: "Jun 20",
  },
];

const statistics = [
  { label: "Projects", value: "48" },
  { label: "Products", value: "1,284" },
  { label: "Generated Images", value: "6,392" },
  { label: "Today's Tasks", value: "17" },
];

export function MainContent() {
  return (
    <main className="min-w-0 flex-1 overflow-auto bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <section className="rounded-xl border border-blue-100 bg-white p-8 shadow-sm shadow-blue-100/70">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Professional AI Product Image Workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                AI 电商视觉设计平台
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200">
                New Project
              </button>
              <button className="rounded-lg border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm shadow-blue-100/70">
                Import Product
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-950">Quick Actions</h3>
            <p className="text-sm text-slate-500">Placeholder workflows</p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <article
                key={action.title}
                className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                  AI
                </div>
                <h4 className="mt-4 text-base font-semibold text-slate-950">
                  {action.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {action.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-[1fr_320px] gap-6">
          <div className="rounded-xl border border-blue-100 bg-white shadow-sm shadow-blue-100/70">
            <div className="border-b border-blue-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-950">
                Recent Projects
              </h3>
            </div>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Platform</th>
                  <th className="px-5 py-3 font-medium">Products</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {recentProjects.map((project) => (
                  <tr key={project.project}>
                    <td className="px-5 py-4 font-medium text-slate-950">
                      {project.project}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{project.platform}</td>
                    <td className="px-5 py-4 text-slate-600">{project.products}</td>
                    <td className="px-5 py-4 text-slate-500">{project.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Statistics</h3>
            <div className="grid gap-4">
              {statistics.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70"
                >
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-blue-600">
                    {stat.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
