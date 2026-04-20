export function DataSourceFootnote({
  source,
  note,
}: {
  source: "live" | "canned";
  note?: string;
}) {
  return (
    <p className="mt-4 text-[10px] text-slate-400">
      Data source:{" "}
      <span className="font-semibold text-slate-500">
        {source === "live" ? "ERPNext (live)" : "canned template (Phase-2: link to source)"}
      </span>
      {note ? <span className="ml-2 text-slate-400">· {note}</span> : null}
    </p>
  );
}
