import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pertemuanId = searchParams.get("pertemuanId");
  if (!pertemuanId) return NextResponse.json({ error: "pertemuanId wajib diisi." }, { status: 400 });

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: { absensi: true },
  });
  if (!pertemuan) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  return NextResponse.json({
    status: pertemuan.status,
    qrToken: pertemuan.qrToken,
    activatedAt: pertemuan.qrActivatedAt,
    durationMin: pertemuan.qrDurationMin,
    hadirIds: pertemuan.absensi.map((a) => a.praktikanId),
  });
}
