import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "PJ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const title = ((form.get("title") as string) || "").trim();
  const body = ((form.get("body") as string) || "").trim();
  const targetFacultyRaw = form.get("targetFaculty") as string | null;
  const file = form.get("attachment") as File | null;

  if (!title || !body) return NextResponse.json({ error: "Judul dan isi wajib diisi." }, { status: 400 });

  // PJ is always scoped to their own faculty regardless of what's sent — only Admin may choose.
  const targetFaculty = user.role === "PJ" ? user.faculty : targetFacultyRaw || null;

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  if (file && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran lampiran maksimal 8MB." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    const path = `pengumuman/${randomUUID()}.${ext}`;
    try {
      attachmentUrl = await uploadToStorage(path, buffer, file.type || "application/octet-stream");
      attachmentName = file.name;
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Gagal mengunggah lampiran." }, { status: 500 });
    }
  }

  const pengumuman = await prisma.pengumuman.create({
    data: { title, body, targetFaculty, attachmentUrl, attachmentName, authorId: user.id },
  });

  await prisma.activityLog.create({
    data: { text: `${user.name} membuat pengumuman "${title}".`, userId: user.id },
  });
  await prisma.auditLog.create({
    data: {
      entity: "Pengumuman", action: "Buat",
      detail: `Membuat pengumuman "${title}"${targetFaculty ? ` untuk ${targetFaculty}` : " untuk semua fakultas"}.`,
      userId: user.id,
    },
  });

  return NextResponse.json({ id: pengumuman.id });
}
