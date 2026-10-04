import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Sandi minimal 6 karakter." }, { status: 400 });
  }

  const emergencyPasswordHash = await bcrypt.hash(password, 10);
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { emergencyPasswordHash },
    create: { id: "singleton", emergencyPasswordHash },
  });

  await prisma.auditLog.create({
    data: { entity: "Pengaturan", action: "Ubah", detail: "Mengganti sandi darurat (buka kunci pertemuan terlambat).", userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
