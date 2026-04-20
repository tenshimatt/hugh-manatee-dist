import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import {
  CANNED_REPORTS,
  INSTALL_FIELD_MAP,
  type FieldDailyReport,
  type InstallType,
} from "@/lib/canned/field-daily";
import { erpnextConfigured, getDoc } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

/**
 * /arch/field-daily/[id] — read-only detail view for a submitted report.
 * Groups fields by spec section. Hides conditional fields not applicable.
 * Links back to the owning Project Dashboard.
 */

async function loadReport(id: string): Promise<FieldDailyReport | undefined> {
  if (erpnextConfigured()) {
    try {
      const live = (await Promise.race([
        getDoc<FieldDailyReport>("Field Daily Report", id),
        new Promise<FieldDailyReport>((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 5000)
        ),
      ])) as FieldDailyReport;
      if (live) return live;
    } catch (e) {
      console.warn("[arch/field-daily/[id]] live failed, canned:", e);
    }
  }
  return CANNED_REPORTS.find((r) => r.id === id);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider col-span-1">
        {label}
      </dt>
      <dd className="text-sm text-slate-800 col-span-2 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-[#0A2E5C] uppercase tracking-wider mb-3">
        {title}
      </h2>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

export default async function FieldDailyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await loadReport(decodeURIComponent(id));
  if (!report) notFound();

  const installed = report.what_was_installed || [];

  return (
    <div className="space-y-4 max-w-4xl">
      <Link
        href="/arch/field-daily"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A2E5C]"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> All Field Dailies
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
            Architectural · Field Daily Report
          </div>
          <h1 className="text-2xl font-bold text-[#0A2E5C]">
            {report.job_number} — {report.job_name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {report.date} · submitted by {report.submitter_name}
          </p>
        </div>
        <Link
          href={`/arch/projects/${encodeURIComponent(report.job_number)}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#064162] hover:underline"
        >
          Project Dashboard <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <Section title="Job & Date">
        <Row label="Job #" value={report.job_number} />
        <Row label="Job Name" value={report.job_name} />
        <Row label="Date" value={report.date} />
        <Row label="Submitter" value={report.submitter_name} />
        <Row label="Crew Type" value={report.crew_type} />
        <Row label="Project Manager" value={report.project_manager} />
      </Section>

      <Section title="Narrative">
        <Row label="Notes" value={report.notes} />
      </Section>

      <Section title="Delays & Materials">
        <Row label="Delays?" value={report.has_delays} />
        {report.has_delays === "Yes" && (
          <Row label="Delay description" value={report.delay_description} />
        )}
        <Row label="Needs material?" value={report.needs_material} />
        {report.needs_material === "Yes" && (
          <Row label="Material needed" value={report.material_needed_description} />
        )}
      </Section>

      <Section title="Site Conditions">
        <Row label="Weather" value={report.weather} />
        <Row label="Men onsite" value={report.total_men_onsite} />
        <Row label="Work hours" value={report.daily_work_hours} />
      </Section>

      <Section title="Deliveries & Equipment">
        <Row label="Deliveries?" value={report.has_deliveries} />
        {report.has_deliveries === "Yes" && (
          <Row label="Delivery description" value={report.delivery_description} />
        )}
        <Row label="Equipment onsite" value={report.equipment_onsite} />
      </Section>

      <Section title="Safety">
        <Row label="Injuries?" value={report.has_injuries} />
        {report.has_injuries === "Yes" && (
          <>
            <Row label="Injured employee" value={report.injured_employee} />
            <Row label="Injury description" value={report.injury_description} />
          </>
        )}
      </Section>

      <Section title="Installation">
        <Row label="Layout done prior?" value={report.layout_done_prior} />
        {report.layout_done_prior === "Yes" && (
          <Row label="Elevations with layout" value={report.elevations_with_layout} />
        )}
        <Row
          label="What was installed"
          value={installed.length ? installed.join(", ") : undefined}
        />
        {installed.map((t: InstallType) => {
          const meta = INSTALL_FIELD_MAP[t];
          if (!meta) return null;
          if (t === "Other") {
            return (
              <div key={t}>
                <Row label="Other — description" value={report.other_description} />
                <Row label="Other — qty" value={report.other_qty} />
                <Row label="Other — MH" value={report.other_mh} />
              </div>
            );
          }
          const [qtyField, mhField] = meta.fields as [
            keyof FieldDailyReport,
            keyof FieldDailyReport,
          ];
          return (
            <div key={t}>
              <Row
                label={`${t} — qty (${meta.unit})`}
                value={report[qtyField] as React.ReactNode}
              />
              <Row label={`${t} — MH`} value={report[mhField] as React.ReactNode} />
            </div>
          );
        })}
      </Section>

      {report.site_photos && report.site_photos.length > 0 && (
        <Section title="Photos">
          <ul className="text-sm list-disc pl-5 text-slate-700">
            {report.site_photos.map((p, i) => (
              <li key={i}>{p.caption || "(uncaptioned)"}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
