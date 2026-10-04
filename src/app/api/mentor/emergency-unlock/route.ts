import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password, pertemuanId } = await req.json();
  if (!password || !pertemuanId) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.emergencyPasswordHash) {
    return NextResponse.json({ error: "Sandi darurat belum diatur Admin. Hubungi Admin terlebih dahulu." }, { status: 400 });
  }
  const valid = await bcrypt.compare(password, settings.emergencyPasswordHash);
  if (!valid) return NextResponse.json({ error: "Sandi darurat salah." }, { status: 400 });

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: { kelompok: { include: { mentorAssignments: true } } },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
  }
  if (pertemuan.status === "SELESAI") {
    return NextResponse.json({ error: "Pertemuan ini sudah selesai." }, { status: 400 });
  }

  await prisma.pertemuan.update({ where: { id: pertemuanId }, data: { unlockedAt: new Date() } });

  await prisma.auditLog.create({
    data: {
      entity: "Jadwal", action: "Buka Kunci Darurat",
      detail: `${user.name} membuka kunci darurat untuk ${pertemuan.kelompok.name} minggu ${pertemuan.week} (pakai sandi darurat).`,
      userId: user.id,
    },
  });
  await prisma.activityLog.create({
    data: { text: `${user.name} membuka kunci darurat minggu ${pertemuan.week} (${pertemuan.kelompok.name}).`, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
