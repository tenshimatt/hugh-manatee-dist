// Canned Project Charter — schema mirrors A-Shop/Project Charter.xlsx.
// Template is narrative-heavy: general info, customer, owner, billing, scope,
// objectives, stakeholders, deliverables, milestones, risks.

export type CharterFieldRow = { label: string; value: string };
export type CharterSection = {
  heading: string;
  lead?: string;
  fields?: CharterFieldRow[];
  paragraphs?: string[];
};

export type CharterData = {
  contractStatus: "Received" | "Executed" | "In Review" | "Pending";
  sections: CharterSection[];
};

export function cannedCharter(args: {
  jobNumber: string;
  jobName: string;
  contractValue: number;
  pmName: string;
  jobAddress?: string;
}): CharterData {
  const { jobNumber, jobName, contractValue, pmName, jobAddress } = args;

  return {
    contractStatus: "Received",
    sections: [
      {
        heading: "Project Scope Abstract",
        lead:
          "This charter offers justification to decision makers who will allocate resources to the project. " +
          "It describes the problem, project objectives, identifies authorization, measures expectations, and records risks.",
      },
      {
        heading: "General Information",
        fields: [
          { label: "Job Name",                 value: jobName },
          { label: "Work Site",                value: jobAddress ?? "Nashville, TN" },
          { label: "Contract Value",           value: contractValue ? `$${contractValue.toLocaleString()}` : "TBD" },
          { label: "Completion Date",          value: "05/14/27" },
          { label: "Scope",                    value: "Supply and install exterior ACM, IMP, louvers, and accessory flashings per drawings." },
          { label: "Job Type",                 value: "Private" },
          { label: "Material or Material+Labor", value: "Material and Labor" },
          { label: "Bonded Job",               value: "No" },
        ],
      },
      {
        heading: "Customer",
        fields: [
          { label: "Contact",  value: "Gordon Mitchell" },
          { label: "Phone",    value: "(615) 555-0129" },
          { label: "Address",  value: "221 Marshall Ave" },
          { label: "City",     value: "Nashville, TN 37210" },
          { label: "Email",    value: "g.mitchell@example.com" },
          { label: "Customer Portal", value: "Yes — Procore" },
        ],
      },
      {
        heading: "Owner Info",
        fields: [
          { label: "Contact",  value: "Ellis Development Group" },
          { label: "Phone",    value: "(615) 555-0188" },
          { label: "Address",  value: "900 Division St" },
          { label: "City",     value: "Nashville, TN 37203" },
        ],
      },
      {
        heading: "Billing Info",
        fields: [
          { label: "Dually Executed Contract",  value: "Yes" },
          { label: "Executed Contract Date",    value: "08/15/26" },
          { label: "Certified Payroll",         value: "No" },
          { label: "Prevailing Wage Job",       value: "No" },
          { label: "Retainage %",               value: "10% until 50% complete, then 5%" },
          { label: "Payment Terms",             value: "Net 30" },
          { label: "Billing due date",          value: "25th of month" },
          { label: "Taxable",                   value: "Yes" },
          { label: "DOT Project",               value: "No" },
        ],
      },
      {
        heading: "Project Objectives",
        paragraphs: [
          "Deliver a weather-tight exterior envelope on schedule and on budget.",
          "Maintain a Green budget-health status through the duration of the project.",
          "Achieve zero lost-time injuries across all crews and subcontractors.",
          "Transition all shop and field production into the new Plante ERP dashboard.",
        ],
      },
      {
        heading: "Key Stakeholders",
        fields: [
          { label: "Project Manager",           value: pmName },
          { label: "Executive Sponsor",         value: "Chris Ball (VP Ops)" },
          { label: "Engineering Lead",          value: "Rick Torre" },
          { label: "Shop Superintendent",       value: "Marcus Reed" },
          { label: "Field Superintendent",      value: "Dan Novak" },
        ],
      },
      {
        heading: "Key Deliverables",
        paragraphs: [
          "Approved shop drawings and submittal pack.",
          "Fabricated panels ready to ship per approved schedule.",
          "Installed exterior envelope with passing QA/QC sign-off.",
          "Final close-out package, including O&M manuals and warranty documentation.",
        ],
      },
      {
        heading: "Risks & Assumptions",
        paragraphs: [
          "Material lead-times on composite panels remain within 10–12 weeks.",
          "Site access and coordination with GC remains consistent with the baseline schedule.",
          "No scope additions beyond the accepted Change Order Request Log.",
          "Crew availability is adequate through peak installation (Feb–Apr 27).",
        ],
      },
      {
        heading: "Reference",
        lead:
          `Job Number ${jobNumber} · Charter derived from the A-Shop Project Charter template. ` +
          `Phase-2: link to authoritative source document in the document-management system.`,
      },
    ],
  };
}
