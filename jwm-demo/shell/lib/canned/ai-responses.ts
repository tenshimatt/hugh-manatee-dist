export interface AITableRow {
  wo: string;
  customer: string;
  part: string;
  risk: string;
  due: string;
  status: string;
}

export interface AIResponse {
  text: string;
  table?: {
    columns: string[];
    rows: string[][];
  };
  followups?: string[];
}

export function matchCannedResponse(query: string): AIResponse {
  const q = query.toLowerCase();

  if (q.includes("at risk") || q.includes("architectural")) {
    return {
      text:
        "Three architectural jobs are at risk of missing their delivery this week. The common theme is the Laser #2 kerf drift I flagged earlier — it's blocking stringer cuts for two of them. Here's the breakdown:",
      table: {
        columns: ["Work Order", "Customer", "Part", "Risk", "Due", "Status"],
        rows: [
          ["WO-2026-00218", "Opryland (Ryman)", "Monumental Stair", "Laser #2 hold", "Fri 4/19", "In planning"],
          ["WO-2026-00209", "Opryland (Ryman)", "Stair Stringer", "Rework queued", "Thu 4/18", "Weld Bay A"],
          ["WO-2026-00203", "Vanderbilt Medical", "Curved Stringer", "Scrap >2 pcs", "Wed 4/17", "Late"],
        ],
      },
      followups: [
        "What does the Vanderbilt overrun look like in dollars?",
        "Reschedule WO-00218 onto Laser #1?",
        "Draft a customer heads-up note for Ryman.",
      ],
    };
  }

  if (q.includes("scrap") || q.includes("laser")) {
    return {
      text:
        "Scrap is running at 3.4% over the last 30 days — up from 2.3% the month before. The increase is concentrated on Laser #2. I already opened an anomaly card with the hypothesis: nozzle wear (404 of ~420 pierce hours). Replacing it before next shift should drop scrap back toward 1.8%.",
      table: {
        columns: ["Machine", "30d Scrap", "Prior 30d", "Delta"],
        rows: [
          ["Laser #2", "4.9%", "1.8%", "+3.1 pp"],
          ["Laser #1", "1.6%", "1.7%", "-0.1 pp"],
          ["CNC #1", "0.9%", "1.1%", "-0.2 pp"],
          ["Press Brake #1", "1.1%", "1.0%", "+0.1 pp"],
        ],
      },
      followups: [
        "Schedule the nozzle change now.",
        "Show me the cut program history for PRG-A36-050-STRING-V2.",
      ],
    };
  }

  if (q.includes("iad181") || q.includes("25071") || q.includes("amazon")) {
    return {
      text:
        "IAD181 Fitout (25071) is Matt Rasmussen's. It's 61% complete, Project Health green, Budget Health green with only 2% of the $1.553M contract spent to date and $1.852M Budget Remaining. Current margin holding at 24%. Full dashboard: /arch/projects/25071-IAD181",
      followups: [
        "Open the IAD181 dashboard",
        "Show Matt Rasmussen's full project list",
        "What's in the Field Install section for IAD181?",
      ],
    };
  }

  if (q.includes("pipeline") || q.includes("engineering") || q.includes("kanban") || q.includes("stages")) {
    return {
      text:
        "The engineering pipeline has 316 active Architectural jobs (A Shop) spread across 13 stages from Uncategorized through Release to Shop. The heavy middle is CNC Programming (67) and Layout (33). Open /engineering/pipeline to see the live board — 12 columns matching Drew's current Smartsheet view.",
      followups: [
        "Open the Engineering Kanban",
        "Which PM has the most cards in the pipeline?",
        "How many are stuck in Correction?",
      ],
    };
  }

  if (q.includes("pm") || q.includes("project manager") || q.includes("my projects") || q.includes("cole") || q.includes("drew") || q.includes("marc") || q.includes("dillon") || q.includes("rasmussen")) {
    return {
      text:
        "Four PMs actively carrying Architectural work right now: Cole Norona (6 projects), Marc Ribar (8 — the largest book), Dillon Bowman (6), Matt Rasmussen (8 incl. IAD181 Fitout). Each has a PMO home at /arch/pm/{slug} with their live project list, quick links, forms, upcoming tasks, and budget chart.",
      followups: [
        "Open Cole Norona's PMO home",
        "Show me Marc Ribar's active projects",
        "What's Matt Rasmussen's biggest open budget?",
      ],
    };
  }

  if (q.includes("anomaly") || q.includes("nozzle") || q.includes("hold") || q.includes("anom")) {
    return {
      text:
        "Active anomaly ANOM-2026-0042 on Flat Laser #2 — scrap pattern, hypothesis is nozzle wear (404 of ~420 pierce hours). Three jobs affected (Vanderbilt, Opryland, Nissan HQ) totalling $3,940 in scrap cost. Click the banner on /shop/flat-laser-2 for the full breakdown, evidence, and recommended actions.",
      followups: [
        "Open the anomaly details",
        "Schedule the nozzle change now",
        "Reroute WO-00218 to Laser #1",
      ],
    };
  }

  if (q.includes("route") || q.includes("branch") || q.includes("router") || q.includes("ncr loop")) {
    return {
      text:
        "Three routes seeded in ERPNext, each the per-job station sequence defined at estimate time. ROUTE-25071-IAD181 is 6 steps and running (Weld Bay A right now). ROUTE-24060-BM01 has an active NCR side-branch — Flat Laser 2 output flagged for burrs, routing to Finishing before Press Brake. ROUTE-25067-FS02 is still Draft, 7 steps. Open /engineering/routes to edit or visualise any of them.",
      followups: [
        "Open ROUTE-24060-BM01 (NCR branch)",
        "Show ROUTE-25071-IAD181 pipeline",
        "How do we close the NCR loopback on BM01?",
        "Can I reorder the steps on FS02?",
      ],
    };
  }

  if (q.includes("budget") || q.includes("margin") || q.includes("cost to come") || q.includes("backlog")) {
    return {
      text:
        "Current Architectural book: $179.5M CM total, $132.2M Current Budget, $108.1M Backlog, $72.7M Cost to Come, 26.3% combined margin on 330 live active projects (pulled from the ERPNext Production Schedule — 3,948 schedule lines). Top-line tiles on /exec/arch; per-project budgets + COR summary on each Project Dashboard (e.g. /arch/projects/25071-IAD181).",
      followups: [
        "Open the Executive dashboard",
        "Show me projects with margin slippage",
        "Which project has the most unbilled this week?",
      ],
    };
  }

  if (q.includes("shop mix") || q.includes("division") || q.includes("a shop") || q.includes("t shop") || q.includes("architectural") || q.includes("processing")) {
    return {
      text:
        "Two divisions. A Shop (1010, Architectural) is the bigger book right now — 316 active jobs in the engineering pipeline, panel-heavy. T Shop (1040, Processing) runs tube-laser and fabrication and is currently carrying less engineering WIP. Engineering, Shop Floor, Inventory, QC, Safety, Maintenance, Fleet are shared between them — see the sidebar.",
      followups: [
        "Show A Shop backlog",
        "Show T Shop backlog",
        "Which PMs straddle both divisions?",
      ],
    };
  }

  if (q.includes("ship") || q.includes("shipping") || q.includes("bottleneck") || q.includes("ship date")) {
    return {
      text:
        "The Ship Schedule view at /shop/ship-schedule replicates Drew's Excel sheet — every job grouped by ship date, with auto-flagged bottlenecks: red for 5+ jobs on one day, amber for 3-4, normal for 1-2. Calendar heatmap or grouped list view. Click any day to drill into the jobs shipping that date.",
      followups: [
        "Open the Ship Schedule",
        "Which days are red-flagged this month?",
        "Show me the grouped list view",
      ],
    };
  }

  if (q.includes("schedule") || q.includes("drew") || q.includes("production schedule")) {
    return {
      text:
        "Drew's production schedule is at /shop/scheduler — same grid shape Drew opens every morning in Excel (rows = jobs, columns = workstations PGM → FL/TL → SHEAR → FM → MA → WE → GRINDING → ASM → PEM → FIN → QA → OS → SHIP), but live-backed. Colour cells match his on-track / at-risk / behind / complete convention.",
      followups: [
        "Open the scheduler",
        "Which row has the most red cells?",
        "Show this week's handoffs only",
      ],
    };
  }

  // default
  return {
    text:
      "I can help with jobs at risk, scrap, on-time delivery, NCRs, the engineering pipeline, routes, any PM's project book, project health & budget, and the Flat Laser #2 anomaly. Try one of these:",
    followups: [
      "How is IAD181 tracking on budget?",
      "Show me the engineering pipeline",
      "What routes have NCR branches active?",
      "Who's carrying the biggest project book right now?",
      "Why is scrap up on Laser #2?",
      "Break down A Shop vs T Shop work in progress",
    ],
  };
}
