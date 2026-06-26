import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholderPage } from "@/components/layout/ModulePlaceholderPage";

export default function HistoryPage() {
  return (
    <AppShell>
      <ModulePlaceholderPage
        title="History"
        subtitle="View generation history."
        searchPlaceholder="Search history"
        emptyTitle="No history yet"
        emptyDescription="Generation history, revisions, and activity placeholders will appear here."
      />
    </AppShell>
  );
}
