import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = session.user as any;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={user.role} name={user.name} />
      <div className="flex-1 min-w-0 relative">
        {/* ambient background — a soft green mesh so content areas do not read as flat/empty */}
        <div
          className="pointer-events-none fixed inset-y-0 right-0 left-[260px] -z-10 opacity-60 dark:opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 0%, rgb(var(--tertiary-container)) 0%, transparent 35%), radial-gradient(circle at 0% 100%, rgb(var(--secondary-container)) 0%, transparent 40%)",
          }}
        />
        <Topbar role={user.role} faculty={user.faculty} name={user.name} />
        <main className="p-6 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
