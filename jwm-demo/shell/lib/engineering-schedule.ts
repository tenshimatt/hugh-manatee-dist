/**
 * Engineering resource-planning domain types + canned roster fallback.
 *
 * Seeded from Chris Ball's morning drop (Obsidian/PROJECTS/JWM/assets/2026-04-20/
 * Engineering/Engineering.md). Covers:
 *   - Executive layer (Paul Roberts)
 *   - ACM discipline (Denis Usatenko + 7 ICs)
 *   - P&T discipline (David Hasty + 5 ICs)
 * = 15 employees total.
 *
 * When ERPNext is reachable, `listEngineers()` in `erpnext-live.ts` returns the
 * live Employee docs filtered by department="Engineering - JWM". When live
 * fetch fails or isLive() is false we fall back to `CANNED_ENGINEERS` here.
 */
export type Discipline = "Executive" | "ACM" | "P&T";

export interface Engineer {
  id: string;                    // Employee name (doc name) — stable id
  fullName: string;              // "Last, First M." as ERPNext stores it
  displayName: string;           // "First Last" for UI
  designation: string;
  discipline: Discipline;
  reportsTo?: string;            // id of manager (Engineer.id)
  isManager: boolean;
  capacityHrsPerWeek: number;    // default 40
}

export const CANNED_ENGINEERS: Engineer[] = [
  {
    id: "HR-EMP-00001",
    fullName: "Roberts, Paul",
    displayName: "Paul Roberts",
    designation: "Engineering Executive",
    discipline: "Executive",
    isManager: true,
    capacityHrsPerWeek: 40,
  },
  // ACM Manager
  {
    id: "HR-EMP-00002",
    fullName: "Usatenko, Denis",
    displayName: "Denis Usatenko",
    designation: "ACM Engineering Manager",
    discipline: "ACM",
    reportsTo: "HR-EMP-00001",
    isManager: true,
    capacityHrsPerWeek: 40,
  },
  // ACM ICs
  {
    id: "HR-EMP-00003",
    fullName: "Vlatkovic, Nadira",
    displayName: "Nadira Vlatkovic",
    designation: "ACM Drafter",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00004",
    fullName: "Stakhurskyi, Hennadii",
    displayName: "Hennadii Stakhurskyi",
    designation: "ACM Drafter",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00005",
    fullName: "Niedfeld, Ailen",
    displayName: "Ailen Niedfeld",
    designation: "ACM Drafter",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00006",
    fullName: "Lucas, Samuel K.",
    displayName: "Samuel Lucas",
    designation: "ACM Drafter",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00007",
    fullName: "Hoyle, Gabriela E.",
    displayName: "Gabriela Hoyle",
    designation: "ACM Programmer",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00008",
    fullName: "Dill, William C.",
    displayName: "William Dill",
    designation: "ACM Programmer",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00009",
    fullName: "Chambers-Douglas, Tara M.",
    displayName: "Tara Chambers-Douglas",
    designation: "ACM Drafter",
    discipline: "ACM",
    reportsTo: "HR-EMP-00002",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  // P&T Manager
  {
    id: "HR-EMP-00010",
    fullName: "Hasty, David",
    displayName: "David Hasty",
    designation: "Plate & Tube Engineering Manager",
    discipline: "P&T",
    reportsTo: "HR-EMP-00001",
    isManager: true,
    capacityHrsPerWeek: 40,
  },
  // P&T ICs
  {
    id: "HR-EMP-00011",
    fullName: "Havens, Issiah A.",
    displayName: "Issiah Havens",
    designation: "P&T Drafter",
    discipline: "P&T",
    reportsTo: "HR-EMP-00010",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00012",
    fullName: "Jurado Carballo, Arnoldo",
    displayName: "Arnoldo Jurado Carballo",
    designation: "P&T Drafter",
    discipline: "P&T",
    reportsTo: "HR-EMP-00010",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00013",
    fullName: "Dean, Frank W.",
    displayName: "Frank Dean",
    designation: "P&T Programmer",
    discipline: "P&T",
    reportsTo: "HR-EMP-00010",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00014",
    fullName: "Gambrel, Chris L.",
    displayName: "Chris Gambrel",
    designation: "P&T Drafter",
    discipline: "P&T",
    reportsTo: "HR-EMP-00010",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
  {
    id: "HR-EMP-00015",
    fullName: "Dorsey, Jonathan",
    displayName: "Jonathan Dorsey",
    designation: "P&T Programmer",
    discipline: "P&T",
    reportsTo: "HR-EMP-00010",
    isManager: false,
    capacityHrsPerWeek: 40,
  },
];

/** Session-local assignment shape. Persisted in the server Map + localStorage. */
export interface EngineeringAssignment {
  id: string;           // uuid-ish
  engineer_id: string;  // Engineer.id
  card_id: string;      // Schedule Line job id (Card.id)
  date: string;         // YYYY-MM-DD
  hours: number;        // planned
  stage: string;        // pipeline stage slug
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarHslFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 55% 45%)`;
}

/** Utilisation → tailwind colour classes. */
export function utilBucket(pct: number): { bar: string; text: string; bg: string } {
  if (pct > 100) return { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-50" };
  if (pct >= 70) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
  return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
}

/** Heatmap cell colour based on planned hours (0..>8). */
export function heatCell(h: number): string {
  if (h <= 0) return "bg-slate-50";
  if (h < 5) return "bg-emerald-100";
  if (h < 8) return "bg-emerald-300";
  if (h === 8) return "bg-amber-300";
  return "bg-red-400";
}

/** Next N weekdays (Mon–Fri), ISO YYYY-MM-DD, starting today. */
export function nextWeekdays(n = 10, from: Date = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      out.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Seed a few example assignments so first-load isn't empty. */
export function seedAssignments(
  engineers: Engineer[],
  cardIds: string[],
): EngineeringAssignment[] {
  if (!cardIds.length) return [];
  const days = nextWeekdays(5);
  const ics = engineers.filter((e) => !e.isManager).slice(0, 6);
  const out: EngineeringAssignment[] = [];
  for (let i = 0; i < ics.length; i++) {
    const eng = ics[i];
    for (let d = 0; d < 2; d++) {
      const cardIdx = (i * 2 + d) % cardIds.length;
      out.push({
        id: `seed-${eng.id}-${d}`,
        engineer_id: eng.id,
        card_id: cardIds[cardIdx],
        date: days[d % days.length],
        hours: 4 + (d % 2) * 2,
        stage: eng.discipline === "ACM" ? "layout" : "sketch",
      });
    }
  }
  return out;
}
