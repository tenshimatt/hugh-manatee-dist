import { SubRouteStub } from "../_stub";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SubRouteStub
      projectId={id}
      title="ROM"
      description="Rough order of magnitude estimate and takeoff reference."
    />
  );
}
