"use client";

import Image from "next/image";
import { PROJECTS } from "@/lib/canned/projects";

// Infinite horizontal marquee of real JWM projects scraped from jwmcd.com.
// Purely visual; reinforces that the demo is wired to real context.
export function ProjectMarquee() {
  // duplicate to create seamless loop
  const items = [...PROJECTS, ...PROJECTS];
  return (
    <div className="relative bg-[#051f2e] border-t border-white/10 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#051f2e] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#051f2e] to-transparent z-10 pointer-events-none" />
      <div className="py-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[#e69b40] font-semibold text-center mb-4">
          Selected Work · 1938 — Today
        </div>
        <div className="flex gap-4 jwm-marquee">
          {items.map((p, i) => (
            <div
              key={`${p.slug}-${i}`}
              className="shrink-0 w-56 h-36 relative rounded-xl overflow-hidden group"
            >
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="224px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="text-xs font-semibold leading-tight truncate">{p.name}</div>
                <div className="text-[10px] text-white/70 mt-0.5">
                  {p.location} · {p.year}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
