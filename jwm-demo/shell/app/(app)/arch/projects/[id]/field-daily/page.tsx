import { redirect } from "next/navigation";

/**
 * Legacy project-scoped Field Daily subroute. Redirects to the top-level
 * /arch/field-daily list, filtered to this project. The canonical module
 * now lives at /arch/field-daily (see JWM1451-87).
 */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/arch/field-daily?project=${encodeURIComponent(id)}`);
}
