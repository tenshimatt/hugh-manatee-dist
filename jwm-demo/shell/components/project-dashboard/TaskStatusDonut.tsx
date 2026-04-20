"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TaskStatusSlice } from "@/lib/canned/active-projects";

const COLORS: Record<TaskStatusSlice["status"], string> = {
  "Not Started": "#cbd5e1",
  "In Progress": "#C9A349",
  Complete: "#0A2E5C",
};

export function TaskStatusDonut({ data }: { data: TaskStatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const done = data.find((d) => d.status === "Complete")?.count ?? 0;
  const donePct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 flex flex-col">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold text-center">
        Project Task Status
      </div>
      <div className="relative h-28 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={32}
              outerRadius={50}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.status} fill={COLORS[d.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${v} tasks`, String(n)]}
              contentStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-lg font-bold text-[#0A2E5C] leading-none">{donePct}%</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Done</div>
        </div>
      </div>
      <ul className="mt-2 space-y-1">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: COLORS[d.status] }}
            />
            <span className="text-slate-600 flex-1">{d.status}</span>
            <span className="font-semibold text-slate-800">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
