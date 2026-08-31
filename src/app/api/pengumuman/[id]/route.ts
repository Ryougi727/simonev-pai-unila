import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "PJ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await prisma.pengumuman.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  if (user.role === "PJ" && item.authorId !== user.id) {
    return NextResponse.json({ error: "Anda hanya bisa menghapus pengumuman Anda sendiri." }, { status: 403 });
  }

  if (item.attachmentUrl) {
    const path = pathFromPublicUrl(item.attachmentUrl);
    if (path) { try { await deleteFromStorage(path); } catch { /* best effort */ } }
  }

  await prisma.pengumuman.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { entity: "Pengumuman", action: "Hapus", detail: `Menghapus pengumuman "${item.title}".`, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
