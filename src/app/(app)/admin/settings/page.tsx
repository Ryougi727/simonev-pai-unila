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
      <SettingsClient
        settings={{
          appName: settings?.appName ?? "SIMONEV PAI",
          qrDurationMinutes: settings?.qrDurationMinutes ?? 10,
          maxPhotos: settings?.maxPhotos ?? 3,
          defaultTheme: settings?.defaultTheme ?? "light",
          galeriSubtitle: settings?.galeriSubtitle ?? "Momen Praktikum PAI",
        }}
        hasEmergencyPassword={!!settings?.emergencyPasswordHash}
      />
    </div>
  );
}
