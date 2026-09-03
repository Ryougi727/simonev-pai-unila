import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QRClient } from "./qr-client";

export const dynamic = "force-dynamic";

export default async function QRAbsensiPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  const week = kalender?.currentWeek ?? 1;

  const kelompokList = await prisma.kelompok.findMany({
    where: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
    include: { praktikan: true, pertemuan: { where: { week } } },
  });

  if (!kelompokList.length) {
    return <p className="text-sm text-gray-500">Anda belum memiliki kelompok binaan.</p>;
  }

  const kelompok = kelompokList[0];
  const pertemuan = kelompok.pertemuan[0];

  if (!pertemuan) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-4">QR Absensi</h1>
        <p className="text-sm text-gray-500">
          Belum ada jadwal untuk {kelompok.name} pada minggu ke-{week}. Buat jadwal terlebih dahulu di menu Jadwal Praktikum.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">QR Absensi</h1>
      <QRClient
        pertemuanId={pertemuan.id}
        kelompokName={kelompok.name}
        week={week}
        initialStatus={pertemuan.status}
        initialQr={
          pertemuan.qrToken
            ? { token: pertemuan.qrToken, activatedAt: pertemuan.qrActivatedAt!.toISOString(), durationMin: pertemuan.qrDurationMin ?? 10 }
            : null
        }
        praktikan={kelompok.praktikan.map((p) => ({ id: p.id, npm: p.npm, name: p.name }))}
      />
    </div>
  );
}
