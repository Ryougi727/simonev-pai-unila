import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pertemuan = await prisma.pertemuan.findUnique({ where: { id: params.id }, include: { kelompok: { include: { mentorAssignments: true } } } });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }
  if (pertemuan.status === "SELESAI") {
    return NextResponse.json({ error: "Pertemuan sudah selesai, tidak bisa diubah." }, { status: 400 });
  }

  const { date, time, location } = await req.json();
  if (!date || !time || !location?.trim()) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  await prisma.pertemuan.update({
    where: { id: params.id },
    data: { date: new Date(date), time, location: location.trim() },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Jadwal", action: "Ubah",
      detail: `Mengubah jadwal minggu ${pertemuan.week} untuk ${pertemuan.kelompok.name}.`,
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
