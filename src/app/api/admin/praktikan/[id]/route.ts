import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const praktikan = await prisma.praktikan.findUnique({ where: { id: params.id } });
  if (!praktikan) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  await prisma.praktikan.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { entity: "Praktikan", action: "Hapus", detail: `Menghapus praktikan "${praktikan.name}".`, userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
