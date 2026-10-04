import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Result = { type: string; label: string; sublabel: string; href: string };

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: Result[] = [];

  if (user.role === "ADMIN") {
    const [kelompok, praktikan, pengguna] = await Promise.all([
      prisma.kelompok.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 5 }),
      prisma.praktikan.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { npm: { contains: q, mode: "insensitive" } }] },
        take: 5, include: { kelompok: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ["MENTOR", "PJ"] }, OR: [{ name: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }] },
        take: 5,
      }),
    ]);
    kelompok.forEach((k) => results.push({ type: "Kelompok", label: k.name, sublabel: k.faculty, href: "/admin/kelompok" }));
    praktikan.forEach((p) => results.push({ type: "Praktikan", label: p.name, sublabel: `${p.npm} · ${p.kelompok?.name || "Belum berkelompok"}`, href: "/admin/praktikan" }));
    pengguna.forEach((u) => results.push({ type: u.role === "MENTOR" ? "Mentor" : "PJ", label: u.name, sublabel: u.username, href: "/admin/users" }));
  } else if (user.role === "PJ") {
    const [kelompok, praktikan] = await Promise.all([
      prisma.kelompok.findMany({ where: { faculty: user.faculty, name: { contains: q, mode: "insensitive" } }, take: 5 }),
      prisma.praktikan.findMany({
        where: {
          kelompok: { faculty: user.faculty },
          OR: [{ name: { contains: q, mode: "insensitive" } }, { npm: { contains: q, mode: "insensitive" } }],
        },
        take: 5, include: { kelompok: true },
      }),
    ]);
    kelompok.forEach((k) => results.push({ type: "Kelompok", label: k.name, sublabel: k.faculty, href: "/pj/monitoring" }));
    praktikan.forEach((p) => results.push({ type: "Praktikan", label: p.name, sublabel: `${p.npm} · ${p.kelompok?.name || "-"}`, href: "/pj/monitoring" }));
  } else {
    const praktikan = await prisma.praktikan.findMany({
      where: {
        kelompok: { OR: [{ mentorId: user.id }, { mentorAssignments: { some: { mentorId: user.id } } }] },
        OR: [{ name: { contains: q, mode: "insensitive" } }, { npm: { contains: q, mode: "insensitive" } }],
      },
      take: 8, include: { kelompok: true },
    });
    praktikan.forEach((p) => results.push({ type: "Praktikan", label: p.name, sublabel: `${p.npm} · ${p.kelompok?.name || "-"}`, href: "/mentor/jadwal" }));
  }

  return NextResponse.json({ results: results.slice(0, 15) });
}
