import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, ChevronRight, FolderOpen, Search } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMeetingWarnings, type MeetingWarnings } from "@/lib/meeting-warnings";
import { TablePagination } from "@/components/table-pagination";
import { WeekPicker } from "@/components/week-picker";
import { WarningSeverityFilter } from "@/components/warning-severity-filter";

type MonitoringRole = "ADMIN" | "PJ";
type StalledGroupsSearchParams = {
  week?: string;
  page?: string;
  pageSize?: string;
  faculty?: string;
  q?: string;
  severity?: string;
};
type Severity = keyof MeetingWarnings;

const severityDetails: Record<Severity, { label: string; classes: string }> = {
  early: {
    label: "Peringatan Dini",
    classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  yellow: {
    label: "Peringatan 1",
    classes: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
  },
  orange: {
    label: "Peringatan 2",
    classes: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  },
  red: {
    label: "Peringatan 3",
    classes: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
};

export async function StalledGroupsPage({
  role,
  searchParams,
}: {
  role: MonitoringRole;
  searchParams: StalledGroupsSearchParams;
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
  const requestedSeverity = searchParams.severity || "all";
  const severity: Severity | "all" = requestedSeverity in severityDetails
    ? requestedSeverity as Severity
    : "all";
  const faculty = role === "ADMIN"
    ? searchParams.faculty || "all"
    : typeof user.faculty === "string" ? user.faculty : "";
  const basePath = role === "ADMIN"
    ? "/admin/monitoring/kelompok-macet"
    : "/pj/monitoring/kelompok-macet";
  const backHref = `${role === "ADMIN" ? "/admin/monitoring" : "/pj/monitoring"}?week=${week}${role === "ADMIN" && faculty !== "all" ? `&faculty=${encodeURIComponent(faculty)}` : ""}`;

  const groups = await prisma.kelompok.findMany({
    where: {
      ...(faculty !== "all" ? { faculty } : {}),
      OR: [{ mentorId: { not: null } }, { mentorAssignments: { some: {} } }],
    },
    select: {
      id: true,
      name: true,
      faculty: true,
      monitoringStartWeek: true,
      mentor: { select: { name: true } },
      mentorAssignments: { select: { mentor: { select: { name: true } } } },
      pertemuan: {
        where: { week: { lte: week } },
        select: { week: true, status: true, date: true, time: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const warnings = getMeetingWarnings(
    groups.map((group) => ({
      id: group.id,
      name: group.name,
      monitoringStartWeek: group.monitoringStartWeek,
      mentorNames: group.mentorAssignments.length
        ? group.mentorAssignments.map((assignment) => assignment.mentor.name)
        : group.mentor?.name ? [group.mentor.name] : [],
      pertemuan: group.pertemuan,
    })),
    week,
    kalender?.currentWeek ?? 1
  );
  const facultyByGroupId = new Map(groups.map((group) => [group.id, group.faculty]));
  const stalledGroups = (Object.keys(severityDetails) as Severity[]).flatMap((severity) =>
    warnings[severity].map((group) => ({ ...group, faculty: facultyByGroupId.get(group.id) ?? "", severity }))
  );
  const query = searchQuery.toLocaleLowerCase("id");
  const filteredGroups = stalledGroups
    .filter((group) => severity === "all" || group.severity === severity)
    .filter((group) =>
      !query || [group.name, group.faculty, ...group.mentorNames].some((value) => value.toLocaleLowerCase("id").includes(query))
    );
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageRows = filteredGroups.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl border border-[#dcefe2] bg-white p-5 dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary dark:hover:text-primary-dark">
          <ArrowLeft size={15} /> Kembali ke monitoring
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-on-surface">
          <Link href={backHref} className="text-lg text-gray-500 hover:text-primary dark:hover:text-primary-dark">Monitoring</Link>
          <ChevronRight size={18} className="text-gray-400" />
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-lg font-semibold dark:bg-white/10">
            <FolderOpen size={18} className="text-primary dark:text-primary-dark" />
            Kelompok macet
          </span>
        </div>
        <p className="text-sm text-gray-500">Kelompok dengan pertemuan berturut-turut yang belum terlaksana sampai minggu {week}.</p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dcefe2] pt-4 dark:border-[#1d3527]">
          <form method="GET" action={basePath} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="week" value={week} />
            <input type="hidden" name="pageSize" value={pageSize} />
            {role === "ADMIN" && faculty !== "all" && <input type="hidden" name="faculty" value={faculty} />}
            {severity !== "all" && <input type="hidden" name="severity" value={severity} />}
            <WarningSeverityFilter
              basePath={basePath}
              value={severity}
              week={week}
              pageSize={pageSize}
              faculty={role === "ADMIN" ? faculty : undefined}
              searchQuery={searchQuery}
            />
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
            warningSeverity={severity}
            showFacultyFilter={role === "ADMIN"}
            showDataSkeleton
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dcefe2] bg-white dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <div className="flex items-center justify-between gap-3 border-b border-[#dcefe2] px-4 py-3 dark:border-[#1d3527]">
          <div className="font-semibold text-on-surface">Kelompok macet</div>
          <div className="text-xs text-gray-500">{filteredGroups.length} kelompok</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-gray-400">
                <th className="px-4 py-3 font-bold">Kelompok</th>
                {role === "ADMIN" && <th className="px-4 py-3 font-bold">Fakultas</th>}
                <th className="px-4 py-3 font-bold">Mentor</th>
                <th className="px-4 py-3 font-bold">Pertemuan Terlewat</th>
                <th className="px-4 py-3 font-bold">Peringatan</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((group) => (
                <tr key={group.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/kelompok/${group.id}`} className="hover:text-primary dark:hover:text-primary-dark">{group.name}</Link>
                  </td>
                  {role === "ADMIN" && <td className="px-4 py-3">{group.faculty}</td>}
                  <td className="px-4 py-3">{group.mentorNames.length ? group.mentorNames.join(", ") : "Belum ditentukan"}</td>
                  <td className="px-4 py-3">
                    {group.missedMeetings} pertemuan berturut-turut
                    <div className="text-xs text-gray-500">Minggu {group.missedWeeks.join(", ")}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityDetails[group.severity].classes}`}>
                      {severityDetails[group.severity].label}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredGroups.length && (
                <tr>
                  <td colSpan={role === "ADMIN" ? 5 : 4} className="px-4 py-12 text-center text-sm text-gray-500">
                    {searchQuery
                      ? `Tidak ada kelompok yang cocok dengan "${searchQuery}"${severity !== "all" ? ` pada tingkat ${severityDetails[severity].label}` : ""}.`
                      : severity !== "all"
                        ? `Tidak ada kelompok dengan ${severityDetails[severity].label.toLocaleLowerCase("id")} sampai minggu ${week}.`
                        : `Tidak ada kelompok macet sampai minggu ${week}.`}
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
          totalItems={filteredGroups.length}
          query={{ week: String(week), ...(role === "ADMIN" && faculty !== "all" ? { faculty } : {}), ...(searchQuery ? { q: searchQuery } : {}), ...(severity !== "all" ? { severity } : {}) }}
          itemLabel="kelompok"
          showDataSkeleton
        />
      </div>
    </div>
  );
}
