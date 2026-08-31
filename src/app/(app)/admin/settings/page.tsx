import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Pengaturan Sistem</h1>
      <SettingsClient settings={settings ?? { appName: "SIMONEV PAI", qrDurationMinutes: 10, maxPhotos: 3, defaultTheme: "light" }} />
    </div>
  );
}
