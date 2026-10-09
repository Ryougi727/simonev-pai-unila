import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusForPertemuan } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { WeekPicker } from "@/components/week-picker";
import { TablePagination } from "@/components/table-pagination";
import { MeetingSummary } from "@/components/meeting-summary";

export const dynamic = "force-dynamic";

export default async function PJMonitoringPage({ searchParams }: { searchParams: { week?: string; page?: string; pageSize?: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "PJ") redirect("/dashboard");

  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { totalMinggu: true, currentWeek: true },
  });
  const totalMinggu = kalender?.totalMinggu ?? 8;
  const week = Math.min(totalMinggu, Math.max(1, Number(searchParams.week) || kalender?.currentWeek || 1));
  const pageSizeValue = Number(searchParams.pageSize);
  const pageSize = [10, 20, 50].includes(pageSizeValue) ? pageSizeValue : 10;
  const requestedPage = Math.max(1, Math.floor(Number(searchParams.page) || 1));

  const kelompok = await prisma.kelompok.findMany({
    where: { faculty: user.faculty, OR: [{ mentorId: { not: null } }, { mentorAssignments: { some: {} } }] },
    select: {
      id: true, name: true,
      mentor: { select: { name: true } },
      mentorAssignments: { select: { mentor: { select: { name: true } } } },
      pertemuan: { where: { week }, select: { status: true, date: true, time: true } },
    },
    orderBy: { name: "asc" },
  });
  const totalPages = Math.max(1, Math.ceil(kelompok.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageRows = kelompok.slice((page - 1) * pageSize, page * pageSize);
  const summaryRows = kelompok.map((k) => {
    const meeting = k.pertemuan[0] ?? null;
    return {
      id: k.id,
      name: k.name,
      mentorNames: k.mentorAssignments.length
        ? k.mentorAssignments.map((assignment) => assignment.mentor.name)
        : k.mentor?.name ? [k.mentor.name] : [],
      status: statusForPertemuan(meeting),
    };
  });
  const completedCount = summaryRows.filter((group) => group.status === "selesai").length;
  const pendingGroups = summaryRows.filter(
    (group): group is (typeof summaryRows)[number] & { status: Exclude<ReturnType<typeof statusForPertemuan>, "selesai"> } =>
      group.status !== "selesai"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl font-semibold">Monitoring Mentor</h1>
        <WeekPicker totalMinggu={totalMinggu} active={week} basePath="/pj/monitoring" pageSize={pageSize} />
      </div>
      <MeetingSummary week={week} completedCount={completedCount} pendingGroups={pendingGroups} />
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Kelompok</th>
              <th className="px-4 py-2.5 font-bold">Mentor</th>
              <th className="px-4 py-2.5 font-bold">Jadwal</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((k) => {
              const rec = k.pertemuan[0];
              const status = statusForPertemuan(rec ?? null);
              return (
                <tr key={k.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                  <td className="px-4 py-2.5 font-semibold">{k.name}</td>
                  <td className="px-4 py-2.5">{k.mentorAssignments.length ? k.mentorAssignments.map((a) => a.mentor.name).join(", ") : k.mentor?.name || "-"}</td>
                  <td className="px-4 py-2.5">{rec ? `${rec.date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, ${rec.time}` : "-"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={status} /></td>
                </tr>
              );
            })}
            {!kelompok.length && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada kelompok pada fakultas ini.</td></tr>
            )}
          </tbody>
        </table>
        </div>
        <TablePagination
          basePath="/pj/monitoring"
          page={page}
          pageSize={pageSize}
          totalItems={kelompok.length}
          query={{ week: String(week) }}
          itemLabel="kelompok"
        />
      </div>
    </div>
  );
}
