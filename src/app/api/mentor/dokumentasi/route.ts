import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const pertemuanId = form.get("pertemuanId") as string | null;
  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (!pertemuanId || !files.length) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const pertemuan = await prisma.pertemuan.findUnique({
    where: { id: pertemuanId },
    include: { kelompok: true, dokumentasi: true },
  });
  if (!pertemuan || pertemuan.kelompok.mentorId !== user.id) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const maxPhotos = settings?.maxPhotos ?? 3;
  const room = maxPhotos - pertemuan.dokumentasi.length;
  if (room <= 0) return NextResponse.json({ error: `Maksimal ${maxPhotos} foto per pertemuan.` }, { status: 400 });

  const toUpload = files.slice(0, room);
  let urls: string[];
  try {
    urls = await Promise.all(
      toUpload.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const path = `dokumentasi/${pertemuanId}/${randomUUID()}.jpg`;
        return uploadToStorage(path, buffer, "image/jpeg");
      })
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengunggah ke storage." }, { status: 500 });
  }

  await prisma.dokumentasi.createMany({ data: urls.map((url) => ({ pertemuanId, url })) });

  await prisma.auditLog.create({
    data: {
      entity: "Dokumentasi", action: "Unggah",
      detail: `Mengunggah ${urls.length} foto untuk ${pertemuan.kelompok.name} minggu ${pertemuan.week}.`,
      userId: user.id,
    },
  });
  await prisma.activityLog.create({
    data: { text: `${user.name} mengunggah dokumentasi minggu ${pertemuan.week} (${pertemuan.kelompok.name}).`, userId: user.id },
  });

  return NextResponse.json({ ok: true, added: urls.length });
}