import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: params.id },
    include: { kelompok: { include: { mentorAssignments: true } }, absensi: true },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }
  if (pertemuan.status === "SELESAI") {
    return NextResponse.json({ error: "Pertemuan sudah selesai — tidak bisa direset lewat sini." }, { status: 400 });
  }

  const hadirCount = pertemuan.absensi.length;

  await prisma.$transaction([
    prisma.absensi.deleteMany({ where: { pertemuanId: params.id } }),
    prisma.pertemuan.update({
      where: { id: params.id },
      data: { qrToken: null, qrActivatedAt: null, qrDurationMin: null },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      entity: "Jadwal", action: "Reset",
      detail: `Mereset QR & data hadir (${hadirCount} entri) untuk ${pertemuan.kelompok.name} minggu ${pertemuan.week}. Jadwal tidak berubah.`,
      userId: user.id,
    },
  });
  await prisma.activityLog.create({
    data: { text: `${user.name} mereset QR & data hadir minggu ${pertemuan.week} (${pertemuan.kelompok.name}).`, userId: user.id },
  });

  return NextResponse.json({ ok: true, clearedAbsensi: hadirCount });
}