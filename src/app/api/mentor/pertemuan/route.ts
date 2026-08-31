import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kelompokId, week, date, time, location } = await req.json();
  if (!kelompokId || !week || !date || !time || !location?.trim()) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  const kelompok = await prisma.kelompok.findUnique({ where: { id: kelompokId } });
  if (!kelompok || kelompok.mentorId !== user.id) {
    return NextResponse.json({ error: "Kelompok tidak ditemukan." }, { status: 404 });
  }

  try {
    const pertemuan = await prisma.pertemuan.create({
      data: { kelompokId, week, date: new Date(date), time, location: location.trim(), status: "TERJADWAL" },
    });
    await prisma.activityLog.create({
      data: { text: `${user.name} membuat jadwal minggu ${week} (${kelompok.name}).`, userId: user.id },
    });
    await prisma.auditLog.create({
      data: { entity: "Jadwal", action: "Tambah", detail: `Membuat jadwal minggu ${week} untuk ${kelompok.name}.`, userId: user.id },
    });
    return NextResponse.json({ id: pertemuan.id });
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Jadwal minggu ini sudah ada." }, { status: 400 });
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
