import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, faculty, monitoringStartWeek, mentorId, praktikanIds } = await req.json();
  if (!name?.trim() || !faculty) return NextResponse.json({ error: "Nama dan fakultas wajib diisi." }, { status: 400 });

  const mentorIds = [...new Set(Array.isArray(mentorId) ? mentorId.filter(Boolean) : mentorId ? [mentorId] : [])];
  if (mentorIds.length > 2) return NextResponse.json({ error: "Maksimal dua mentor per kelompok." }, { status: 400 });
  if (!Number.isInteger(monitoringStartWeek) || monitoringStartWeek < 1) {
    return NextResponse.json({ error: "Minggu mulai monitoring tidak valid." }, { status: 400 });
  }
  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { totalMinggu: true },
  });
  const totalWeeks = kalender?.totalMinggu ?? 8;
  if (monitoringStartWeek > totalWeeks) {
    return NextResponse.json({ error: `Minggu mulai monitoring harus antara 1 dan ${totalWeeks}.` }, { status: 400 });
  }

  const ids: string[] | null = Array.isArray(praktikanIds) ? praktikanIds.filter(Boolean) : null;

  const kelompok = await prisma.$transaction(async (tx) => {
    await tx.kelompokMentor.deleteMany({ where: { kelompokId: params.id } });
    const updated = await tx.kelompok.update({
      where: { id: params.id },
      data: {
        name: name.trim(), faculty, monitoringStartWeek, mentorId: mentorIds[0] || null,
        mentorAssignments: { create: mentorIds.map((id: string) => ({ mentorId: id })) },
      },
    });
    if (ids !== null) {
      // sync membership: unassign anyone currently in this kelompok but not in the new list,
      // then assign everyone in the new list to this kelompok (covers moving someone in from unassigned).
      await tx.praktikan.updateMany({ where: { kelompokId: params.id, id: { notIn: ids } }, data: { kelompokId: null } });
      if (ids.length) await tx.praktikan.updateMany({ where: { id: { in: ids } }, data: { kelompokId: params.id } });
    }
    return updated;
  });

  await prisma.auditLog.create({
    data: { entity: "Kelompok", action: "Ubah", detail: `Memperbarui kelompok "${kelompok.name}".`, userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kelompok = await prisma.kelompok.findUnique({ where: { id: params.id } });
  if (!kelompok) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  await prisma.kelompok.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: {
      entity: "Kelompok", action: "Hapus",
      detail: `Menghapus kelompok "${kelompok.name}" beserta riwayat pertemuan terkait (praktikan tetap ada, jadi tidak berkelompok).`,
      userId: admin.id,
    },
  });

  return NextResponse.json({ ok: true });
}
