import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, faculty, monitoringStartWeek, mentorId, praktikanIds } = await req.json();
  if (!name?.trim() || !faculty) return NextResponse.json({ error: "Nama dan fakultas wajib diisi." }, { status: 400 });

  const mentorIds = [...new Set(Array.isArray(mentorId) ? mentorId.filter(Boolean) : mentorId ? [mentorId] : [])];
  if (mentorIds.length > 2) return NextResponse.json({ error: "Maksimal dua mentor per kelompok." }, { status: 400 });
  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { currentWeek: true, totalMinggu: true },
  });
  const startWeek = monitoringStartWeek ?? kalender?.currentWeek ?? 1;
  const totalWeeks = kalender?.totalMinggu ?? 8;
  if (!Number.isInteger(startWeek) || startWeek < 1 || startWeek > totalWeeks) {
    return NextResponse.json({ error: `Minggu mulai monitoring harus antara 1 dan ${totalWeeks}.` }, { status: 400 });
  }

  const kelompok = await prisma.kelompok.create({
    data: {
      name: name.trim(), faculty, monitoringStartWeek: startWeek, mentorId: mentorIds[0] || null,
      mentorAssignments: { create: mentorIds.map((id: string) => ({ mentorId: id })) },
    },
  });

  const ids: string[] = Array.isArray(praktikanIds) ? praktikanIds.filter(Boolean) : [];
  if (ids.length) {
    await prisma.praktikan.updateMany({ where: { id: { in: ids } }, data: { kelompokId: kelompok.id } });
  }

  await prisma.auditLog.create({
    data: {
      entity: "Kelompok", action: "Tambah",
      detail: `Menambahkan kelompok "${name}"${ids.length ? ` dengan ${ids.length} praktikan` : ""}.`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ id: kelompok.id });
}
