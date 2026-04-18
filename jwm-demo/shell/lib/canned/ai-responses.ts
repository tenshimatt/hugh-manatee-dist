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

  // default
  return {
    text:
      "I can help with shop floor questions — jobs at risk, scrap trends, on-time delivery, NCR status, or estimate turnaround. Try one of these:",
    followups: [
      "Which architectural jobs are at risk this week?",
      "Why is scrap up on Laser #2?",
      "What's our on-time delivery looking like?",
    ],
  };
}
