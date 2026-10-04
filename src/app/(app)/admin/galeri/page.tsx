import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GaleriClient } from "./galeri-client";

export const dynamic = "force-dynamic";

export default async function AdminGaleriPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [fotos, settings] = await Promise.all([
    prisma.galeri.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Kelola Galeri</h1>
      <p className="text-sm text-gray-500 mb-4">Foto-foto yang tampil bergerak di halaman depan publik (maksimal 10).</p>
      <GaleriClient
        fotos={fotos.map((f) => ({ id: f.id, url: f.url }))}
        subtitle={settings?.galeriSubtitle ?? "Momen Praktikum PAI"}
      />
    </div>
  );
}
