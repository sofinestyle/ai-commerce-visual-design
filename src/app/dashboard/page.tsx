import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholderPage } from "@/components/layout/ModulePlaceholderPage";

export default function DashboardPage() {
  return (
    <AppShell>
      <ModulePlaceholderPage
        title="Dashboard"
        subtitle="Monitor workspace activity and visual production progress."
        searchPlaceholder="Search dashboard"
        emptyTitle="Dashboard module"
        emptyDescription="Dashboard tools and workspace summaries will appear here."
      />
    </AppShell>
  );
}
