import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kalender = await prisma.kalenderPraktikum.findUnique({ where: { id: "singleton" } });
  if (!kalender) return NextResponse.json({ error: "Kalender belum diatur." }, { status: 400 });

  const totalPertemuan = await prisma.pertemuan.count({ where: { status: "SELESAI" } });

  const archive = await prisma.archive.create({
    data: { tahunAkademik: kalender.tahunAkademik, semester: kalender.semester, totalPertemuan },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Arsip", action: "Arsipkan",
      detail: `Mengarsipkan semester ${kalender.semester} ${kalender.tahunAkademik}.`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ id: archive.id });
}
