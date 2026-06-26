import type { ReactNode } from "react";

import { AIPanel } from "./AIPanel";
import { AppHeader } from "./AppHeader";
import { MainContent } from "./MainContent";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen min-w-[1200px] overflow-hidden bg-white text-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <div className="flex min-h-0 flex-1">
          {children ?? <MainContent />}
          <AIPanel />
        </div>
      </div>
    </div>
  );
}
