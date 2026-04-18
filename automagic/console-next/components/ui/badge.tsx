import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "sky" | "teal" | "gold" | "green" | "red" | "amber" | "slate";

const TONES: Record<Tone, string> = {
  sky: "bg-sky-brand-50 text-sky-brand-600 border-sky-brand/30",
  teal: "bg-teal-brand-50 text-teal-brand-600 border-teal-brand/30",
  gold: "bg-gold-brand-50 text-gold-brand-600 border-gold-brand/30",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
  amber: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  slate: "bg-surface-alt text-muted-strong border-border",
};

export function Badge({
  tone = "slate",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
