export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-blue-100 bg-white px-6">
      <div>
        <p className="text-sm font-medium text-blue-600">AI Commerce Visual Design</p>
        <h1 className="text-lg font-semibold text-slate-950">Workspace</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>Project placeholder</span>
        <div className="h-9 w-9 rounded-full border border-blue-100 bg-blue-50" />
      </div>
    </header>
  );
}
