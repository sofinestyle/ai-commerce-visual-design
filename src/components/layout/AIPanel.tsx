export function AIPanel() {
  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-blue-100 bg-slate-50">
      <div className="border-b border-blue-100 bg-white px-5 py-4">
        <p className="text-sm font-medium text-blue-600">AI Panel</p>
        <h2 className="text-base font-semibold text-slate-950">Assistant placeholder</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 text-sm text-slate-500">
        <div className="rounded-lg border border-blue-100 bg-white p-4">
          Prompt placeholder
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-4">
          Suggestions placeholder
        </div>
      </div>
    </aside>
  );
}
