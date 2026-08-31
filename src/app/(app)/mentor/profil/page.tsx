import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilClient } from "./profil-client";

export const dynamic = "force-dynamic";

export default async function MentorProfilPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "MENTOR") redirect("/dashboard");

  const me = await prisma.user.findUnique({ where: { id: user.id } });
  if (!me) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Profil Saya</h1>
      <ProfilClient me={{ username: me.username, name: me.name, email: me.email || "", phone: me.phone || "", bio: me.bio || "", photoUrl: me.photoUrl }} />
    </div>
  );
}
