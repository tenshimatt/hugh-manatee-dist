/**
 * /fleet — Fleet landing (JWM1451-89).
 *
 * Three tiles per Chris's Pool Vehicle sign-out note:
 *   - Pool Vehicles (roster + status)
 *   - Approved Drivers (who can sign one out)
 *   - Bookings Calendar (week view)
 *
 * Requirement verbatim: "If there is a fleet POOL vehicle it can be signed
 * out IF the driver is on the approved drivers list. Form is for anyone.
 * Calendar for anyone to see."
 */
import Link from "next/link";
import { Truck, Users, CalendarRange } from "lucide-react";

const TILES = [
  {
    href: "/fleet/pool",
    title: "Pool Vehicles",
    desc: "Roster of company trucks and vans with live availability.",
    icon: Truck,
    accent: "#064162",
  },
  {
    href: "/fleet/drivers",
    title: "Approved Drivers",
    desc: "Employees authorised to sign out a pool vehicle.",
    icon: Users,
    accent: "#0a7d6b",
  },
  {
    href: "/fleet/bookings",
    title: "Bookings Calendar",
    desc: "Week view of who has what vehicle, when.",
    icon: CalendarRange,
    accent: "#e69b40",
  },
];

export default function FleetPage() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          Fleet
        </div>
        <h1 className="text-2xl font-bold text-[#064162] tracking-tight">
          Fleet — Pool Vehicle Sign-out
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Anyone can book a vehicle, but the <strong>driver</strong> must be on
          the approved drivers list. High-level visibility for vehicles and
          drivers; calendar is open to everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md hover:border-[#064162]/30 transition-all"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
              style={{ backgroundColor: t.accent }}
            >
              <t.icon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-900 group-hover:text-[#064162]">
              {t.title}
            </div>
            <div className="text-xs text-slate-600 mt-1">{t.desc}</div>
          </Link>
        ))}
      </div>

      <div className="pt-4">
        <Link
          href="/fleet/bookings/new"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#064162] text-white text-sm font-semibold hover:bg-[#0a5a85]"
        >
          New Booking
        </Link>
      </div>
    </div>
  );
}
