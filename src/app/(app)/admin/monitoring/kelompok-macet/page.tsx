import { StalledGroupsPage } from "@/components/stalled-groups-page";

export const dynamic = "force-dynamic";

export default function AdminStalledGroupsPage({
  searchParams,
}: {
  searchParams: { week?: string; page?: string; pageSize?: string; faculty?: string; q?: string; severity?: string };
}) {
  return <StalledGroupsPage role="ADMIN" searchParams={searchParams} />;
}
