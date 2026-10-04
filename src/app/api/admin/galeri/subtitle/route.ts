import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subtitle } = await req.json();
  if (!subtitle?.trim()) return NextResponse.json({ error: "Sub-judul tidak boleh kosong." }, { status: 400 });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { galeriSubtitle: subtitle.trim() },
    create: { id: "singleton", galeriSubtitle: subtitle.trim() },
  });

  await prisma.auditLog.create({
    data: { entity: "Galeri", action: "Ubah", detail: `Mengubah sub-judul galeri menjadi "${subtitle.trim()}".`, userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
