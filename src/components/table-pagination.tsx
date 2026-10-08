"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TablePaginationProps = {
  basePath: string;
  page: number;
  pageSize: number;
  totalItems: number;
  query?: Record<string, string>;
  itemLabel: string;
};

export function TablePagination({
  basePath, page, pageSize, totalItems, query = {}, itemLabel,
}: TablePaginationProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const params = new URLSearchParams(query);
  params.set("pageSize", String(pageSize));

  const hrefForPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("page", String(nextPage));
    return `${basePath}?${nextParams.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dcefe2] dark:border-[#1d3527] px-4 py-3 text-xs">
      <div className="flex items-center gap-2 text-gray-500">
        <label htmlFor={`${itemLabel}-page-size`}>Baris per halaman</label>
        <select
          id={`${itemLabel}-page-size`}
          value={pageSize}
          onChange={(event) => {
            const nextParams = new URLSearchParams(params);
            nextParams.set("pageSize", event.target.value);
            nextParams.set("page", "1");
            router.push(`${basePath}?${nextParams.toString()}`);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-on-surface outline-none focus:border-primary"
        >
          {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span>
          {totalItems
            ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalItems)} dari ${totalItems} ${itemLabel}`
            : `0 ${itemLabel}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={hrefForPage(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={`flex items-center gap-1 rounded-lg border border-[#dcefe2] dark:border-[#1d3527] px-2.5 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          <ChevronLeft size={14} /> Sebelumnya
        </Link>
        <span className="text-gray-500">Halaman {page} dari {totalPages}</span>
        <Link
          href={hrefForPage(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={`flex items-center gap-1 rounded-lg border border-[#dcefe2] dark:border-[#1d3527] px-2.5 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
        >
          Berikutnya <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
