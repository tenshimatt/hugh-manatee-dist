"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INSTALL_TYPES,
  INSTALL_FIELD_MAP,
  WEATHER_OPTIONS,
  CREW_TYPES,
  type InstallType,
  type FieldDailyReport,
} from "@/lib/canned/field-daily";
import { Button } from "@/components/ui/button";

/**
 * FieldDailyForm — single-page superintendent daily report form.
 *
 * Implements all 28 conditional-reveal rules from the schema spec:
 *   - 5 Yes/No reveal rules (delays, material, deliveries, injuries, layout)
 *   - 22 install-type reveal rules (one per material)
 *   - "Other" reveals a 3-field sub-group
 *
 * State is a single plain object — no form libraries per task constraints.
 * Submits to /api/field-daily/submit and redirects to the detail page.
 */

type FormState = Partial<FieldDailyReport>;

const DEFAULT_STATE: FormState = {
  date: new Date().toISOString().slice(0, 10),
  what_was_installed: [],
  has_delays: undefined,
  needs_material: undefined,
  has_deliveries: undefined,
  has_injuries: undefined,
  layout_done_prior: undefined,
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }
) {
  const { label, required, ...rest } = props;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        {...rest}
        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:border-[#064162] focus:ring-1 focus:ring-[#064162] outline-none"
      />
    </div>
  );
}

