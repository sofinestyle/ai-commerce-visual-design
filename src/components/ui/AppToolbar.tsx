import type { ReactNode } from "react";

type AppToolbarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AppToolbar({ actions, subtitle, title }: AppToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
