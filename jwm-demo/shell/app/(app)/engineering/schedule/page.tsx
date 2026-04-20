/**
 * Engineering Resource Planning (JWM1451-83).
 *
 * Server component — fetches the engineer roster from ERPNext (5s timeout,
 * canned fallback on any failure) and seeds an initial assignment set so the
 * demo doesn't start empty. Hands off to EngineerRosterClient for the
 * interactive roster / heatmap / drag-to-assign UX.
 */
import { listEngineers } from "@/lib/erpnext-live";
import { CARDS } from "@/lib/engineering-pipeline";
import { seedAssignments } from "@/lib/engineering-schedule";
import EngineerRosterClient from "@/components/engineering/EngineerRosterClient";

export const dynamic = "force-dynamic";

export default async function EngineeringSchedulePage() {
  const { data: engineers, source } = await listEngineers();
  const seeds = seedAssignments(
    engineers,
    CARDS.slice(0, 20).map((c) => c.id),
  );

  return (
    <EngineerRosterClient
      engineers={engineers}
      cards={CARDS}
      initialAssignments={seeds}
      source={source}
    />
  );
}
