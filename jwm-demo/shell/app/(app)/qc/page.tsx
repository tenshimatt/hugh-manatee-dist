"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NCRS as CANNED_NCRS, type NCR } from "@/lib/canned/work-orders";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Paperclip, ShieldCheck } from "lucide-react";

const STATUSES: NCR["status"][] = ["Draft from Floor", "Under Review", "CA Open", "Closed"];

export default function QCPage() {
  const [filter, setFilter] = useState<NCR["status"] | "All">("All");
  const [ncrs, setNcrs] = useState<NCR[]>(CANNED_NCRS);
  const [selected, setSelected] = useState<NCR | null>(CANNED_NCRS[0]);
  useEffect(() => {
    fetch("/api/ncr/list")
      .then((r) => r.json())
      .then((j: { items: NCR[]; source?: string }) => {
        if (Array.isArray(j.items) && j.items.length) {
          setNcrs(j.items);
          setSelected(j.items[0]);
        }
      })
      .catch(() => {});
  }, []);
  const NCRS = ncrs;
  const list = filter === "All" ? NCRS : NCRS.filter((n) => n.status === filter);

  return (
    <div className="space-y-5">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#e69b40] text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" /> Quality Control
          </div>
          <h1 className="text-3xl font-bold text-[#064162] tracking-tight">
            NCR Inbox
          </h1>
          <p className="text-slate-500 mt-1">
            Review non-conformance reports raised from the floor. Disposition, assign corrective actions, and close out.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={filter === "All"}
            onClick={() => setFilter("All")}
            label={`All (${NCRS.length})`}
          />
          {STATUSES.map((s) => {
            const n = NCRS.filter((x) => x.status === s).length;
            return (
              <FilterChip
                key={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                label={`${s} (${n})`}
              />
            );
          })}
        </div>
      </header>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <Card>
          <CardHeader>
            <CardTitle>NCRs ({list.length})</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => setSelected(n)}
                    className={`w-full text-left px-5 py-4 hover:bg-slate-50 ${
                      selected?.id === n.id ? "bg-[#eaf3f8]/60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#064162] font-bold">
                        {n.id}
                      </span>
                      <Badge
                        tone={
                          n.status === "Closed"
                            ? "green"
                            : n.status === "CA Open"
                              ? "gold"
                              : n.status === "Under Review"
                                ? "navy"
                                : "amber"
                        }
                      >
                        {n.status}
                      </Badge>
                    </div>
                    <div className="font-semibold text-slate-800 mt-1">
                      {n.part}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {n.workstation} · {n.defect_type} ·{" "}
                      {new Date(n.raised_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {selected && <NCRDetail ncr={selected} />}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-medium ${
        active
          ? "bg-[#064162] text-white border-[#064162]"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function NCRDetail({ ncr }: { ncr: NCR }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-[#064162]">{ncr.id}</div>
            <CardTitle className="mt-1 normal-case tracking-normal text-lg font-bold text-slate-900">
              {ncr.part}
            </CardTitle>
          </div>
          <Badge
            tone={
              ncr.status === "Closed"
                ? "green"
                : ncr.status === "CA Open"
                  ? "gold"
                  : ncr.status === "Under Review"
                    ? "navy"
                    : "amber"
            }
          >
            {ncr.status}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <Field label="Description" value={ncr.description} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Defect type" value={ncr.defect_type} />
          <Field label="Qty affected" value={String(ncr.qty_affected)} />
          <Field label="Workstation" value={ncr.workstation} mono />
          <Field
            label="Work Order"
            value={
              ncr.wo ? (
                <a
                  href={`/planner/${ncr.wo}`}
                  className="text-[#064162] font-mono hover:underline inline-flex items-center gap-1"
                >
                  {ncr.wo} <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <Field label="Raised by" value={ncr.raised_by} />
          <Field
            label="Raised at"
            value={new Date(ncr.raised_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </div>
        {ncr.disposition && <Field label="Disposition" value={ncr.disposition} />}
        {ncr.root_cause && <Field label="Root cause" value={ncr.root_cause} />}
        {ncr.corrective_action && (
          <Field label="Corrective action" value={ncr.corrective_action} />
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Paperclip className="w-3.5 h-3.5" /> 0 attachments
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline">Assign</Button>
          <Button variant="primary">Move to Review</Button>
          {ncr.status !== "Closed" && <Button variant="success">Close NCR</Button>}
        </div>
      </CardBody>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`mt-0.5 text-slate-800 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
