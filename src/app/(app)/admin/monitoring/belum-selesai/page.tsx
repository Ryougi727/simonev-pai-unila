import { PendingGroupsPage } from "@/components/pending-groups-page";

export const dynamic = "force-dynamic";

export default function AdminPendingGroupsPage({
  searchParams,
}: {
  searchParams: { week?: string; page?: string; pageSize?: string; faculty?: string; q?: string };
}) {
  return <PendingGroupsPage role="ADMIN" searchParams={searchParams} />;
}
