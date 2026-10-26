import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ids = body?.ids;
  const monitoringStartWeek = body?.monitoringStartWeek;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 500 ||
    ids.some((id: unknown) => typeof id !== "string" || !id) ||
    !Number.isInteger(monitoringStartWeek) ||
    monitoringStartWeek < 1
  ) {
    return NextResponse.json({ error: "Data kelompok atau minggu mulai monitoring tidak valid." }, { status: 400 });
  }

  const kalender = await prisma.kalenderPraktikum.findUnique({
    where: { id: "singleton" },
    select: { totalMinggu: true },
  });
  const totalWeeks = kalender?.totalMinggu ?? 8;
  if (monitoringStartWeek > totalWeeks) {
    return NextResponse.json({ error: `Minggu mulai monitoring harus antara 1 dan ${totalWeeks}.` }, { status: 400 });
  }

  const requestedIds = Array.from(new Set(ids as string[]));
  const groups = await prisma.kelompok.findMany({
    where: { id: { in: requestedIds } },
    select: { id: true, name: true },
  });
  if (groups.length !== requestedIds.length) {
    return NextResponse.json({ error: "Sebagian kelompok tidak ditemukan. Muat ulang halaman lalu coba lagi." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const update = await tx.kelompok.updateMany({
        where: { id: { in: requestedIds } },
        data: { monitoringStartWeek },
      });
      if (update.count !== requestedIds.length) throw new Error("GROUP_SELECTION_CHANGED");
      await tx.auditLog.create({
        data: {
          entity: "Kelompok",
          action: "Ubah Minggu Monitoring Massal",
          detail: `Mengubah minggu mulai monitoring menjadi minggu ${monitoringStartWeek} untuk ${groups.length} kelompok: ${groups.map((group) => group.name).join(", ")}.`,
          userId: admin.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "GROUP_SELECTION_CHANGED") {
      return NextResponse.json({ error: "Data kelompok berubah saat diproses. Muat ulang halaman lalu coba lagi." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ updated: groups.length });
}
