import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, phone, bio } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.trim(), email: email?.trim() || null, phone: phone?.trim() || null, bio: bio?.trim() || null },
  });

  await prisma.activityLog.create({ data: { text: `${user.name} memperbarui profil.`, userId: user.id } });

  return NextResponse.json({ ok: true });
}
