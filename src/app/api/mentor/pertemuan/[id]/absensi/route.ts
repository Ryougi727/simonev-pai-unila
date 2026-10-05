import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  TIDAK_HADIR: "Tidak hadir (tanpa keterangan)",
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; name: string; role: string } | undefined;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { praktikanId, status } = body;
  const validStatus = status === null || (typeof status === "string" && Object.hasOwn(statusLabels, status));
  if (typeof praktikanId !== "string" || !validStatus) {
    return NextResponse.json({ error: "Data presensi tidak valid." }, { status: 400 });
  }

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: params.id },
    include: { kelompok: { include: { mentorAssignments: true } } },
  });
  if (!pertemuan || (pertemuan.kelompok.mentorId !== user.id && !pertemuan.kelompok.mentorAssignments.some((a) => a.mentorId === user.id))) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }
  if (pertemuan.status === "SELESAI") {
    return NextResponse.json({ error: "Pertemuan sudah selesai, presensi tidak bisa diubah." }, { status: 400 });
  }

  const praktikan = await prisma.praktikan.findFirst({
    where: { id: praktikanId, kelompokId: pertemuan.kelompokId },
  });
  if (!praktikan) return NextResponse.json({ error: "Praktikan tidak terdaftar di kelompok ini." }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    if (status === null) {
      await tx.absensi.deleteMany({ where: { pertemuanId: pertemuan.id, praktikanId } });
    } else {
      await tx.absensi.upsert({
        where: { pertemuanId_praktikanId: { pertemuanId: pertemuan.id, praktikanId } },
        create: { pertemuanId: pertemuan.id, praktikanId, status },
        update: { status },
      });
    }
    await tx.auditLog.create({
      data: {
        entity: "Presensi",
        action: "Ubah",
        detail: `${user.name} mengubah presensi ${praktikan.name} untuk ${pertemuan.kelompok.name} minggu ${pertemuan.week}: ${status === null ? "Belum dicatat" : statusLabels[status]}.`,
        userId: user.id,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
