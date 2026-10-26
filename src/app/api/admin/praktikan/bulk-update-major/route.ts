import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ids = body?.ids;
  const jurusan = body?.jurusan;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 500 ||
    ids.some((id: unknown) => typeof id !== "string" || !id) ||
    typeof jurusan !== "string" ||
    !jurusan.trim()
  ) {
    return NextResponse.json({ error: "Data praktikan atau jurusan tidak valid." }, { status: 400 });
  }

  const requestedIds = Array.from(new Set(ids as string[]));
  const students = await prisma.praktikan.findMany({
    where: { id: { in: requestedIds } },
    select: { id: true, name: true },
  });
  if (students.length !== requestedIds.length) {
    return NextResponse.json({ error: "Sebagian praktikan tidak ditemukan. Muat ulang halaman lalu coba lagi." }, { status: 404 });
  }

  const normalizedMajor = jurusan.trim();
  try {
    await prisma.$transaction(async (tx) => {
      const update = await tx.praktikan.updateMany({
        where: { id: { in: requestedIds } },
        data: { jurusan: normalizedMajor },
      });
      if (update.count !== requestedIds.length) throw new Error("STUDENT_SELECTION_CHANGED");
      await tx.auditLog.create({
        data: {
          entity: "Praktikan",
          action: "Ubah Jurusan Massal",
          detail: `Mengubah jurusan menjadi "${normalizedMajor}" untuk ${students.length} praktikan: ${students.map((student) => student.name).join(", ")}.`,
          userId: admin.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_SELECTION_CHANGED") {
      return NextResponse.json({ error: "Data praktikan berubah saat diproses. Muat ulang halaman lalu coba lagi." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ updated: students.length });
}