function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; required?: boolean }
) {
  const { label, required, ...rest } = props;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea
        {...rest}
        rows={rest.rows ?? 3}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-[#064162] focus:ring-1 focus:ring-[#064162] outline-none"
      />
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: "Yes" | "No" | undefined;
  onChange: (v: "Yes" | "No") => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="flex gap-2">
        {(["Yes", "No"] as const).map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
              value === opt
                ? "bg-[#064162] text-white border-[#064162]"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <h2 className="text-sm font-bold text-[#0A2E5C] uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function FieldDailyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preProject = params.get("project") || "";

  const [state, setState] = useState<FormState>({
    ...DEFAULT_STATE,
    job_number: preProject,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const selected = state.what_was_installed || [];
  const toggleInstall = (t: InstallType) => {
    const has = selected.includes(t);
    set(
      "what_was_installed",
      has ? selected.filter((x) => x !== t) : [...selected, t]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/field-daily/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error || "Submit failed");
        setSubmitting(false);
        return;
      }
      router.push(`/arch/field-daily/${encodeURIComponent(body.id)}`);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  };

  const materialUnits = useMemo(() => INSTALL_FIELD_MAP, []);

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl mx-auto pb-20">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* 1. Job & Date */}
      <Section title="Job & Date">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Job # / Numero de Trabajo"
            required
            value={state.job_number || ""}
            onChange={(e) => set("job_number", e.target.value)}
          />
          <Input
            label="Job Name (auto)"
            value={state.job_name || ""}
            onChange={(e) => set("job_name", e.target.value)}
          />
          <Input
            label="Date / Fecha"
            type="date"
            required
            value={state.date || ""}
            onChange={(e) => set("date", e.target.value)}
          />
          <Input
            label="Submitter / Nombre"
            required
            value={state.submitter_name || ""}
            onChange={(e) => set("submitter_name", e.target.value)}
          />
          <div>
            <Label required>Crew Type</Label>
            <select
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
              value={state.crew_type || ""}
              onChange={(e) => set("crew_type", e.target.value as FormState["crew_type"])}
            >
              <option value="">Select…</option>
              {CREW_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Project Manager"
            required
            value={state.project_manager || ""}
            onChange={(e) => set("project_manager", e.target.value)}
          />
        </div>
      </Section>

      {/* 2. Narrative */}
      <Section title="Narrative / Notas">
        <Textarea
          label="Daily notes"
          required
          rows={4}
          value={state.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Section>

      {/* 3. Delays & Materials (2 conditionals) */}
      <Section title="Delays & Materials">
        <div className="grid grid-cols-2 gap-3">
          <YesNo
            label="Any delays today?"
            required
            value={state.has_delays}
            onChange={(v) => set("has_delays", v)}
          />
          <YesNo
            label="Need any materials?"
            required
            value={state.needs_material}
            onChange={(v) => set("needs_material", v)}
          />
        </div>
        {state.has_delays === "Yes" && (
          <Textarea
            label="Delay description"
            required
            value={state.delay_description || ""}
            onChange={(e) => set("delay_description", e.target.value)}
          />
        )}
        {state.needs_material === "Yes" && (
          <Textarea
            label="What materials are needed?"
            required
            value={state.material_needed_description || ""}
            onChange={(e) => set("material_needed_description", e.target.value)}
          />
        )}
      </Section>

      {/* 4. Site Conditions */}
      <Section title="Site Conditions">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label required>Weather</Label>
            <select
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
              value={state.weather || ""}
              onChange={(e) => set("weather", e.target.value as FormState["weather"])}
            >
              <option value="">Select…</option>
              {WEATHER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Total men onsite"
            required
            type="number"
            min={0}
            value={state.total_men_onsite ?? ""}
            onChange={(e) => set("total_men_onsite", Number(e.target.value))}
          />
          <Input
            label="Daily work hours"
            required
            type="number"
            step="0.25"
            min={0}
            value={state.daily_work_hours ?? ""}
            onChange={(e) => set("daily_work_hours", Number(e.target.value))}
          />
        </div>
      </Section>

      {/* 5. Deliveries & Equipment (1 conditional) */}
      <Section title="Deliveries & Equipment">
        <YesNo
          label="Any deliveries today?"
          required
          value={state.has_deliveries}
          onChange={(v) => set("has_deliveries", v)}
        />
        {state.has_deliveries === "Yes" && (
          <Textarea
            label="Delivery description"
            required
            value={state.delivery_description || ""}
            onChange={(e) => set("delivery_description", e.target.value)}
          />
        )}
        <Textarea
          label="Equipment onsite"
          value={state.equipment_onsite || ""}
          onChange={(e) => set("equipment_onsite", e.target.value)}
        />
      </Section>

      {/* 6. Safety (2 conditionals reveal together) */}
      <Section title="Safety">
        <YesNo
          label="Any injuries today?"
          required
          value={state.has_injuries}
          onChange={(v) => set("has_injuries", v)}
        />
        {state.has_injuries === "Yes" && (
          <>
            <Input
              label="Injured employee"
              required
              value={state.injured_employee || ""}
              onChange={(e) => set("injured_employee", e.target.value)}
            />
            <Textarea
              label="Injury description"
              required
              rows={4}
              value={state.injury_description || ""}
              onChange={(e) => set("injury_description", e.target.value)}
            />
          </>
        )}
      </Section>

      {/* 7. Installation (22 conditionals for install types + 1 layout conditional) */}
      <Section title="Installation">
        <YesNo
          label="Was layout done prior to install?"
          required
          value={state.layout_done_prior}
          onChange={(v) => set("layout_done_prior", v)}
        />
        {state.layout_done_prior === "Yes" && (
          <Input
            label="Elevations with layout"
            required
            value={state.elevations_with_layout || ""}
            onChange={(e) => set("elevations_with_layout", e.target.value)}
          />
        )}

        <div>
          <Label required>What was installed? (tap to select)</Label>
          <div className="flex flex-wrap gap-1.5">
            {INSTALL_TYPES.map((t) => {
              const active = selected.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleInstall(t)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    active
                      ? "bg-[#064162] text-white border-[#064162]"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="space-y-3 pt-2">
            {selected.map((t) => {
              const meta = materialUnits[t];
              if (t === "Other") {
                return (
                  <div
                    key={t}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2"
                  >
                    <div className="text-xs font-bold text-[#0A2E5C] uppercase">Other</div>
                    <Input
                      label="Description"
                      value={state.other_description || ""}
                      onChange={(e) => set("other_description", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Qty"
                        type="number"
                        value={state.other_qty ?? ""}
                        onChange={(e) =>
                          set("other_qty", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                      <Input
                        label="Man-hours"
                        type="number"
                        step="0.25"
                        value={state.other_mh ?? ""}
                        onChange={(e) =>
                          set("other_mh", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                );
              }
              const [qtyField, mhField] = meta.fields as [
                keyof FormState,
                keyof FormState,
              ];
              return (
                <div
                  key={t}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                >
                  <div className="text-xs font-bold text-[#0A2E5C] uppercase mb-2">
                    {t} <span className="text-slate-400">({meta.unit})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label={`Qty (${meta.unit})`}
                      type="number"
                      step="0.01"
                      value={(state[qtyField] as number | undefined) ?? ""}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          [qtyField]: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />
                    <Input
                      label="Man-hours"
                      type="number"
                      step="0.25"
                      value={(state[mhField] as number | undefined) ?? ""}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          [mhField]: e.target.value === "" ? undefined : Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* 8. Photos — stub (attach-image table in ERPNext; demo captures captions) */}
      <Section title="Photos">
        <div className="text-xs text-slate-500">
          Photo upload integrates with ERPNext attachments — captions only for demo.
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end gap-2 bg-white/80 backdrop-blur rounded-xl p-2 border border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/arch/field-daily")}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
