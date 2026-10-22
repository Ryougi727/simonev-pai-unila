import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: params.id },
    include: {
      kelompok: { include: { mentorAssignments: true } },
      absensi: { select: { id: true } },
      beritaAcara: { select: { id: true } },
      dokumentasi: { select: { url: true } },
    },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((assignment) => assignment.mentorId === user.id))) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  for (const foto of pertemuan.dokumentasi) {
    const path = pathFromPublicUrl(foto.url);
    if (path) {
      try { await deleteFromStorage(path); } catch { /* best effort — the database delete must still complete */ }
    }
  }

  await prisma.pertemuan.delete({ where: { id: params.id } });

  const detail = `Menghapus jadwal ${pertemuan.kelompok.name} minggu ${pertemuan.week} beserta ${pertemuan.absensi.length} presensi, ${pertemuan.beritaAcara ? "berita acara" : "tanpa berita acara"}, dan ${pertemuan.dokumentasi.length} foto dokumentasi.`;
  await prisma.auditLog.create({
    data: { entity: "Jadwal", action: "Hapus", detail, userId: user.id },
  });
  await prisma.activityLog.create({
    data: { text: `${user.name} menghapus jadwal minggu ${pertemuan.week} (${pertemuan.kelompok.name}).`, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
