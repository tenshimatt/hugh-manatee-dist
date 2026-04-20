// Project Schedule sub-tab — mirrors A-Shop/Project Schedule.xlsx.
// Milestone + task list with duration, start/finish, predecessors, status.

import { getProject } from "@/lib/canned/active-projects";
import {
  cannedSchedule,
  type ScheduleTask,
  type TaskHealth,
  type TaskStatus,
} from "@/lib/canned/project-subtabs/schedule";
import {
  SubtabChrome,
  resolveChromeHeader,
} from "@/components/project-dashboard/SubtabChrome";
import { Card, CardBody } from "@/components/ui/card";
import { DataSourceFootnote } from "@/components/project-dashboard/DataSourceFootnote";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<TaskStatus, string> = {
  "Not Started": "bg-slate-200 text-slate-600 border-slate-300",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  Complete:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  Blocked:       "bg-rose-100 text-rose-700 border-rose-200",
};

const HEALTH_DOT: Record<TaskHealth, string> = {
  Green:  "bg-emerald-500",
  Yellow: "bg-amber-500",
  Red:    "bg-rose-500",
  Gray:   "bg-slate-300",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const project = getProject(decoded);
  const { jobNumber, jobName } = resolveChromeHeader(decoded, project);
  const data = cannedSchedule(jobNumber);

  return (
    <SubtabChrome
      projectId={decoded}
      jobNumber={jobNumber}
      jobName={jobName}
      active="project-schedule"
      title="Project Schedule"
      description="Milestone and task-level schedule with dependency tracking."
    >
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <Tile label="Start Date" value={data.summary.startDate} />
        <Tile label="Finish Date" value={data.summary.finishDate} />
        <Tile label="% Complete" value={`${data.summary.percentComplete}%`} tone="gold" />
        <Tile label="Not Started" value={`${data.summary.notStarted}`} />
        <Tile label="In Progress" value={`${data.summary.inProgress}`} />
        <Tile label="Complete" value={`${data.summary.complete}`} tone="green" />
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr className="text-left">
                <th className="px-3 py-2">Task ID</th>
                <th className="px-3 py-2">Task Name</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">Finish</th>
                <th className="px-3 py-2">Predecessors</th>
                <th className="px-3 py-2">Health</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">% Complete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.tasks.map((t) => (
                <TaskRow key={t.taskId} t={t} />
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <DataSourceFootnote
        source="canned"
        note="Schedule template — Phase-2: wire to ERPNext Project Task DocType."
      />
    </SubtabChrome>
  );
}

function TaskRow({ t }: { t: ScheduleTask }) {
  const indentPad =
    t.indent <= 1 ? "pl-3" : t.indent === 2 ? "pl-6" : "pl-10";
  const nameCls =
    t.indent === 1
      ? "font-bold text-[#0A2E5C] text-[12px]"
      : t.indent === 2
      ? "font-semibold text-[#0A2E5C]"
      : "text-slate-700";
  return (
    <tr>
      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">{t.taskId}</td>
      <td className={"py-1.5 " + indentPad}>
        <span className={nameCls}>{t.name}</span>
      </td>
      <td className="px-3 py-1.5 tabular-nums">{t.duration}</td>
      <td className="px-3 py-1.5 tabular-nums">{t.startDate}</td>
      <td className="px-3 py-1.5 tabular-nums">{t.finishDate}</td>
      <td className="px-3 py-1.5 tabular-nums text-slate-500">{t.predecessors || "—"}</td>
      <td className="px-3 py-1.5">
        <span
          className={"inline-block w-2.5 h-2.5 rounded-full " + HEALTH_DOT[t.health]}
          aria-label={`Health ${t.health}`}
        />
      </td>
      <td className="px-3 py-1.5">
        <span
          className={
            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold " +
            STATUS_STYLES[t.status]
          }
        >
          {t.status}
        </span>
      </td>
      <td className="px-3 py-1.5 w-32">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-[#C9A349]"
            style={{ width: `${Math.min(100, t.percentComplete)}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">{t.percentComplete}%</div>
      </td>
    </tr>
  );
}

function Tile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "gold" | "green";
}) {
  const toneCls =
    tone === "gold" ? "text-[#8a5716]" : tone === "green" ? "text-emerald-700" : "text-[#0A2E5C]";
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className={"text-lg font-bold mt-1 " + toneCls}>{value}</div>
    </div>
  );
}
