import { cn } from "@/lib/cn";

export function AegisMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-fg", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 3.5 6 8.2v7.3c0 6.2 4.1 11.6 10 13 5.9-1.4 10-6.8 10-13V8.2L16 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 11v10M12.2 16.2 16 21l3.8-4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
