import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const { praktikanId } = await req.json();
  const pertemuan = await prisma.pertemuan.findUnique({ where: { qrToken: params.token } });

  if (!pertemuan) return NextResponse.json({ error: "QR tidak valid." }, { status: 404 });
  if (pertemuan.status === "SELESAI") return NextResponse.json({ error: "Pertemuan sudah selesai." }, { status: 400 });

  const expiresAt = pertemuan.qrActivatedAt
    ? pertemuan.qrActivatedAt.getTime() + (pertemuan.qrDurationMin ?? 10) * 60000
    : 0;
  if (Date.now() > expiresAt) return NextResponse.json({ error: "QR sudah kedaluwarsa." }, { status: 400 });

  const praktikan = await prisma.praktikan.findUnique({ where: { id: praktikanId } });
  if (!praktikan || praktikan.kelompokId !== pertemuan.kelompokId) {
    return NextResponse.json({ error: "Praktikan tidak terdaftar di kelompok ini." }, { status: 400 });
  }

  const existing = await prisma.absensi.findUnique({
    where: { pertemuanId_praktikanId: { pertemuanId: pertemuan.id, praktikanId } },
  });
  if (existing?.status === "HADIR") {
    return NextResponse.json({ error: "Anda sudah melakukan absensi untuk pertemuan ini." }, { status: 400 });
  }

  if (existing) {
    await prisma.absensi.update({ where: { id: existing.id }, data: { status: "HADIR" } });
  } else {
    await prisma.absensi.create({ data: { pertemuanId: pertemuan.id, praktikanId } });
  }
  return NextResponse.json({ ok: true });
}
