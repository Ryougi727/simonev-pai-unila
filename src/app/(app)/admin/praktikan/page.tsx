import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PraktikanClient } from "./praktikan-client";

export const dynamic = "force-dynamic";

export default async function AdminPraktikanPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [praktikan, kelompok] = await Promise.all([
    prisma.praktikan.findMany({ include: { kelompok: true }, orderBy: { name: "asc" } }),
    prisma.kelompok.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Manajemen Praktikan</h1>
      <PraktikanClient
        praktikan={praktikan.map((p) => ({ id: p.id, nim: p.nim, name: p.name, kelompokId: p.kelompokId, kelompokName: p.kelompok.name }))}
        kelompok={kelompok.map((k) => ({ id: k.id, name: k.name }))}
      />
    </div>
  );
}
