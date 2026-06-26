export function LoadingState() {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70">
      <div className="h-4 w-32 rounded bg-blue-50" />
      <div className="mt-4 space-y-3">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}
