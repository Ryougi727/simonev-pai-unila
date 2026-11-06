import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, ChevronRight, FolderOpen, Search } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusForPertemuan } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { TablePagination } from "@/components/table-pagination";
import { WeekPicker } from "@/components/week-picker";

type MonitoringRole = "ADMIN" | "PJ";
type PendingGroupsSearchParams = {
  week?: string;
  page?: string;
  pageSize?: string;
  faculty?: string;
  q?: string;
};

export async function PendingGroupsPage({
  role,
  searchParams,
}: {
  role: MonitoringRole;
  searchParams: PendingGroupsSearchParams;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; faculty?: string } | undefined;
  if (!user || user.role !== role) redirect("/dashboard");

  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { totalMinggu: true, currentWeek: true },
  });
  const totalMinggu = kalender?.totalMinggu ?? 8;
  const week = Math.min(totalMinggu, Math.max(1, Number(searchParams.week) || kalender?.currentWeek || 1));
  const pageSizeValue = Number(searchParams.pageSize);
  const pageSize = [10, 20, 50].includes(pageSizeValue) ? pageSizeValue : 10;
  const requestedPage = Math.max(1, Math.floor(Number(searchParams.page) || 1));
  const searchQuery = (searchParams.q || "").trim();
  const faculty = role === "ADMIN"
    ? searchParams.faculty || "all"
    : typeof user.faculty === "string" ? user.faculty : "";
  const basePath = role === "ADMIN"
    ? "/admin/monitoring/belum-selesai"
    : "/pj/monitoring/belum-selesai";
  const backHref = role === "ADMIN" ? "/admin/monitoring" : "/pj/monitoring";

  const groups = await prisma.kelompok.findMany({
    where: {
      ...(faculty !== "all" ? { faculty } : {}),
      OR: [{ mentorId: { not: null } }, { mentorAssignments: { some: {} } }],
    },
    select: {
      id: true,
      name: true,
      faculty: true,
      mentor: { select: { name: true } },
      mentorAssignments: { select: { mentor: { select: { name: true } } } },
      pertemuan: { where: { week }, select: { status: true, date: true, time: true } },
    },
    orderBy: { name: "asc" },
  });

  const pendingGroups = groups
    .map((group) => {
      const meeting = group.pertemuan[0] ?? null;
      const mentorNames = group.mentorAssignments.length
        ? group.mentorAssignments.map((assignment) => assignment.mentor.name)
        : group.mentor?.name ? [group.mentor.name] : [];
      return {
        ...group,
        meeting,
        mentorNames,
        status: statusForPertemuan(meeting),
      };
    })
    .filter((group) => group.status !== "selesai")
    .filter((group) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLocaleLowerCase("id");
      return [group.name, group.faculty, ...group.mentorNames]
        .some((value) => value.toLocaleLowerCase("id").includes(query));
    });

  const totalPages = Math.max(1, Math.ceil(pendingGroups.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageRows = pendingGroups.slice((page - 1) * pageSize, page * pageSize);
  const monitoringHref = `${backHref}?week=${week}${role === "ADMIN" && faculty !== "all" ? `&faculty=${encodeURIComponent(faculty)}` : ""}`;

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl border border-[#dcefe2] bg-white p-5 dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <Link href={monitoringHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary dark:hover:text-primary-dark">
          <ArrowLeft size={15} /> Kembali ke monitoring
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-on-surface">
          <Link href={monitoringHref} className="text-lg text-gray-500 hover:text-primary dark:hover:text-primary-dark">Monitoring</Link>
          <ChevronRight size={18} className="text-gray-400" />
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-lg font-semibold dark:bg-white/10">
            <FolderOpen size={18} className="text-primary dark:text-primary-dark" />
            Kelompok belum selesai
          </span>
        </div>
        <p className="text-sm text-gray-500">Daftar kelompok yang belum menyelesaikan pertemuan minggu {week}.</p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dcefe2] pt-4 dark:border-[#1d3527]">
          <form method="GET" action={basePath} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="week" value={week} />
            <input type="hidden" name="pageSize" value={pageSize} />
            {role === "ADMIN" && faculty !== "all" && <input type="hidden" name="faculty" value={faculty} />}
            <label className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari kelompok atau mentor…"
                aria-label="Cari kelompok atau mentor"
                className="w-64 rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-700"
              />
            </label>
            <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">Cari</button>
          </form>
          <WeekPicker
            totalMinggu={totalMinggu}
            active={week}
            basePath={basePath}
            pageSize={pageSize}
            faculty={role === "ADMIN" ? faculty : undefined}
            searchQuery={searchQuery}
            showFacultyFilter={role === "ADMIN"}
            showDataSkeleton
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dcefe2] bg-white dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <div className="flex items-center justify-between gap-3 border-b border-[#dcefe2] px-4 py-3 dark:border-[#1d3527]">
          <div className="font-semibold text-on-surface">Kelompok belum selesai</div>
          <div className="text-xs text-gray-500">{pendingGroups.length} kelompok</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-gray-400">
                <th className="px-4 py-3 font-bold">Kelompok</th>
                {role === "ADMIN" && <th className="px-4 py-3 font-bold">Fakultas</th>}
                <th className="px-4 py-3 font-bold">Mentor</th>
                <th className="px-4 py-3 font-bold">Jadwal</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((group) => (
                <tr key={group.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/kelompok/${group.id}`} className="hover:text-primary dark:hover:text-primary-dark">{group.name}</Link>
                  </td>
                  {role === "ADMIN" && <td className="px-4 py-3">{group.faculty}</td>}
                  <td className="px-4 py-3">{group.mentorNames.length ? group.mentorNames.join(", ") : "-"}</td>
                  <td className="px-4 py-3">
                    {group.meeting
                      ? `${group.meeting.date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${group.meeting.time}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={group.status} /></td>
                </tr>
              ))}
              {!pendingGroups.length && (
                <tr>
                  <td colSpan={role === "ADMIN" ? 5 : 4} className="px-4 py-12 text-center text-sm text-gray-500">
                    {searchQuery
                      ? `Tidak ada kelompok yang cocok dengan "${searchQuery}".`
                      : `Semua kelompok telah menyelesaikan pertemuan minggu ${week}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          basePath={basePath}
          page={page}
          pageSize={pageSize}
          totalItems={pendingGroups.length}
          query={{ week: String(week), ...(role === "ADMIN" && faculty !== "all" ? { faculty } : {}), ...(searchQuery ? { q: searchQuery } : {}) }}
          itemLabel="kelompok"
          showDataSkeleton
        />
      </div>
      <p className="text-xs text-gray-500">
        Terjadwal berarti jadwal belum berlangsung; status lainnya menunjukkan kelompok belum dijadwalkan atau belum menyelesaikan pertemuan.
      </p>
    </div>
  );
}
