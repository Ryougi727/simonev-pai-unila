import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: params.id },
    include: { kelompok: { include: { mentorAssignments: true } }, absensi: true, beritaAcara: true, dokumentasi: true },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  const wasSelesai = pertemuan.status === "SELESAI";
  const attendanceCount = pertemuan.absensi.length;
  const fotoCount = pertemuan.dokumentasi.length;

  // clean up storage files for any documentation photos before wiping the DB rows
  for (const foto of pertemuan.dokumentasi) {
    const path = pathFromPublicUrl(foto.url);
    if (path) { try { await deleteFromStorage(path); } catch { /* best effort */ } }
  }

  await prisma.$transaction([
    prisma.absensi.deleteMany({ where: { pertemuanId: params.id } }),
    prisma.dokumentasi.deleteMany({ where: { pertemuanId: params.id } }),
    ...(pertemuan.beritaAcara ? [prisma.beritaAcara.delete({ where: { pertemuanId: params.id } })] : []),
    prisma.pertemuan.update({
      where: { id: params.id },
      data: { qrToken: null, qrActivatedAt: null, qrDurationMin: null, status: "TERJADWAL" },
    }),
  ]);

  const detail = wasSelesai
    ? `Mereset pertemuan yang sudah SELESAI untuk ${pertemuan.kelompok.name} minggu ${pertemuan.week}: menghapus berita acara, ${attendanceCount} entri presensi, dan ${fotoCount} foto dokumentasi. Jadwal tidak berubah, status kembali ke Terjadwal.`
    : `Mereset QR & data presensi (${attendanceCount} entri) untuk ${pertemuan.kelompok.name} minggu ${pertemuan.week}. Jadwal tidak berubah.`;

  await prisma.auditLog.create({
    data: { entity: "Jadwal", action: "Reset", detail, userId: user.id },
  });
  await prisma.activityLog.create({
    data: { text: `${user.name} mereset pertemuan minggu ${pertemuan.week} (${pertemuan.kelompok.name}).`, userId: user.id },
  });

  return NextResponse.json({ ok: true, clearedAbsensi: attendanceCount, clearedBeritaAcara: wasSelesai, clearedFoto: fotoCount });
}
