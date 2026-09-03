import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "kelompok";

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const totalMinggu = kalender?.totalMinggu ?? 8;

  const kelompokList = await prisma.kelompok.findMany({
    include: { mentor: true, mentorAssignments: { include: { mentor: true } }, pertemuan: { where: { status: "SELESAI" } } },
    orderBy: { name: "asc" },
  });

  let rows: { label: string; faculty: string; done: number; total: number }[] = [];
  if (mode === "mentor") {
    const map = new Map<string, { label: string; faculty: string; done: number; total: number }>();
    for (const k of kelompokList) {
      const assignments = k.mentorAssignments.length ? k.mentorAssignments : k.mentor ? [{ mentor: k.mentor }] : [];
      for (const assignment of assignments) {
        const key = assignment.mentor.id;
        const cur = map.get(key) || { label: assignment.mentor.name, faculty: k.faculty, done: 0, total: 0 };
        cur.done += k.pertemuan.length; cur.total += totalMinggu;
        map.set(key, cur);
      }
    }
    rows = Array.from(map.values());
  } else if (mode === "fakultas") {
    const map = new Map<string, { label: string; faculty: string; done: number; total: number }>();
    for (const k of kelompokList) {
      const cur = map.get(k.faculty) || { label: k.faculty, faculty: k.faculty, done: 0, total: 0 };
      cur.done += k.pertemuan.length; cur.total += totalMinggu;
      map.set(k.faculty, cur);
    }
    rows = Array.from(map.values());
  } else {
    rows = kelompokList.map((k) => ({ label: k.name, faculty: k.faculty, done: k.pertemuan.length, total: totalMinggu }));
  }

  const csvRows = [
    ["Nama", "Fakultas", "Pertemuan Selesai", "Total Minggu", "Persentase"],
    ...rows.map((r) => [r.label, r.faculty, String(r.done), String(r.total), `${r.total ? Math.round((r.done / r.total) * 100) : 0}%`]),
  ];
  const csv = "\uFEFF" + csvRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rekap-${mode}.csv"`,
    },
  });
}
