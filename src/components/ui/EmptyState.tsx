import { AppButton } from "./AppButton";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function EmptyState({ actionLabel, description, title }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
        ES
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel ? (
        <AppButton className="mt-5" size="sm">
          {actionLabel}
        </AppButton>
      ) : null}
    </div>
  );
}
