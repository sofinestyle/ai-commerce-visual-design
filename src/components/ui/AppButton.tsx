import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonVariant = "primary" | "secondary" | "ghost";
type AppButtonSize = "sm" | "md" | "lg";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
};

const variantClasses: Record<AppButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700",
  secondary:
    "border border-blue-200 bg-white text-blue-700 shadow-sm shadow-blue-100/70 hover:bg-blue-50",
  ghost: "bg-transparent text-slate-600 hover:bg-blue-50 hover:text-blue-700",
};

const sizeClasses: Record<AppButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function AppButton({
  children,
  className = "",
  disabled,
  size = "md",
  variant = "primary",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
