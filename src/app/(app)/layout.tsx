import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const sessionUser = session.user as any;

  const [me, recentPengumuman] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id }, select: { photoUrl: true } }),
    prisma.pengumuman.findFirst({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        ...(sessionUser.role === "ADMIN" ? {} : { OR: [{ targetFaculty: null }, { targetFaculty: sessionUser.faculty }] }),
      },
      select: { id: true },
    }),
  ]);

  return (
    <AppShell
      role={sessionUser.role}
      name={sessionUser.name}
      faculty={sessionUser.faculty}
      photoUrl={me?.photoUrl ?? null}
      hasRecentPengumuman={!!recentPengumuman}
    >
      {children}
    </AppShell>
  );
}
