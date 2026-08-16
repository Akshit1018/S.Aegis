import { cn } from "@/lib/cn";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-elevated", className)}>
      <div
        className={cn("h-full rounded-full bg-fg transition-[width] duration-300 ease-out", barClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
