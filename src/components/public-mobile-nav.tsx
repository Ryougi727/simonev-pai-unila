"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function PublicMobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden relative">
      <button onClick={() => setOpen((v) => !v)} className="p-2 text-on-surface-variant">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-outline-variant/40 rounded-xl shadow-lg overflow-hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-b border-outline-variant/20 last:border-0"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
