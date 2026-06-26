import type { InputHTMLAttributes } from "react";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function AppInput({
  className = "",
  error,
  id,
  label,
  ...props
}: AppInputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </span>
      ) : null}
      <input
        className={[
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition-colors",
          "placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
          error ? "border-red-300" : "border-blue-100",
          className,
        ].join(" ")}
        id={inputId}
        {...props}
      />
      {error ? <span className="mt-2 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
