import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FieldDailyForm } from "@/components/field-daily/FieldDailyForm";

export const dynamic = "force-dynamic";

/**
 * /arch/field-daily/new — superintendent form entry. URL-accessible (no
 * auth friction — per Chris the field uses a URL). Supports
 * ?project=<jobNumber> deep-link to pre-fill job_number.
 */
export default function NewFieldDailyPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/arch/field-daily"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A2E5C]"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> All Field Dailies
      </Link>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
          Architectural
        </div>
        <h1 className="text-2xl font-bold text-[#0A2E5C]">New Field Daily Report</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill out daily. Required fields are marked with *. Additional
          questions appear as you answer.
        </p>
      </div>
      <FieldDailyForm />
    </div>
  );
}
