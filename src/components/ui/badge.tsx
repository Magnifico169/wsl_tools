import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
        variant === "success" && "bg-green-500/15 text-green-600 dark:text-green-400",
        variant === "warning" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        variant === "muted" && "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        className,
      )}
      {...props}
    />
  );
}
