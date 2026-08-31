import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PengumumanClient } from "./pengumuman-client";

export const dynamic = "force-dynamic";

const FACULTIES = ["FMIPA", "Teknik", "Ekonomi & Bisnis", "Hukum", "Pertanian", "ISIP", "KIP", "Kedokteran"];

export default async function PengumumanPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) redirect("/login");

  const where = user.role === "ADMIN" ? {} : { OR: [{ targetFaculty: null }, { targetFaculty: user.faculty }] };

  const list = await prisma.pengumuman.findMany({
    where,
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Pengumuman</h1>
      <PengumumanClient
        canPost={user.role === "ADMIN" || user.role === "PJ"}
        role={user.role}
        currentUserId={user.id}
        faculties={FACULTIES}
        items={list.map((p) => ({
          id: p.id, title: p.title, body: p.body, targetFaculty: p.targetFaculty,
          attachmentUrl: p.attachmentUrl, attachmentName: p.attachmentName,
          authorName: p.author.name, authorId: p.authorId,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
