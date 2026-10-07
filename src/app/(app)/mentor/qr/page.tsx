import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QRClient } from "./qr-client";

export const dynamic = "force-dynamic";

export default async function QRAbsensiPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const currentWeek = kalender?.currentWeek ?? 1;

  const kelompokList = await prisma.kelompok.findMany({
    where: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
    select: {
      id: true,
      name: true,
      praktikan: { select: { id: true, npm: true, name: true } },
      pertemuan: {
        where: { OR: [{ week: currentWeek }, { unlockedAt: { not: null } }], status: { not: "SELESAI" } },
        select: { id: true, week: true, status: true, qrToken: true, qrActivatedAt: true, qrDurationMin: true },
      },
    },
  });

  if (!kelompokList.length) {
    return <p className="text-sm text-gray-500">Anda belum memiliki kelompok binaan.</p>;
  }

  const items = kelompokList
    .flatMap((k) =>
      k.pertemuan.map((p) => ({
        pertemuanId: p.id, kelompokId: k.id, kelompokName: k.name, week: p.week, status: p.status,
        isCurrentWeek: p.week === currentWeek, isEmergency: p.week !== currentWeek,
        qr: p.qrToken ? { token: p.qrToken, activatedAt: p.qrActivatedAt!.toISOString(), durationMin: p.qrDurationMin ?? 10 } : null,
        praktikan: k.praktikan.map((pr) => ({ id: pr.id, npm: pr.npm, name: pr.name })),
      }))
    )
    .sort((a, b) => (a.isCurrentWeek === b.isCurrentWeek ? a.week - b.week : a.isCurrentWeek ? -1 : 1));

  if (!items.length) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-4">QR Absensi</h1>
        <p className="text-sm text-gray-500">
          Belum ada jadwal untuk minggu ke-{currentWeek}. Buat jadwal terlebih dahulu di menu Jadwal Praktikum — atau kalau
          ini pertemuan minggu lalu yang terlewat, gunakan tombol "Buka Kunci Darurat" di sidebar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">QR Absensi</h1>
      <QRClient items={items} />
    </div>
  );
}
