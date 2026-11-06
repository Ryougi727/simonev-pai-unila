import { PendingGroupsPage } from "@/components/pending-groups-page";

export const dynamic = "force-dynamic";

export default function PJPendingGroupsPage({
  searchParams,
}: {
  searchParams: { week?: string; page?: string; pageSize?: string; q?: string };
}) {
  return <PendingGroupsPage role="PJ" searchParams={searchParams} />;
}
