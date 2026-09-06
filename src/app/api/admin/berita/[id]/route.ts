import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { uploadToStorage, deleteFromStorage, pathFromPublicUrl } from "@/lib/storage";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.berita.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  const form = await req.formData();
  const title = ((form.get("title") as string) || "").trim();
  const excerpt = ((form.get("excerpt") as string) || "").trim();
  const content = ((form.get("content") as string) || "").trim();
  const category = ((form.get("category") as string) || "Berita").trim();
  const eventDateRaw = form.get("eventDate") as string | null;
  const published = form.get("published") === "true";
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!title || !content) return NextResponse.json({ error: "Judul dan isi wajib diisi." }, { status: 400 });

  let newPhotoUrls: string[] = [];
  if (files.length) {
    try {
      newPhotoUrls = await Promise.all(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const path = `berita/${randomUUID()}.jpg`;
          return uploadToStorage(path, buffer, file.type || "image/jpeg");
        })
      );
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Gagal mengunggah foto." }, { status: 500 });
    }
  }

  await prisma.berita.update({
    where: { id: params.id },
    data: {
      title, excerpt: excerpt || null, content, category,
      eventDate: eventDateRaw ? new Date(eventDateRaw) : null,
      published,
      photos: newPhotoUrls.length ? { create: newPhotoUrls.map((url) => ({ url })) } : undefined,
    },
  });

  await prisma.auditLog.create({
    data: { entity: "Berita", action: "Ubah", detail: `Memperbarui berita "${title}".`, userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const berita = await prisma.berita.findUnique({ where: { id: params.id }, include: { photos: true } });
  if (!berita) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

  for (const p of berita.photos) {
    const path = pathFromPublicUrl(p.url);
    if (path) { try { await deleteFromStorage(path); } catch { /* best effort */ } }
  }

  await prisma.berita.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: { entity: "Berita", action: "Hapus", detail: `Menghapus berita "${berita.title}".`, userId: admin.id },
  });

  return NextResponse.json({ ok: true });
}
