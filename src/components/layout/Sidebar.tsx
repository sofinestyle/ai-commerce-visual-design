import { primaryNavigation } from "@/config/navigation";

export function Sidebar() {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-blue-100 bg-slate-50">
      <div className="flex h-16 items-center border-b border-blue-100 px-5">
        <div>
          <p className="text-sm font-semibold text-slate-950">AI 电商视觉设计平台</p>
          <p className="text-xs text-slate-500">Sidebar placeholder</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {primaryNavigation.map((item) => (
          <a
            key={item.id}
            href={item.path}
            className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600"
            aria-disabled={!item.enabled}
            title={item.description}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-semibold uppercase text-blue-600">
              {item.icon}
            </span>
            <span className="truncate">{item.title}</span>
          </a>
        ))}
      </nav>
      <div className="border-t border-blue-100 p-4 text-xs text-slate-500">
        Collapse ready placeholder
      </div>
    </aside>
  );
}
