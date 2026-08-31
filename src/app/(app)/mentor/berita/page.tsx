import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BeritaClient } from "./berita-client";

export const dynamic = "force-dynamic";

export default async function MentorBeritaPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") redirect("/dashboard");

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const week = kalender?.currentWeek ?? 1;

  const [kelompokList, materiMinggu] = await Promise.all([
    prisma.kelompok.findMany({
      where: { mentorId: user.id },
      include: {
        pertemuan: { where: { week }, include: { absensi: true, beritaAcara: true } },
        _count: { select: { praktikan: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.materi.findUnique({ where: { week } }),
  ]);

  if (!kelompokList.length) return <p className="text-sm text-gray-500">Anda belum memiliki kelompok binaan.</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Berita Acara</h1>
      <BeritaClient
        week={week}
        materiDefault={materiMinggu ? `${materiMinggu.tahsin} & ${materiMinggu.keislaman}` : ""}
        kelompokList={kelompokList.map((k) => {
          const p = k.pertemuan[0];
          return {
            kelompokId: k.id, kelompokName: k.name, totalPeserta: k._count.praktikan,
            pertemuan: p
              ? {
                  id: p.id, date: p.date.toISOString().slice(0, 10), time: p.time, location: p.location,
                  status: p.status, hadirCount: p.absensi.length,
                  beritaAcara: p.beritaAcara
                    ? {
                        hari: p.beritaAcara.hari, tanggal: p.beritaAcara.tanggal.toISOString().slice(0, 10),
                        lokasi: p.beritaAcara.lokasi, materi: p.beritaAcara.materi, catatan: p.beritaAcara.catatan,
                        hadir: p.beritaAcara.hadir, tidakHadir: p.beritaAcara.tidakHadir,
                      }
                    : null,
                }
              : null,
          };
        })}
      />
    </div>
  );
}
