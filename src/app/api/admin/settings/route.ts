import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appName, qrDurationMinutes, maxPhotos, defaultTheme, galeriSubtitle } = await req.json();
  if (!appName?.trim() || !qrDurationMinutes || !maxPhotos || !defaultTheme) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { appName: appName.trim(), qrDurationMinutes, maxPhotos, defaultTheme, galeriSubtitle: galeriSubtitle?.trim() || "Momen Praktikum PAI" },
    create: { id: "singleton", appName: appName.trim(), qrDurationMinutes, maxPhotos, defaultTheme, galeriSubtitle: galeriSubtitle?.trim() || "Momen Praktikum PAI" },
  });

  await prisma.auditLog.create({
    data: { entity: "Pengaturan", action: "Ubah", detail: "Memperbarui pengaturan sistem.", userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
