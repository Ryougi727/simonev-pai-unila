import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: { id: string; fotoId: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const foto = await prisma.beritaFoto.findUnique({ where: { id: params.fotoId } });
  if (!foto || foto.beritaId !== params.id) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  const path = pathFromPublicUrl(foto.url);
  if (path) { try { await deleteFromStorage(path); } catch { /* best effort */ } }

  await prisma.beritaFoto.delete({ where: { id: params.fotoId } });

  return NextResponse.json({ ok: true });
}
