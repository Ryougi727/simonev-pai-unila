import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { passwordHash, mustChangePassword: false },
  });
  await prisma.auditLog.create({
    data: {
      entity: "Akun",
      action: "Ganti Password",
      detail: `${session.user.name} mengganti password.`,
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json({ ok: true });
}
