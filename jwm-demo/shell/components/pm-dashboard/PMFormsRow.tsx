"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileInput, Box, CalendarPlus, X } from "lucide-react";

type FormKey = "job-info" | "3d-request" | "schedule-it" | null;

const LABELS: Record<Exclude<FormKey, null>, { title: string; desc: string; href: string }> = {
  "job-info": {
    title: "Job Info",
    desc: "Kick off a new project record — short job ID, release type, description, materials, and shipping target.",
    href: "/arch/forms/job-info",
  },
  "3d-request": {
    title: "3D Request",
    desc: "Request a 3D model from the design team for client walkthrough or fabrication preview.",
    href: "/arch/forms/3d-request",
  },
  "schedule-it": {
    title: "Schedule It",
    desc: "Request shop floor slotting for a release — ship target, crating plan, drafting and shop hours.",
    href: "/arch/forms/schedule-it",
  },
};

export function PMFormsRow() {
  const [open, setOpen] = useState<FormKey>(null);
  const active = open ? LABELS[open] : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Forms</CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormButton
              icon={<FileInput className="w-5 h-5" />}
              title="Job Info"
              onClick={() => setOpen("job-info")}
            />
            <FormButton
              icon={<Box className="w-5 h-5" />}
              title="3D Request"
              onClick={() => setOpen("3d-request")}
            />
            <FormButton
              icon={<CalendarPlus className="w-5 h-5" />}
              title="Schedule It"
              onClick={() => setOpen("schedule-it")}
            />
          </div>
        </CardBody>
      </Card>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pm-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 id="pm-form-title" className="text-xl font-bold text-[#064162]">
                {active.title}
              </h2>
              <button
                onClick={() => setOpen(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{active.desc}</p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 mb-4">
              Form coming Phase 2
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(null)}>
                Close
              </Button>
              <Link href={active.href}>
                <Button variant="primary" size="sm">
                  Open full page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FormButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#064162] bg-[#064162]/5 hover:bg-[#064162] hover:text-white text-[#064162] font-bold transition-colors text-left"
    >
      <span className="w-10 h-10 rounded-full bg-[#e69b40] text-white flex items-center justify-center">
        {icon}
      </span>
      <span className="text-lg">{title}</span>
    </button>
  );
}
