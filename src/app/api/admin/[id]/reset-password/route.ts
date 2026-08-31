import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { genTempPassword } from "@/lib/username";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const password = genTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash, mustChangePassword: true },
  });

  await prisma.auditLog.create({
    data: { entity: user.role === "MENTOR" ? "Mentor" : "PJ", action: "Reset Password", detail: `Reset kata sandi untuk "${user.name}".`, userId: admin.id },
  });

  return NextResponse.json({ username: user.username, password });
}