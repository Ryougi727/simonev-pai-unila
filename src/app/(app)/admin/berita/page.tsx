import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BeritaClient } from "./berita-client";

export const dynamic = "force-dynamic";

export default async function AdminBeritaPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const berita = await prisma.berita.findMany({
    include: { photos: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Kelola Berita Landing Page</h1>
      <p className="text-sm text-gray-500 mb-4">Berita, kajian, dan info acara yang tampil di halaman depan publik.</p>
      <BeritaClient
        items={berita.map((b) => ({
          id: b.id, title: b.title, excerpt: b.excerpt, content: b.content, category: b.category,
          eventDate: b.eventDate ? b.eventDate.toISOString().slice(0, 10) : "",
          published: b.published,
          photos: b.photos.map((p) => ({ id: p.id, url: p.url })),
          createdAt: b.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
