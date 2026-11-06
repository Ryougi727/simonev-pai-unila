import { StalledGroupsPage } from "@/components/stalled-groups-page";

export const dynamic = "force-dynamic";

export default function PJStalledGroupsPage({
  searchParams,
}: {
  searchParams: { week?: string; page?: string; pageSize?: string; q?: string; severity?: string };
}) {
  return <StalledGroupsPage role="PJ" searchParams={searchParams} />;
}
