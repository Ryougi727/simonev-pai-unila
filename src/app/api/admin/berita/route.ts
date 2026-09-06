import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const title = ((form.get("title") as string) || "").trim();
  const excerpt = ((form.get("excerpt") as string) || "").trim();
  const content = ((form.get("content") as string) || "").trim();
  const category = ((form.get("category") as string) || "Berita").trim();
  const eventDateRaw = form.get("eventDate") as string | null;
  const published = form.get("published") === "true";
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!title || !content) return NextResponse.json({ error: "Judul dan isi wajib diisi." }, { status: 400 });

  let photoUrls: string[] = [];
  try {
    photoUrls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const path = `berita/${randomUUID()}.jpg`;
        return uploadToStorage(path, buffer, file.type || "image/jpeg");
      })
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengunggah foto." }, { status: 500 });
  }

  const berita = await prisma.berita.create({
    data: {
      title, excerpt: excerpt || null, content, category,
      eventDate: eventDateRaw ? new Date(eventDateRaw) : null,
      published, authorId: admin.id,
      photos: { create: photoUrls.map((url) => ({ url })) },
    },
  });

  await prisma.auditLog.create({
    data: { entity: "Berita", action: "Tambah", detail: `Membuat berita "${title}".`, userId: admin.id },
  });

  return NextResponse.json({ id: berita.id });
}
