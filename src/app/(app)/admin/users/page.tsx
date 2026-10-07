import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { role: { in: ["MENTOR", "PJ"] } },
    select: {
      id: true, role: true, name: true, username: true, faculty: true, email: true,
      active: true, mustChangePassword: true,
    },
    orderBy: { name: "asc" },
  });

  const shape = (u: (typeof users)[number]) => ({
    id: u.id, name: u.name, username: u.username, faculty: u.faculty, email: u.email,
    active: u.active, mustChangePassword: u.mustChangePassword,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Manajemen Pengguna</h1>
      <UsersClient mentors={users.filter((u) => u.role === "MENTOR").map(shape)} pjs={users.filter((u) => u.role === "PJ").map(shape)} />
    </div>
  );
}