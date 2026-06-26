import type { InputHTMLAttributes } from "react";

type AppSearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function AppSearchBar({
  className = "",
  placeholder = "Search",
  ...props
}: AppSearchBarProps) {
  return (
    <div
      className={[
        "flex h-10 items-center rounded-lg border border-blue-100 bg-white px-3",
        "focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100",
        className,
      ].join(" ")}
    >
      <span className="mr-2 text-sm font-semibold text-blue-500">S</span>
      <input
        className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        type="search"
        {...props}
      />
    </div>
  );
}
