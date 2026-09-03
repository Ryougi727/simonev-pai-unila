import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pertemuanId } = await req.json();
  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: { kelompok: { include: { mentorAssignments: true } } },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Pertemuan tidak ditemukan." }, { status: 404 });
  }
  if (pertemuan.status === "SELESAI") {
    return NextResponse.json({ error: "Pertemuan sudah selesai." }, { status: 400 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const qrToken = crypto.randomBytes(12).toString("hex");

  const updated = await prisma.pertemuan.update({
    where: { id: pertemuanId },
    data: { qrToken, qrActivatedAt: new Date(), qrDurationMin: settings?.qrDurationMinutes ?? 10 },
  });

  await prisma.activityLog.create({
    data: { text: `${user.name} membuka QR absensi (${pertemuan.kelompok.name}, minggu ${pertemuan.week}).`, userId: user.id },
  });

  return NextResponse.json({
    qrToken: updated.qrToken,
    activatedAt: updated.qrActivatedAt,
    durationMin: updated.qrDurationMin,
  });
}
