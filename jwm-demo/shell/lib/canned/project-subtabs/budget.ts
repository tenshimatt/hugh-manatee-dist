// Canned Budget seed — schema mirrors A-Shop/Budget.xlsx.
// Header row: Phase Code · Description · Initial Budget · Change Orders ·
// PM Budget Changes · Current Budget (BAC) · Actual Cost (AC) · Committed Cost ·
// Projected to Spend · Budget Remaining · Health.

export type BudgetLine = {
  phaseCode: string;
  description: string;
  category: string;
  initial: number;
  changeOrders: number;
  pmChanges: number;
  current: number;     // BAC
  actual: number;      // AC
  committed: number;
  projected: number;
  remaining: number;
  health: "Green" | "Yellow" | "Red";
};

export type BudgetData = {
  lines: BudgetLine[];
  summary: {
    contract: number;
    initial: number;
    current: number;
    actual: number;
    committed: number;
    projected: number;
    remaining: number;
    changeOrderSell: number;
    budgetPctSpent: number;
    budgetHealth: "Green" | "Yellow" | "Red";
  };
};

// Produce a reasonable canned sample based on the phase-code vocabulary.
export function cannedBudget(jobNumber: string): BudgetData {
  const raw: Array<[string, string, string, number, number]> = [
    // [phase, desc, category, initialBudget, committedRatio 0..1]
    ["1010", "Composite Metals",            "MATERIALS",                  182_000, 0.70],
    ["1020", "Profile Metal Panels",        "MATERIALS",                   98_000, 0.55],
    ["1040", "Stainless Steel",             "MATERIALS",                   64_500, 0.48],
    ["1060", "Insulated Metal Panels",      "MATERIALS",                  142_000, 0.62],
    ["1110", "Flashing",                    "MATERIALS",                   38_000, 0.33],
    ["1140", "Insulation",                  "MATERIALS",                   24_800, 0.20],
    ["1150", "Louvers",                     "MATERIALS",                   47_200, 0.40],
    ["1180", "Subgirt",                     "MATERIALS",                   19_600, 0.12],
    ["2010", "Extrusions",                  "SHOP FABRICATION MATERIALS",  58_400, 0.65],
    ["2120", "Shop Fab Material",           "SHOP FABRICATION MATERIALS",  41_900, 0.55],
    ["3010", "Shop Drawings",               "DRAFTING/ENGINEERING",        72_000, 0.85],
    ["3050", "Fab Sketch",                  "DRAFTING/ENGINEERING",        18_500, 0.40],
    ["3060", "QA/QC",                       "DRAFTING/ENGINEERING",        22_000, 0.25],
    ["3070", "CNC Coding",                  "DRAFTING/ENGINEERING",        16_200, 0.30],
    ["4010", "Shop Labor",                  "SHOP LABOR",                 246_000, 0.50],
    ["4030", "CNC Time",                    "SHOP LABOR",                  52_800, 0.44],
    ["4040", "Extrusion Cutting",           "SHOP LABOR",                  28_100, 0.35],
    ["4050", "Clean And Break",             "SHOP LABOR",                  33_200, 0.38],
    ["4070", "Assembly",                    "SHOP LABOR",                  88_400, 0.40],
    ["5010", "Lumber",                      "CRATING MATERIALS",           12_300, 0.22],
    ["5550", "Crate Fabrication/Assembly",  "CRATING LABOR",               15_600, 0.30],
    ["5620", "Outbound Freight",            "FREIGHT",                     42_000, 0.05],
    ["6090", "Z-Furring Labor",             "FIELD LABOR",                 62_400, 0.15],
    ["6130", "ACM Installation",            "FIELD LABOR",                 98_500, 0.10],
    ["6140", "IMWP Installation",           "FIELD LABOR",                 72_300, 0.08],
    ["6150", "Metal Panel Installation",    "FIELD LABOR",                 81_700, 0.12],
    ["6240", "Louver Installation",         "FIELD LABOR",                 18_900, 0.00],
  ];
  // Deterministic jitter based on jobNumber hash so canned differs per job.
  const salt = hashToUnit(jobNumber);

  const lines: BudgetLine[] = raw.map(([phase, desc, cat, initial, committedRatio]) => {
    const cos = Math.round(initial * 0.04 * salt);
    const pm = Math.round(initial * 0.02 * (salt - 0.5));
    const current = initial + cos + pm;
    const actual = Math.round(current * Math.max(0, committedRatio - 0.10 * salt));
    const committed = Math.round(current * committedRatio);
    const projected = Math.round(current * Math.min(1.08, committedRatio + 0.25 * salt));
    const remaining = current - projected;
    const ratio = projected / Math.max(1, current);
    const health: "Green" | "Yellow" | "Red" =
      ratio > 1.05 ? "Red" : ratio > 0.98 ? "Yellow" : "Green";
    return {
      phaseCode: phase,
      description: desc,
      category: cat,
      initial,
      changeOrders: cos,
      pmChanges: pm,
      current,
      actual,
      committed,
      projected,
      remaining,
      health,
    };
  });

  const sum = (k: keyof BudgetLine) =>
    lines.reduce((a, r) => a + (typeof r[k] === "number" ? (r[k] as number) : 0), 0);
  const initial = sum("initial");
  const current = sum("current");
  const actual = sum("actual");
  const committed = sum("committed");
  const projected = sum("projected");
  const remaining = current - projected;
  const contract = Math.round(current * 1.18);
  const budgetPctSpent = Math.round((actual / Math.max(1, current)) * 100);
  const health: "Green" | "Yellow" | "Red" =
    budgetPctSpent > 100 ? "Red" : budgetPctSpent > 85 ? "Yellow" : "Green";

  return {
    lines,
    summary: {
      contract,
      initial,
      current,
      actual,
      committed,
      projected,
      remaining,
      changeOrderSell: Math.round(sum("changeOrders") * 1.2),
      budgetPctSpent,
      budgetHealth: health,
    },
  };
}

function hashToUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1
  return (((h >>> 0) % 1000) / 1000) * 0.9 + 0.05;
}
