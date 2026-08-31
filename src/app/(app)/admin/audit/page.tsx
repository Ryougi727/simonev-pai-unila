import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { at: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Audit Log</h1>
      <div className="bg-white dark:bg-[#0f1c14] border border-[#dcefe2] dark:border-[#1d3527] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase text-gray-400 text-left">
              <th className="px-4 py-2.5 font-bold">Waktu</th>
              <th className="px-4 py-2.5 font-bold">Pengguna</th>
              <th className="px-4 py-2.5 font-bold">Entitas</th>
              <th className="px-4 py-2.5 font-bold">Aksi</th>
              <th className="px-4 py-2.5 font-bold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                <td className="px-4 py-2.5 whitespace-nowrap">{l.at.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-4 py-2.5">{l.user?.name || "System"}</td>
                <td className="px-4 py-2.5"><span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{l.entity}</span></td>
                <td className="px-4 py-2.5">{l.action}</td>
                <td className="px-4 py-2.5">{l.detail}</td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-xs">Belum ada perubahan data penting.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
