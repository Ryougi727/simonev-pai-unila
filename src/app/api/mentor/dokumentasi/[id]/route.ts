import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const foto = await prisma.dokumentasi.findUnique({
    where: { id: params.id },
    include: { pertemuan: { include: { kelompok: true } } },
  });
  if (!foto || foto.pertemuan.kelompok.mentorId !== user.id) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  const path = pathFromPublicUrl(foto.url);
  if (path) {
    try { await deleteFromStorage(path); } catch { /* best effort — don't block the DB delete */ }
  }

  await prisma.dokumentasi.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: {
      entity: "Dokumentasi", action: "Hapus",
      detail: `Menghapus 1 foto dari ${foto.pertemuan.kelompok.name} minggu ${foto.pertemuan.week}.`,
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}