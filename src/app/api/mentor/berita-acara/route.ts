import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pertemuanId, hari, tanggal, lokasi, materi, catatan } = await req.json();
  if (!pertemuanId || !hari || !tanggal || !lokasi?.trim() || !materi?.trim()) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: { kelompok: { include: { mentorAssignments: true } }, absensi: true },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }
  if (pertemuan.status === "SELESAI") {
    return NextResponse.json({ error: "Pertemuan ini sudah selesai." }, { status: 400 });
  }

  const totalPeserta = await prisma.praktikan.count({ where: { kelompokId: pertemuan.kelompokId } });
  const hadir = pertemuan.absensi.length;
  const tidakHadir = Math.max(0, totalPeserta - hadir);

  await prisma.$transaction([
    prisma.beritaAcara.create({
      data: {
        pertemuanId, hari, tanggal: new Date(tanggal), lokasi: lokasi.trim(), materi: materi.trim(),
        catatan: catatan?.trim() || null, hadir, tidakHadir,
      },
    }),
    prisma.pertemuan.update({ where: { id: pertemuanId }, data: { status: "SELESAI" } }),
  ]);

  await prisma.activityLog.create({
    data: { text: `${user.name} menyelesaikan pertemuan minggu ${pertemuan.week} (${pertemuan.kelompok.name}).`, userId: user.id },
  });
  await prisma.auditLog.create({
    data: {
      entity: "Berita Acara", action: "Isi",
      detail: `Mengisi berita acara ${pertemuan.kelompok.name} minggu ${pertemuan.week}.`,
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
