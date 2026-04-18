import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "navy" | "gold" | "green" | "red" | "amber" | "slate";

const TONES: Record<Tone, string> = {
  navy: "bg-[#eaf3f8] text-[#064162] border-[#cfe1ec]",
  gold: "bg-[#fdf2e3] text-[#8a5716] border-[#f3d7a8]",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  red: "bg-red-50 text-red-800 border-red-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
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
