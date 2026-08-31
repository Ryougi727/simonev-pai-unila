import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KelompokClient } from "./kelompok-client";

export const dynamic = "force-dynamic";

export default async function AdminKelompokPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [kelompok, mentors] = await Promise.all([
    prisma.kelompok.findMany({
      include: { mentor: true, _count: { select: { praktikan: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "MENTOR", active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Manajemen Kelompok</h1>
      <KelompokClient
        kelompok={kelompok.map((k) => ({
          id: k.id, name: k.name, faculty: k.faculty, mentorId: k.mentorId,
          mentorName: k.mentor?.name ?? null, praktikanCount: k._count.praktikan,
        }))}
        mentors={mentors.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}
