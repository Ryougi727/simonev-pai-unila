"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  role, name, faculty, photoUrl, hasRecentPengumuman, children,
}: {
  role: string; name: string; faculty?: string; photoUrl?: string | null;
  hasRecentPengumuman?: boolean; children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} name={name} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 relative w-full">
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-60 dark:opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 0%, rgb(var(--tertiary-container)) 0%, transparent 35%), radial-gradient(circle at 0% 100%, rgb(var(--secondary-container)) 0%, transparent 40%)",
          }}
        />
        <Topbar role={role} faculty={faculty} name={name} photoUrl={photoUrl} hasRecentPengumuman={hasRecentPengumuman} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
