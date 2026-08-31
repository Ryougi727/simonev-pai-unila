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

  const [mentors, pjs] = await Promise.all([
    prisma.user.findMany({ where: { role: "MENTOR" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "PJ" }, orderBy: { name: "asc" } }),
  ]);

  const shape = (u: (typeof mentors)[number]) => ({
    id: u.id, name: u.name, username: u.username, faculty: u.faculty, email: u.email,
    active: u.active, mustChangePassword: u.mustChangePassword,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Manajemen Pengguna</h1>
      <UsersClient mentors={mentors.map(shape)} pjs={pjs.map(shape)} />
    </div>
  );
}