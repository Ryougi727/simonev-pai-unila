import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMONEV PAI",
  description: "Sistem Monitoring dan Evaluasi Praktikum Pendidikan Agama Islam — Universitas Lampung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            themes={["light", "dark", "sakura", "neon"]}
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
