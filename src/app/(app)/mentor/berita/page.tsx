import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeAbsence } from "@/lib/attendance-summary";
import { BeritaClient } from "./berita-client";

export const dynamic = "force-dynamic";

export default async function MentorBeritaPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") redirect("/dashboard");

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const currentWeek = kalender?.currentWeek ?? 1;

  const [kelompokList, allMateri, historyPertemuan] = await Promise.all([
    prisma.kelompok.findMany({
      where: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
      include: {
        pertemuan: {
          where: { OR: [{ week: currentWeek }, { unlockedAt: { not: null } }], status: { not: "SELESAI" } },
          include: { absensi: true, beritaAcara: true },
        },
        praktikan: { select: { id: true, name: true, npm: true } },
        _count: { select: { praktikan: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.materi.findMany(),
    prisma.pertemuan.findMany({
      where: {
        kelompok: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
        status: "SELESAI",
      },
      include: {
        beritaAcara: true,
        kelompok: { include: { praktikan: { select: { id: true, name: true, npm: true } } } },
        absensi: true,
      },
      orderBy: [{ week: "desc" }],
    }),
  ]);

  if (!kelompokList.length) return <p className="text-sm text-gray-500">Anda belum memiliki kelompok binaan.</p>;

  const materiMap = new Map(allMateri.map((m) => [m.week, m]));

  const items = kelompokList
    .flatMap((k) =>
      k.pertemuan.map((p) => {
        const m = materiMap.get(p.week);
        return {
          kelompokId: k.id, kelompokName: k.name, totalPeserta: k._count.praktikan,
          isCurrentWeek: p.week === currentWeek, isEmergency: p.week !== currentWeek,
          materiDefault: m ? `${m.tahsin} & ${m.keislaman}` : "",
          pertemuan: {
            id: p.id, week: p.week, date: p.date.toISOString().slice(0, 10), time: p.time, location: p.location,
            status: p.status, hadirCount: p.absensi.filter((a) => a.status === "HADIR").length,
            absenceBreakdown: summarizeAbsence(k.praktikan, p.absensi),
            beritaAcara: p.beritaAcara
              ? {
                  hari: p.beritaAcara.hari, tanggal: p.beritaAcara.tanggal.toISOString().slice(0, 10),
                  lokasi: p.beritaAcara.lokasi, materi: p.beritaAcara.materi, catatan: p.beritaAcara.catatan,
                  hadir: p.beritaAcara.hadir, tidakHadir: p.beritaAcara.tidakHadir,
                }
              : null,
          },
        };
      })
    )
    .sort((a, b) => (a.isCurrentWeek === b.isCurrentWeek ? a.pertemuan.week - b.pertemuan.week : a.isCurrentWeek ? -1 : 1));

  const history = historyPertemuan
    .filter((p) => p.beritaAcara)
    .map((p) => ({
      id: p.id, week: p.week, kelompokName: p.kelompok.name,
      hari: p.beritaAcara!.hari, tanggal: p.beritaAcara!.tanggal.toISOString(),
      lokasi: p.beritaAcara!.lokasi, materi: p.beritaAcara!.materi, catatan: p.beritaAcara!.catatan,
      hadir: p.beritaAcara!.hadir, tidakHadir: p.beritaAcara!.tidakHadir,
      absenceBreakdown: summarizeAbsence(p.kelompok.praktikan, p.absensi),
    }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Berita Acara</h1>
      <BeritaClient items={items} history={history} />
    </div>
  );
}
