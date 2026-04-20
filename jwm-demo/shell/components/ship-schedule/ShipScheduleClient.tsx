"use client";

/**
 * ShipScheduleClient — mode toggle between calendar heatmap and grouped list.
 */
import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import type { ShipScheduleGroup } from "@/lib/erpnext-live";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { GroupedListView } from "./GroupedListView";
import { DaySidePanel } from "./DaySidePanel";

interface Props {
  groups: ShipScheduleGroup[];
}

export function ShipScheduleClient({ groups }: Props) {
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [selected, setSelected] = useState<string | null>(null);

  const selectedGroup = selected ? groups.find((g) => g.date === selected) ?? null : null;

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              mode === "calendar" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              mode === "list" ? "bg-[#064162] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <List className="w-4 h-4" /> Grouped list
          </button>
        </div>
      </div>

      {mode === "calendar" ? (
        <div className="jwm-card p-5 bg-white border border-slate-200 rounded-lg">
          <CalendarHeatmap
            groups={groups}
            weeks={10}
            onSelect={(d) => setSelected(d)}
            selected={selected}
          />
        </div>
      ) : (
        <GroupedListView groups={groups} />
      )}

      <DaySidePanel group={selectedGroup} onClose={() => setSelected(null)} />
    </>
  );
}
