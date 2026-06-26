import type { HTMLAttributes, ReactNode } from "react";

type AppBadgeVariant = "default" | "success" | "warning" | "danger";

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: AppBadgeVariant;
};

const badgeClasses: Record<AppBadgeVariant, string> = {
  default: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function AppBadge({
  children,
  className = "",
  variant = "default",
  ...props
}: AppBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        badgeClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
