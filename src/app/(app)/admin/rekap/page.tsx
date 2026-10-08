import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TablePagination } from "@/components/table-pagination";

export const dynamic = "force-dynamic";

type Mode = "kelompok" | "mentor" | "fakultas";

export default async function AdminRekapPage({ searchParams }: { searchParams: { mode?: string; page?: string; pageSize?: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const mode: Mode = (["kelompok", "mentor", "fakultas"] as const).includes(searchParams.mode as Mode) ? (searchParams.mode as Mode) : "kelompok";
  const pageSizeValue = Number(searchParams.pageSize);
  const pageSize = [10, 20, 50].includes(pageSizeValue) ? pageSizeValue : 10;
  const requestedPage = Math.max(1, Math.floor(Number(searchParams.page) || 1));

  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { totalMinggu: true },
  });
  const totalMinggu = kalender?.totalMinggu ?? 8;

  const kelompokList = await prisma.kelompok.findMany({
    select: {
      id: true, name: true, faculty: true,
      mentor: { select: { id: true, name: true } },
      mentorAssignments: { select: { mentor: { select: { id: true, name: true } } } },
      pertemuan: { where: { status: "SELESAI" }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  let rows: { label: string; faculty: string; done: number; total: number; groups?: number }[] = [];
  if (mode === "kelompok") {
    rows = kelompokList.map((k) => ({ label: k.name, faculty: k.faculty, done: k.pertemuan.length, total: totalMinggu }));
  } else if (mode === "mentor") {
    const map = new Map<string, { label: string; faculty: string; done: number; total: number; groups: number }>();
    for (const k of kelompokList) {
      const assignments = k.mentorAssignments.length ? k.mentorAssignments : k.mentor ? [{ mentor: k.mentor }] : [];
      for (const assignment of assignments) {
        const key = assignment.mentor.id;
        const cur = map.get(key) || { label: assignment.mentor.name, faculty: k.faculty, done: 0, total: 0, groups: 0 };
        cur.done += k.pertemuan.length; cur.total += totalMinggu; cur.groups += 1;
        map.set(key, cur);
      }
    }
    rows = Array.from(map.values());
  } else {
    const map = new Map<string, { label: string; faculty: string; done: number; total: number; groups: number }>();
    for (const k of kelompokList) {
      const cur = map.get(k.faculty) || { label: k.faculty, faculty: k.faculty, done: 0, total: 0, groups: 0 };
      cur.done += k.pertemuan.length; cur.total += totalMinggu; cur.groups += 1;
      map.set(k.faculty, cur);
    }
    rows = Array.from(map.values());
  }
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl font-semibold">Rekapitulasi</h1>
        <a href={`/api/admin/rekap/export?mode=${mode}`} className="flex items-center gap-1.5 text-xs font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark rounded-lg px-3 py-2">
          <Download size={14} /> Export Excel (.csv)
        </a>
      </div>
      <div className="flex gap-2 mb-4">
        {([["kelompok", "Per Kelompok"], ["mentor", "Per Mentor"], ["fakultas", "Per Fakultas"]] as [Mode, string][]).map(([m, label]) => (
          <Link
            key={m}
            href={`/admin/rekap?mode=${m}&pageSize=${pageSize}`}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${
              mode === m ? "bg-primary-soft dark:bg-primary-darkSoft border-primary text-primary-hover dark:text-primary-dark" : "border-[#dcefe2] dark:border-[#1d3527] text-gray-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Nama</th>
              <th className="px-4 py-2.5 font-bold">Fakultas</th>
              <th className="px-4 py-2.5 font-bold">Progress</th>
              <th className="px-4 py-2.5 font-bold">Persentase</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => {
              const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
              return (
                <tr key={i} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                  <td className="px-4 py-2.5 font-semibold">{r.label}{r.groups ? ` (${r.groups} kelompok)` : ""}</td>
                  <td className="px-4 py-2.5">{r.faculty}</td>
                  <td className="px-4 py-2.5 w-48">
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                      <div className="h-full bg-primary dark:bg-primary-dark rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{r.done}/{r.total} · {pct}%</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada data untuk direkap.</td></tr>
            )}
          </tbody>
        </table>
        </div>
        <TablePagination
          basePath="/admin/rekap"
          page={page}
          pageSize={pageSize}
          totalItems={rows.length}
          query={{ mode }}
          itemLabel={mode === "kelompok" ? "kelompok" : mode === "mentor" ? "mentor" : "fakultas"}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-3">Rekap semester lampau akan tersedia setelah semester ini diarsipkan pada menu Arsip Semester.</p>
    </div>
  );
}
