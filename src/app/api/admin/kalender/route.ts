import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tahunAkademik, semester, totalMinggu, currentWeek } = await req.json();
  if (!tahunAkademik?.trim() || !semester || !totalMinggu || !currentWeek) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }
  if (currentWeek > totalMinggu) {
    return NextResponse.json({ error: "Minggu berjalan tidak boleh melebihi total minggu." }, { status: 400 });
  }

  await prisma.kalenderPraktikum.upsert({
    where: { id: "singleton" },
    update: { tahunAkademik: tahunAkademik.trim(), semester, totalMinggu, currentWeek },
    create: { id: "singleton", tahunAkademik: tahunAkademik.trim(), semester, totalMinggu, currentWeek },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Kalender", action: "Ubah",
      detail: `Memperbarui kalender praktikum (${tahunAkademik} ${semester}, minggu berjalan ${currentWeek}).`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ ok: true });
}
