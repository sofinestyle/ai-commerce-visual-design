import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholderPage } from "@/components/layout/ModulePlaceholderPage";

export default function SettingsPage() {
  return (
    <AppShell>
      <ModulePlaceholderPage
        title="Settings"
        subtitle="Configure application preferences."
        searchPlaceholder="Search settings"
        emptyTitle="Settings module"
        emptyDescription="Workspace preferences and platform configuration placeholders will appear here."
      />
    </AppShell>
  );
}
