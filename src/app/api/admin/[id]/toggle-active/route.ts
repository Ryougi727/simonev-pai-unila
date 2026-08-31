import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  const updated = await prisma.user.update({ where: { id: params.id }, data: { active: !user.active } });

  await prisma.auditLog.create({
    data: {
      entity: user.role === "MENTOR" ? "Mentor" : "PJ",
      action: updated.active ? "Aktifkan" : "Nonaktifkan",
      detail: `${updated.active ? "Mengaktifkan" : "Menonaktifkan"} akun "${user.name}".`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ active: updated.active });
}