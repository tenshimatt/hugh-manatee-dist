// Canned Schedule of Values — schema mirrors A-Shop/SOV.xlsx (AIA-style).
// Columns: Item # · Description · Scheduled Value · Previous App · This Period ·
// Stored This Period · Total Complete+Stored % · % Complete · Balance to Finish · Retainage.

export type SOVRow = {
  itemNumber: number;
  description: string;
  scheduledValue: number;
  previousApplication: number;
  thisPeriod: number;
  storedThisPeriod: number;
  completeAndStoredPct: number; // 0..100
  percentComplete: number;      // 0..100
  balanceToFinish: number;
  retainage: number;
};

export type SOVData = {
  rows: SOVRow[];
  retainagePct: number;
  totals: {
    scheduledValue: number;
    previousApplication: number;
    thisPeriod: number;
    storedThisPeriod: number;
    completeAndStored: number;
    balanceToFinish: number;
    retainage: number;
  };
};

export function cannedSOV(jobNumber: string, contractValue: number): SOVData {
  const salt = hashToUnit(jobNumber);

  const seeds: Array<[string, number, number]> = [
    // [description, weight in contract %, pctCompleteHint 0..1]
    ["Bonding Premium",          0.015, 1.00],
    ["Shop Drawings",            0.045, 0.85],
    ["Calculations",             0.015, 0.80],
    ["Field Measure",            0.010, 1.00],
    ["Mobilization",             0.020, 1.00],
    ["De-Mobilization",          0.015, 0.00],
    ["Shipping",                 0.030, 0.30],
    ["East/North Elevation",     0.005, 0.30],
    ["ACM Material",             0.070, 0.65],
    ["Corrugated Material",      0.030, 0.55],
    ["IMP Material",             0.085, 0.70],
    ["Screen Louver Material",   0.035, 0.45],
    ["ACM Install",              0.085, 0.18],
    ["Corrugated Install",       0.040, 0.10],
    ["IMP Install",              0.095, 0.05],
    ["Screen Louver Install",    0.035, 0.00],
    ["South/West Elevation",     0.005, 0.15],
    ["ACM Material (S/W)",       0.070, 0.55],
    ["Corrugated Material (S/W)",0.030, 0.50],
    ["IMP Material (S/W)",       0.080, 0.60],
    ["Screen Louver Material (S/W)", 0.035, 0.40],
    ["ACM Install (S/W)",        0.080, 0.10],
    ["Corrugated Install (S/W)", 0.040, 0.05],
    ["IMP Install (S/W)",        0.090, 0.00],
    ["Screen Louver Install (S/W)", 0.035, 0.00],
  ];
  const retainagePct = 10;

  const rows: SOVRow[] = seeds.map(([desc, weight, hint], i) => {
    const scheduledValue = Math.round(contractValue * weight);
    const pct = Math.min(100, Math.max(0, (hint + (salt - 0.5) * 0.1) * 100));
    const previousApplication = Math.round(scheduledValue * Math.max(0, pct / 100 - 0.08));
    const thisPeriod = Math.round(scheduledValue * Math.min(pct / 100, 0.08));
    const storedThisPeriod = Math.round(scheduledValue * 0.02 * salt);
    const completeAndStored = previousApplication + thisPeriod + storedThisPeriod;
    const completeAndStoredPct = Math.round((completeAndStored / Math.max(1, scheduledValue)) * 100);
    const balanceToFinish = Math.max(0, scheduledValue - completeAndStored);
    const retainage = Math.round((completeAndStored * retainagePct) / 100);
    return {
      itemNumber: i + 1,
      description: desc,
      scheduledValue,
      previousApplication,
      thisPeriod,
      storedThisPeriod,
      completeAndStoredPct,
      percentComplete: Math.round(pct),
      balanceToFinish,
      retainage,
    };
  });

  const t = (k: keyof SOVRow) =>
    rows.reduce((a, r) => a + (typeof r[k] === "number" ? (r[k] as number) : 0), 0);

  return {
    rows,
    retainagePct,
    totals: {
      scheduledValue: t("scheduledValue"),
      previousApplication: t("previousApplication"),
      thisPeriod: t("thisPeriod"),
      storedThisPeriod: t("storedThisPeriod"),
      completeAndStored:
        t("previousApplication") + t("thisPeriod") + t("storedThisPeriod"),
      balanceToFinish: t("balanceToFinish"),
      retainage: t("retainage"),
    },
  };
}

function hashToUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000) * 0.9 + 0.05;
}
