import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadToStorage } from "@/lib/storage";

const MAX_GALERI = 10;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return NextResponse.json({ error: "Pilih foto dulu." }, { status: 400 });

  const currentCount = await prisma.galeri.count();
  const room = MAX_GALERI - currentCount;
  if (room <= 0) return NextResponse.json({ error: `Galeri sudah penuh (maksimal ${MAX_GALERI} foto). Hapus foto lama dulu.` }, { status: 400 });

  const toUpload = files.slice(0, room);
  let urls: string[];
  try {
    urls = await Promise.all(
      toUpload.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const path = `galeri/${randomUUID()}.jpg`;
        return uploadToStorage(path, buffer, file.type || "image/jpeg");
      })
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengunggah foto." }, { status: 500 });
  }

  const lastItem = await prisma.galeri.findFirst({ orderBy: { order: "desc" } });
  const startOrder = (lastItem?.order ?? -1) + 1;
  await prisma.galeri.createMany({ data: urls.map((url, i) => ({ url, order: startOrder + i })) });

  await prisma.auditLog.create({
    data: { entity: "Galeri", action: "Tambah", detail: `Menambahkan ${urls.length} foto ke galeri.`, userId: admin.id },
  });

  return NextResponse.json({ ok: true, added: urls.length, skipped: files.length - toUpload.length });
}
