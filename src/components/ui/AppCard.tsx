import type { HTMLAttributes, ReactNode } from "react";

type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  withShadow?: boolean;
};

export function AppCard({
  children,
  className = "",
  withShadow = true,
  ...props
}: AppCardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-blue-100 bg-white",
        withShadow ? "shadow-sm shadow-blue-100/70" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
