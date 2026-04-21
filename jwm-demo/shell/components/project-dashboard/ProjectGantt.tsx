"use client";

/**
 * ProjectGantt — pure SVG Gantt chart, no external deps.
 *
 * Accepts a flat task list (with optional indent + parent-linkage for WBS) and
 * renders: month header strip · row per task · color-coded bar by status ·
 * progress overlay · today line. Dependency lines are drawn if any task has
 * `dependencies` set.
 */
import { useMemo, useState } from "react";

export interface GanttTask {
  id: string;
  name: string;
  start: string;      // ISO date
  end: string;        // ISO date
  progress?: number;  // 0..1
  parent?: string;
  dependencies?: string[];
  status?: "complete" | "in_progress" | "pending" | "behind" | "blocked";
  indent?: number;    // for WBS rendering (0 = root)
}

const STATUS_COLOURS: Record<NonNullable<GanttTask["status"]>, { bar: string; progress: string }> = {
  complete:    { bar: "#94a3b8", progress: "#10b981" },
  in_progress: { bar: "#fde68a", progress: "#f59e0b" },
  pending:     { bar: "#e2e8f0", progress: "#64748b" },
  behind:      { bar: "#fecaca", progress: "#dc2626" },
  blocked:     { bar: "#f3e8ff", progress: "#a855f7" },
};

const DEFAULT_ROW_HEIGHT = 28;
const HEADER_HEIGHT = 44;
const LABEL_WIDTH = 260;

function parseDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = new Date(s.length <= 10 ? s + "T00:00:00Z" : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export interface ProjectGanttProps {
  tasks: GanttTask[];
  startDate?: string;
  endDate?: string;
  rowHeight?: number;
  className?: string;
}

export function ProjectGantt({
  tasks,
  startDate,
  endDate,
  rowHeight = DEFAULT_ROW_HEIGHT,
  className = "",
}: ProjectGanttProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const {
    windowStart,
    windowEnd,
    months,
    totalDays,
  } = useMemo(() => {
    const parsed = tasks
      .map((t) => ({ start: parseDate(t.start), end: parseDate(t.end) }))
      .filter((p) => p.start && p.end);
    const minStart = startDate
      ? parseDate(startDate)!
      : parsed.reduce(
          (acc, p) => (!acc || p.start! < acc ? p.start! : acc),
          null as Date | null,
        );
    const maxEnd = endDate
      ? parseDate(endDate)!
      : parsed.reduce(
          (acc, p) => (!acc || p.end! > acc ? p.end! : acc),
          null as Date | null,
        );
    if (!minStart || !maxEnd) {
      return { windowStart: new Date(), windowEnd: new Date(), months: [], totalDays: 0 };
    }
    const ws = monthStart(minStart);
    const we = monthStart(addMonths(maxEnd, 1));
    const m: Array<{ label: string; start: Date; days: number }> = [];
    let cur = ws;
    while (cur < we) {
      const next = addMonths(cur, 1);
      m.push({
        label: cur.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
        start: cur,
        days: daysBetween(cur, next),
      });
      cur = next;
    }
    return { windowStart: ws, windowEnd: we, months: m, totalDays: daysBetween(ws, we) };
  }, [tasks, startDate, endDate]);

  if (tasks.length === 0 || totalDays === 0) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 ${className}`}>
        No schedule data to chart.
      </div>
    );
  }

  // Visual dimensions — the SVG is responsive width via viewBox, but we
  // compute px for pointer math. Pick a daysPerPx based on target width.
  const TARGET_PX = 960; // the bar area target width
  const dayPx = TARGET_PX / totalDays;
  const barAreaWidth = totalDays * dayPx;
  const totalWidth = LABEL_WIDTH + barAreaWidth;
  const totalHeight = HEADER_HEIGHT + tasks.length * rowHeight + 16;

  const today = new Date();
  const todayOffset = today > windowStart && today < windowEnd ? daysBetween(windowStart, today) * dayPx : null;

  const taskY = (i: number) => HEADER_HEIGHT + i * rowHeight;
  const taskIndexById = new Map(tasks.map((t, i) => [t.id, i]));

  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto ${className}`}>
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ minWidth: totalWidth, display: "block" }}
        className="font-sans"
      >
        {/* Header background */}
        <rect x="0" y="0" width={totalWidth} height={HEADER_HEIGHT} fill="#064162" />
        <text x={12} y={HEADER_HEIGHT / 2 + 4} fill="white" fontSize="11" fontWeight="700" style={{ textTransform: "uppercase", letterSpacing: "1.2px" }}>
          Task / WBS
        </text>

        {/* Month labels */}
        {months.map((m, i) => {
          const x = LABEL_WIDTH + daysBetween(windowStart, m.start) * dayPx;
          const w = m.days * dayPx;
          return (
            <g key={i}>
              <line x1={x} y1={0} x2={x} y2={totalHeight} stroke="#334155" strokeWidth={0.5} opacity={0.35} />
              <text x={x + 4} y={HEADER_HEIGHT / 2 + 4} fill="white" fontSize="10" fontWeight="600">
                {m.label}
              </text>
              {/* Month band behind tasks */}
              <rect
                x={x}
                y={HEADER_HEIGHT}
                width={w}
                height={totalHeight - HEADER_HEIGHT}
                fill={i % 2 === 0 ? "#f8fafc" : "#ffffff"}
              />
            </g>
          );
        })}

        {/* Label column background */}
        <rect x={0} y={HEADER_HEIGHT} width={LABEL_WIDTH} height={totalHeight - HEADER_HEIGHT} fill="#ffffff" />
        <line x1={LABEL_WIDTH} y1={0} x2={LABEL_WIDTH} y2={totalHeight} stroke="#cbd5e1" strokeWidth={1} />

        {/* Task rows */}
        {tasks.map((t, i) => {
          const start = parseDate(t.start);
          const end = parseDate(t.end);
          if (!start || !end) return null;
          const y = taskY(i);
          const status = t.status ?? "pending";
          const colour = STATUS_COLOURS[status];
          const x = LABEL_WIDTH + daysBetween(windowStart, start) * dayPx;
          const w = Math.max(6, daysBetween(start, end) * dayPx);
          const progress = Math.max(0, Math.min(1, t.progress ?? 0));
          const indent = t.indent ?? 0;
          const isHover = hovered === t.id;
          return (
            <g
              key={t.id}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered((h) => (h === t.id ? null : h))}
              style={{ cursor: "pointer" }}
            >
              {/* Row stripe */}
              <rect
                x={0}
                y={y}
                width={totalWidth}
                height={rowHeight}
                fill={isHover ? "#fdf2e3" : i % 2 === 0 ? "transparent" : "#f8fafc"}
              />
              {/* Label */}
              <text
                x={12 + indent * 14}
                y={y + rowHeight / 2 + 4}
                fill={indent === 0 ? "#064162" : "#1e293b"}
                fontSize={indent === 0 ? 12 : 11}
                fontWeight={indent === 0 ? 700 : 500}
              >
                {t.name.length > 36 - indent * 4 ? t.name.slice(0, 36 - indent * 4) + "…" : t.name}
              </text>
              {/* Bar */}
              <rect
                x={x}
                y={y + 6}
                width={w}
                height={rowHeight - 12}
                rx={3}
                fill={colour.bar}
                stroke={colour.progress}
                strokeWidth={0.8}
              />
              {/* Progress overlay */}
              {progress > 0 && (
                <rect
                  x={x}
                  y={y + 6}
                  width={w * progress}
                  height={rowHeight - 12}
                  rx={3}
                  fill={colour.progress}
                  opacity={0.85}
                />
              )}
              {progress > 0.15 && (
                <text
                  x={x + 4}
                  y={y + rowHeight / 2 + 3}
                  fill="white"
                  fontSize={9}
                  fontWeight={700}
                >
                  {Math.round(progress * 100)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Dependency lines */}
        {tasks.flatMap((t) =>
          (t.dependencies ?? []).map((dep) => {
            const fromIdx = taskIndexById.get(dep);
            const toIdx = taskIndexById.get(t.id);
            if (fromIdx == null || toIdx == null) return null;
            const from = tasks[fromIdx];
            const fromEnd = parseDate(from.end);
            const toStart = parseDate(t.start);
            if (!fromEnd || !toStart) return null;
            const x1 = LABEL_WIDTH + daysBetween(windowStart, fromEnd) * dayPx;
            const y1 = taskY(fromIdx) + rowHeight / 2;
            const x2 = LABEL_WIDTH + daysBetween(windowStart, toStart) * dayPx;
            const y2 = taskY(toIdx) + rowHeight / 2;
            const midX = (x1 + x2) / 2;
            return (
              <path
                key={`${dep}-${t.id}`}
                d={`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="2 2"
                fill="none"
                opacity={0.55}
                markerEnd="url(#gantt-arrow)"
              />
            );
          }),
        )}
        <defs>
          <marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Today line */}
        {todayOffset != null && (
          <g>
            <line
              x1={LABEL_WIDTH + todayOffset}
              y1={HEADER_HEIGHT}
              x2={LABEL_WIDTH + todayOffset}
              y2={totalHeight}
              stroke="#dc2626"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.8}
            />
            <rect
              x={LABEL_WIDTH + todayOffset - 14}
              y={HEADER_HEIGHT - 14}
              width={28}
              height={14}
              rx={3}
              fill="#dc2626"
            />
            <text
              x={LABEL_WIDTH + todayOffset}
              y={HEADER_HEIGHT - 3}
              fill="white"
              fontSize={9}
              fontWeight={700}
              textAnchor="middle"
            >
              TODAY
            </text>
          </g>
        )}
      </svg>

      {/* Hover detail */}
      {hovered && (() => {
        const t = tasks.find((x) => x.id === hovered);
        if (!t) return null;
        return (
          <div className="px-4 py-2 border-t border-slate-100 bg-[#fdf2e3]/40 text-xs flex flex-wrap gap-4">
            <span className="font-semibold text-[#064162]">{t.name}</span>
            <span className="text-slate-500">{t.start} → {t.end}</span>
            {t.progress != null && <span className="text-slate-700">{Math.round(t.progress * 100)}% complete</span>}
            {t.status && <span className="capitalize text-slate-700">{t.status.replace("_", " ")}</span>}
          </div>
        );
      })()}

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
        {(["complete", "in_progress", "pending", "behind"] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLOURS[s].progress }} />
            <span className="capitalize">{s.replace("_", " ")}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 ml-auto">
          <span className="inline-block w-[2px] h-3" style={{ backgroundColor: "#dc2626" }} />
          Today
        </span>
      </div>
    </div>
  );
}
