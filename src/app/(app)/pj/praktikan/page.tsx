import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Search, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TablePagination } from "@/components/table-pagination";

export const dynamic = "force-dynamic";

export default async function PJPraktikanPage({
  searchParams,
}: {
  searchParams: { page?: string; pageSize?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "PJ") redirect("/dashboard");
  const faculty = typeof user.faculty === "string" ? user.faculty : "";

  const pageSizeValue = Number(searchParams.pageSize);
  const pageSize = [10, 20, 50].includes(pageSizeValue) ? pageSizeValue : 10;
  const requestedPage = Math.max(1, Math.floor(Number(searchParams.page) || 1));
  const searchQuery = (searchParams.q || "").trim();
  const where = {
    fakultas: faculty,
    ...(searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" as const } },
            { npm: { contains: searchQuery } },
          ],
        }
      : {}),
  };

  const [totalPraktikan, unassignedCount, filteredCount] = await Promise.all([
    prisma.praktikan.count({ where: { fakultas: faculty } }),
    prisma.praktikan.count({ where: { fakultas: faculty, kelompokId: null } }),
    prisma.praktikan.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const praktikan = await prisma.praktikan.findMany({
    where,
    select: {
      id: true,
      npm: true,
      name: true,
      kelompok: { select: { name: true, faculty: true } },
    },
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Praktikan Fakultas</h1>
          <p className="mt-1 text-sm text-gray-500">{faculty || "Fakultas belum ditentukan"}</p>
        </div>
        <form method="GET" className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <label className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Cari nama atau NPM"
              aria-label="Cari praktikan berdasarkan nama atau NPM"
              className="w-56 rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-gray-700"
            />
          </label>
          <button type="submit" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
            Cari
          </button>
        </form>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#dcefe2] bg-white p-4 dark:border-[#1d3527] dark:bg-[#0f1c14]">
          <div className="text-xs text-gray-500">Total praktikan fakultas</div>
          <div className="mt-1 text-lg font-semibold">{totalPraktikan} orang</div>
        </div>
        <div className="rounded-2xl border border-[#dcefe2] bg-white p-4 dark:border-[#1d3527] dark:bg-[#0f1c14]">
          <div className="text-xs text-gray-500">Belum masuk kelompok</div>
          <div className="mt-1 text-lg font-semibold">{unassignedCount} orang</div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dcefe2] bg-white dark:border-[#1d3527] dark:bg-[#0f1c14]">
        <div className="flex items-center gap-2 border-b border-[#dcefe2] px-5 py-4 dark:border-[#1d3527]">
          <Users size={17} className="text-primary dark:text-primary-dark" />
          <h2 className="font-semibold">Daftar Praktikan</h2>
        </div>
        {praktikan.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-400">
                  <th className="px-4 py-3 font-bold">NPM</th>
                  <th className="px-4 py-3 font-bold">Nama</th>
                  <th className="px-4 py-3 font-bold">Kelompok</th>
                </tr>
              </thead>
              <tbody>
                {praktikan.map((student) => (
                  <tr key={student.id} className="border-t border-[#dcefe2] dark:border-[#1d3527]">
                    <td className="whitespace-nowrap px-4 py-3">{student.npm}</td>
                    <td className="px-4 py-3 font-semibold">{student.name}</td>
                    <td className="px-4 py-3">
                      {student.kelompok
                        ? student.kelompok.faculty === faculty
                          ? student.kelompok.name
                          : "Kelompok lintas fakultas"
                        : "Belum masuk kelompok"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            {searchQuery ? `Tidak ada praktikan yang cocok dengan "${searchQuery}".` : "Belum ada praktikan pada fakultas ini."}
          </p>
        )}
        <TablePagination
          basePath="/pj/praktikan"
          page={page}
          pageSize={pageSize}
          totalItems={filteredCount}
          query={searchQuery ? { q: searchQuery } : {}}
          itemLabel="praktikan"
          showDataSkeleton
        />
      </section>
    </div>
  );
}
