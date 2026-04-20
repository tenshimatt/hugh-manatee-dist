// Canned COR log — schema mirrors A-Shop/Change Order Request Log.xlsx.
// Columns: COR# · Customer Tracking # · Origin Doc · Description · Zone ·
// Location · Schedule Impact Days · Start · Finish · Signed DFAR · Status · ROM.

export type CORStatus = "Pending" | "Approved" | "Rejected" | "Voided";

export type CORow = {
  corNumber: string;
  customerTracking: string;
  originDoc: string;
  description: string;
  zone: string;
  location: string;
  scheduleImpactDays: number;
  startDate: string;
  finishDate: string;
  signedDFAR: string;
  status: CORStatus;
  rom: number;
};

export function cannedCORs(jobNumber: string): CORow[] {
  const seeds: Array<[string, string, number, CORStatus, number, number]> = [
    ["RFI-204: added weather barrier on L3 north",     "North elevation", 3,  "Approved", 12_450, 4],
    ["RFP-16: louver re-spec to G90 galv",              "West elevation", 2,  "Approved", 8_900,  2],
    ["RFI-211: extended drip edge at parapet",          "Roofline",       0,  "Approved", 2_150,  1],
    ["ASI-08: owner-directed panel colour change",      "South elevation", 7,  "Pending",  24_800, 9],
    ["RFI-218: added stainless cladding at loading dock","Dock",          4,  "Pending",  18_300, 6],
    ["RFP-19: revise flashing profile at mullions",     "Curtain wall",   1,  "Rejected", 3_600,  2],
    ["ASI-12: remove sun-shade package",                "East elevation", -5, "Approved", -14_200, 7],
    ["RFI-221: add Z-furring behind louvers",           "West elevation", 1,  "Approved", 4_800,  2],
    ["RFP-22: misc trim at expansion joint",            "All",            0,  "Voided",   1_200,  1],
    ["RFI-229: revise fastener schedule ACM",           "North elevation", 0,  "Approved", 920,    1],
    ["ASI-14: add IMP reveal accents",                  "South elevation", 2,  "Pending",  9_600,  3],
    ["RFI-233: PO adder — freight surcharge",           "Freight",        0,  "Approved", 3_450,  1],
  ];
  const salt = hashToUnit(jobNumber);
  // Stagger dates so each job's log looks distinct.
  const base = new Date(2026, 8, 1 + Math.floor(salt * 10));
  return seeds.map(([desc, zone, days, status, rom, span], i) => {
    const start = new Date(base);
    start.setDate(start.getDate() + i * 6 + Math.floor(salt * 4));
    const finish = new Date(start);
    finish.setDate(finish.getDate() + Math.max(1, span));
    return {
      corNumber: `COR${(i + 1).toString().padStart(2, "0")}`,
      customerTracking: `CT-${jobNumber}-${(i + 1).toString().padStart(3, "0")}`,
      originDoc: desc.split(":")[0] ?? "RFI",
      description: desc,
      zone,
      location: zone,
      scheduleImpactDays: days,
      startDate: fmt(start),
      finishDate: fmt(finish),
      signedDFAR: status === "Approved" ? fmt(finish) : "",
      status,
      rom,
    };
  });
}

export function corTotalsByStatus(rows: CORow[]) {
  const init: Record<CORStatus, { count: number; amount: number }> = {
    Pending:  { count: 0, amount: 0 },
    Approved: { count: 0, amount: 0 },
    Rejected: { count: 0, amount: 0 },
    Voided:   { count: 0, amount: 0 },
  };
  for (const r of rows) {
    init[r.status].count += 1;
    init[r.status].amount += r.rom;
  }
  return init;
}

function fmt(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function hashToUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000) * 0.9 + 0.05;
}
