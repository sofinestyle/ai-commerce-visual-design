import {
  AppCard,
  AppSearchBar,
  AppToolbar,
  EmptyState,
  PageTitle,
} from "@/components/ui";

type ModulePlaceholderPageProps = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  searchPlaceholder: string;
};

export function ModulePlaceholderPage({
  emptyDescription,
  emptyTitle,
  searchPlaceholder,
  subtitle,
  title,
}: ModulePlaceholderPageProps) {
  return (
    <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageTitle title={title} subtitle={subtitle} />

        <AppToolbar
          title={`${title} Workspace`}
          subtitle="Placeholder workspace for future module tools."
          actions={<AppSearchBar className="w-80" placeholder={searchPlaceholder} />}
        />

        <AppCard className="p-6">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel="Coming Soon"
          />
        </AppCard>
      </div>
    </main>
  );
}
