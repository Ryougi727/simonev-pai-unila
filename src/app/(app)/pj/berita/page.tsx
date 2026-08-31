import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PJBeritaPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "PJ") redirect("/dashboard");

  const pertemuanList = await prisma.pertemuan.findMany({
    where: { kelompok: { faculty: user.faculty }, beritaAcara: { isNot: null } },
    include: { kelompok: true, beritaAcara: true },
    orderBy: [{ week: "desc" }],
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Berita Acara</h1>
      <div className="space-y-3">
        {pertemuanList.map((p) => (
          <div key={p.id} className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-4">
            <div className="flex justify-between flex-wrap gap-2 mb-2">
              <div className="font-semibold text-sm">{p.kelompok.name} — Minggu {p.week}</div>
              <span className="text-[11px] font-bold bg-primary-soft dark:bg-primary-darkSoft text-primary-hover dark:text-primary-dark px-2.5 py-1 rounded-full">
                Selesai · {p.beritaAcara!.filledAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <div>{p.beritaAcara!.hari}, {p.beritaAcara!.tanggal.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} · {p.beritaAcara!.lokasi}</div>
              <div><b>Materi:</b> {p.beritaAcara!.materi}</div>
              <div><b>Catatan:</b> {p.beritaAcara!.catatan || "-"}</div>
              <div><b>Kehadiran:</b> {p.beritaAcara!.hadir} hadir · {p.beritaAcara!.tidakHadir} tidak hadir</div>
            </div>
          </div>
        ))}
        {!pertemuanList.length && (
          <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl p-10 text-center text-gray-400 text-xs">
            Belum ada berita acara yang tercatat.
          </div>
        )}
      </div>
    </div>
  );
}
