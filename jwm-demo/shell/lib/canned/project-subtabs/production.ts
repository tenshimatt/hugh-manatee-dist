// Canned Production — schema mirrors A-Shop/Production.xlsx.
// Columns: Phase Code · Scope · Man hours Used · Units Drawn/Fab'd/Installed ·
// Cost to date · $/MH current · Hrs/unit · Hrs/unit estimated · Total hrs est.
// · Total units est. · $/Hr est. · % Work Done.

export type ProductionRow = {
  phaseCode: string;
  scope: string;
  stage: "Engineering" | "Fabrication" | "Field" | "Equipment";
  manHoursUsed: number;
  unitsProduced: number;
  costToDate: number;
  currentCostPerMH: number;
  hoursPerUnit: number;
  hoursPerUnitEstimated: number;
  totalHoursEstimated: number;
  totalUnitsEstimated: number;
  estimatedCostPerHour: number;
  percentComplete: number;
};

export type ProductionData = {
  rows: ProductionRow[];
  totals: {
    hoursUsed: number;
    hoursEstimated: number;
    unitsProduced: number;
    unitsEstimated: number;
    costToDate: number;
    percentComplete: number;
  };
};

export function cannedProduction(jobNumber: string): ProductionData {
  const salt = hashToUnit(jobNumber);
  const seeds: Array<
    [string, string, ProductionRow["stage"], number, number, number]
  > = [
    // [phase, scope, stage, units_est, hrs_per_unit_est, pct (0..1)]
    ["30101", "Shop Drawings",             "Engineering", 320, 1.2,  0.85],
    ["30501", "Fab Sketch",                "Engineering", 180, 0.6,  0.60],
    ["30601", "QA/QC",                     "Engineering", 320, 0.3,  0.55],
    ["3070",  "CNC Coding",                "Engineering", 420, 0.35, 0.48],
    ["40101", "Shop Labor",                "Fabrication", 320, 9.5,  0.42],
    ["5550",  "Crate Fabrication",         "Fabrication", 110, 2.1,  0.28],
    ["60901", "Z-Furring Labor",           "Field",       260, 1.6,  0.12],
    ["61301", "ACM Installation",          "Field",       320, 4.4,  0.08],
    ["61401", "IMWP Installation",         "Field",       220, 5.1,  0.05],
    ["6150",  "Metal Panel Installation",  "Field",       180, 4.8,  0.10],
    ["62401", "Louver Installation",       "Field",        44, 3.2,  0.00],
    ["63001", "Safety",                    "Field",         1, 120,  0.10],
    ["70101", "Equipment Rental",          "Equipment",     1, 0,    0.20],
  ];
  const costPerHr = 62 + Math.round(8 * salt);

  const rows: ProductionRow[] = seeds.map(([phase, scope, stage, unitsEst, hpuEst, pct]) => {
    const pctJitter = Math.min(1, Math.max(0, pct + (salt - 0.5) * 0.1));
    const totalHoursEstimated = Math.round(unitsEst * hpuEst);
    const unitsProduced = Math.round(unitsEst * pctJitter);
    const hoursUsed = Math.round(unitsProduced * hpuEst * (0.9 + salt * 0.25));
    const hoursPerUnit = unitsProduced > 0 ? +(hoursUsed / unitsProduced).toFixed(2) : 0;
    const costToDate = hoursUsed * costPerHr;
    return {
      phaseCode: phase,
      scope,
      stage,
      manHoursUsed: hoursUsed,
      unitsProduced,
      costToDate,
      currentCostPerMH: costPerHr,
      hoursPerUnit,
      hoursPerUnitEstimated: hpuEst,
      totalHoursEstimated,
      totalUnitsEstimated: unitsEst,
      estimatedCostPerHour: costPerHr,
      percentComplete: Math.round(pctJitter * 100),
    };
  });

  const hoursUsed = rows.reduce((a, r) => a + r.manHoursUsed, 0);
  const hoursEstimated = rows.reduce((a, r) => a + r.totalHoursEstimated, 0);
  const unitsProduced = rows.reduce((a, r) => a + r.unitsProduced, 0);
  const unitsEstimated = rows.reduce((a, r) => a + r.totalUnitsEstimated, 0);
  const costToDate = rows.reduce((a, r) => a + r.costToDate, 0);
  const percentComplete = Math.round((hoursUsed / Math.max(1, hoursEstimated)) * 100);

  return {
    rows,
    totals: { hoursUsed, hoursEstimated, unitsProduced, unitsEstimated, costToDate, percentComplete },
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
