import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const foto = await prisma.galeri.findUnique({ where: { id: params.id } });
  if (!foto) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  const path = pathFromPublicUrl(foto.url);
  if (path) { try { await deleteFromStorage(path); } catch { /* best effort */ } }

  await prisma.galeri.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { entity: "Galeri", action: "Hapus", detail: "Menghapus 1 foto dari galeri.", userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
