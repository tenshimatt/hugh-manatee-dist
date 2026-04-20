import Image from "next/image";

export function ProjectHero({
  jobName,
  jobNumber,
  pmName,
  pmEmail,
  pmPhone,
}: {
  jobName: string;
  jobNumber: string;
  pmName: string;
  pmEmail: string;
  pmPhone?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#0A2E5C]/20 bg-gradient-to-r from-[#0A2E5C] via-[#0c3a73] to-[#0A2E5C] text-white shadow-md">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,#C9A349,transparent_55%)]" />
      <div className="relative flex items-center justify-between px-8 py-6 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-white/95 flex items-center justify-center shadow-sm shrink-0">
            <Image
              src="/logo-jwm.svg"
              alt="JWM"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
              Project Dashboard
            </div>
            <h1 className="text-3xl font-bold leading-tight">{jobName}</h1>
            <div className="text-sm text-white/70 mt-1">
              Job Number <span className="text-white font-semibold">{jobNumber}</span>
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C9A349] font-bold">
            Project Manager
          </div>
          <div className="text-lg font-semibold">{pmName}</div>
          <a
            href={`mailto:${pmEmail}`}
            className="text-white/80 hover:text-white block text-xs"
          >
            {pmEmail}
          </a>
          {pmPhone && <div className="text-white/60 text-xs">{pmPhone}</div>}
        </div>
      </div>
    </div>
  );
}
