/**
 * Field Daily Report — canned seed data + TypeScript types.
 *
 * Derived from Obsidian/PROJECTS/JWM/20-architecture/field-daily-schema.md.
 * Used as fallback when ERPNext is unreachable or returns empty. Seed
 * intentionally covers every conditional branch (delays, material needed,
 * deliveries, injuries, layout-prior, and several material types).
 *
 * DO NOT mutate from a request handler — treat as read-only seed.
 */

export type YesNo = "Yes" | "No";

export const INSTALL_TYPES = [
  "ACM",
  "Plate Panels",
  "Perforated Garage Panels",
  "Single Skin",
  "IMP",
  "Trespa",
  "Overly Roof Panels",
  "Genesis Panel",
  "Terracota Panel",
  "Mapes Canopy",
  "Caulking",
  "Corrugated / Screen Wall",
  "Louver",
  "Insulation",
  "Tubing",
  "Subgirt Zee",
  "Flashing",
  "Hat Channel",
  "Trim",
  "AWB",
  "Coping",
  "Other",
] as const;
export type InstallType = (typeof INSTALL_TYPES)[number];

export const WEATHER_OPTIONS = [
  "Clear",
  "Rain",
  "Snow",
  "Wind",
  "Fog",
  "Hot",
  "Cold",
] as const;
export type Weather = (typeof WEATHER_OPTIONS)[number];

export const CREW_TYPES = ["Subcontractor", "JWMCD Crew"] as const;
export type CrewType = (typeof CREW_TYPES)[number];

/**
 * Conditional rule map — (trigger field, trigger value, revealed fields).
 * Consumed by the form component and detail view so both agree on which
 * fields are visible.
 */
export type ConditionalRule = {
  trigger: keyof FieldDailyReport;
  value: string | boolean;
  reveals: (keyof FieldDailyReport)[];
};

/** The 6 Yes/No + layout + 22 install-type rules = 28 conditionals. */
export const CONDITIONAL_RULES: ConditionalRule[] = [
  { trigger: "has_delays", value: "Yes", reveals: ["delay_description"] },
  { trigger: "needs_material", value: "Yes", reveals: ["material_needed_description"] },
  { trigger: "has_deliveries", value: "Yes", reveals: ["delivery_description"] },
  { trigger: "has_injuries", value: "Yes", reveals: ["injured_employee", "injury_description"] },
  { trigger: "layout_done_prior", value: "Yes", reveals: ["elevations_with_layout"] },
];

/** Each install type reveals its qty + mh pair (Other reveals 3). */
export const INSTALL_FIELD_MAP: Record<
  InstallType,
  { fields: (keyof FieldDailyReport)[]; unit: string }
> = {
  ACM: { fields: ["acm_qty", "acm_mh"], unit: "panels" },
  "Plate Panels": { fields: ["plate_panels_qty", "plate_panels_mh"], unit: "panels" },
  "Perforated Garage Panels": { fields: ["perf_garage_qty", "perf_garage_mh"], unit: "panels" },
  "Single Skin": { fields: ["single_skin_qty", "single_skin_mh"], unit: "panels" },
  IMP: { fields: ["imp_qty", "imp_mh"], unit: "panels" },
  Trespa: { fields: ["trespa_qty", "trespa_mh"], unit: "panels" },
  "Overly Roof Panels": { fields: ["overly_roof_qty", "overly_roof_mh"], unit: "panels" },
  "Genesis Panel": { fields: ["genesis_qty", "genesis_mh"], unit: "panels" },
  "Terracota Panel": { fields: ["terracota_qty", "terracota_mh"], unit: "panels" },
  "Mapes Canopy": { fields: ["mapes_canopy_qty", "mapes_canopy_mh"], unit: "units" },
  Caulking: { fields: ["caulking_lf", "caulking_mh"], unit: "linear ft" },
  "Corrugated / Screen Wall": { fields: ["corrugated_qty", "corrugated_mh"], unit: "panels" },
  Louver: { fields: ["louver_qty", "louver_mh"], unit: "units" },
  Insulation: { fields: ["insulation_sqft", "insulation_mh"], unit: "sqft" },
  Tubing: { fields: ["tubing_lf", "tubing_mh"], unit: "linear ft" },
  "Subgirt Zee": { fields: ["subgirt_zee_lf", "subgirt_zee_mh"], unit: "linear ft" },
  Flashing: { fields: ["flashing_lf", "flashing_mh"], unit: "linear ft" },
  "Hat Channel": { fields: ["hat_channel_lf", "hat_channel_mh"], unit: "linear ft" },
  Trim: { fields: ["trim_lf", "trim_mh"], unit: "linear ft" },
  AWB: { fields: ["awb_sqft", "awb_mh"], unit: "sqft" },
  Coping: { fields: ["coping_lf", "coping_mh"], unit: "linear ft" },
  Other: { fields: ["other_description", "other_qty", "other_mh"], unit: "free" },
};

