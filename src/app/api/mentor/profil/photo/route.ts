import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("photo") as File | null;
  if (!file) return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `profil/${user.id}.jpg`;

  let url: string;
  try {
    url = await uploadToStorage(path, buffer, "image/jpeg");
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengunggah ke storage." }, { status: 500 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { photoUrl: url } });

  return NextResponse.json({ url });
}