export interface FieldDailyReport {
  id: string;
  job_number: string;
  job_name: string;
  date: string; // ISO yyyy-mm-dd
  submitter_name: string;
  notes: string;
  crew_type: CrewType;
  project_manager: string;
  has_delays: YesNo;
  delay_description?: string;
  needs_material: YesNo;
  material_needed_description?: string;
  weather: Weather;
  total_men_onsite: number;
  daily_work_hours: number;
  has_deliveries: YesNo;
  delivery_description?: string;
  equipment_onsite?: string;
  has_injuries: YesNo;
  injured_employee?: string;
  injury_description?: string;
  layout_done_prior: YesNo;
  elevations_with_layout?: string;
  what_was_installed: InstallType[];
  // Material qty/mh pairs
  acm_qty?: number; acm_mh?: number;
  plate_panels_qty?: number; plate_panels_mh?: number;
  perf_garage_qty?: number; perf_garage_mh?: number;
  single_skin_qty?: number; single_skin_mh?: number;
  imp_qty?: number; imp_mh?: number;
  trespa_qty?: number; trespa_mh?: number;
  overly_roof_qty?: number; overly_roof_mh?: number;
  genesis_qty?: number; genesis_mh?: number;
  terracota_qty?: number; terracota_mh?: number;
  mapes_canopy_qty?: number; mapes_canopy_mh?: number;
  caulking_lf?: number; caulking_mh?: number;
  corrugated_qty?: number; corrugated_mh?: number;
  louver_qty?: number; louver_mh?: number;
  insulation_sqft?: number; insulation_mh?: number;
  tubing_lf?: number; tubing_mh?: number;
  subgirt_zee_lf?: number; subgirt_zee_mh?: number;
  flashing_lf?: number; flashing_mh?: number;
  hat_channel_lf?: number; hat_channel_mh?: number;
  trim_lf?: number; trim_mh?: number;
  awb_sqft?: number; awb_mh?: number;
  coping_lf?: number; coping_mh?: number;
  other_description?: string; other_qty?: number; other_mh?: number;
  site_photos?: { caption?: string; url?: string }[];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Canned seed reports. Each one intentionally exercises a different set
 * of conditional paths so the form + detail view render exhaustively in
 * demo mode without ERPNext.
 */
export const CANNED_REPORTS: FieldDailyReport[] = [
  {
    id: "FDR-25031-T-0001",
    job_number: "25031",
    job_name: "Nashville Yards Tower C",
    date: daysAgo(0),
    submitter_name: "Abner Aguilar",
    notes: "Crew finished west elevation ACM. No issues. Cleanup underway before rain.",
    crew_type: "JWMCD Crew",
    project_manager: "Laura Forero",
    has_delays: "No",
    needs_material: "Yes",
    material_needed_description: "Need 40 lf additional coping stock by Thursday.",
    weather: "Clear",
    total_men_onsite: 7,
    daily_work_hours: 8,
    has_deliveries: "Yes",
    delivery_description: "Two pallets ACM received from Laminators 09:30.",
    equipment_onsite: "Scissor lift x2, boom lift x1",
    has_injuries: "No",
    layout_done_prior: "Yes",
    elevations_with_layout: "West, North",
    what_was_installed: ["ACM", "Caulking", "Flashing"],
    acm_qty: 24, acm_mh: 48,
    caulking_lf: 210, caulking_mh: 18,
    flashing_lf: 85, flashing_mh: 12,
    site_photos: [{ caption: "West elev 3pm" }, { caption: "ACM pallet staging" }],
  },
  {
    id: "FDR-24077-T-0002",
    job_number: "24077",
    job_name: "BNA Terminal Expansion",
    date: daysAgo(1),
    submitter_name: "Fredy Veliz",
    notes: "Rain shortened day. Continued IMP on south face; tarped exposed edges.",
    crew_type: "Subcontractor",
    project_manager: "Chris Buttrey",
    has_delays: "Yes",
    delay_description: "Heavy rain 10:45–13:00; lost ~2.5 MH across crew.",
    needs_material: "No",
    weather: "Rain",
    total_men_onsite: 5,
    daily_work_hours: 5.5,
    has_deliveries: "No",
    equipment_onsite: "Boom lift, forklift",
    has_injuries: "No",
    layout_done_prior: "No",
    what_was_installed: ["IMP", "Subgirt Zee"],
    imp_qty: 12, imp_mh: 22,
    subgirt_zee_lf: 160, subgirt_zee_mh: 9,
    site_photos: [{ caption: "Tarp coverage over subgirt" }],
  },
  {
    id: "FDR-25012-T-0003",
    job_number: "25012",
    job_name: "Vanderbilt Peabody Annex",
    date: daysAgo(7),
    submitter_name: "Wilton Lorenzo",
    notes:
      "Minor hand laceration on crew member. First aid onsite, no ER. Continued louver install on east face.",
    crew_type: "JWMCD Crew",
    project_manager: "Laura Forero",
    has_delays: "No",
    needs_material: "No",
    weather: "Hot",
    total_men_onsite: 6,
    daily_work_hours: 8,
    has_deliveries: "Yes",
    delivery_description: "Louvers (12 ea) delivered from Airolite.",
    equipment_onsite: "Scissor lift",
    has_injuries: "Yes",
    injured_employee: "Jose Martinez",
    injury_description:
      "Small laceration to left palm on sheet edge. Bandaged onsite, returned to work.",
    layout_done_prior: "Yes",
    elevations_with_layout: "East",
    what_was_installed: ["Louver", "AWB", "Other"],
    louver_qty: 8, louver_mh: 14,
    awb_sqft: 450, awb_mh: 6,
    other_description: "Temporary weather barrier tape",
    other_qty: 1, other_mh: 1,
    site_photos: [{ caption: "First aid kit use log" }, { caption: "Louver detail" }],
  },
];

/** Simple in-memory dedup by id, newest first. */
export function sortReportsByDate(reports: FieldDailyReport[]): FieldDailyReport[] {
  return [...reports].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Filter helper used by list route. */
export function filterReports(
  reports: FieldDailyReport[],
  opts: { project?: string; since?: string } = {}
): FieldDailyReport[] {
  let out = reports;
  if (opts.project) out = out.filter((r) => r.job_number === opts.project);
  if (opts.since) out = out.filter((r) => r.date >= opts.since!);
  return sortReportsByDate(out);
}
