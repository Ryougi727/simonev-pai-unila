import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // session expires after 2 hours of inactivity
    updateAge: 30 * 60, // refreshed at most every 30 minutes of activity
  },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username.trim() },
          select: {
            id: true, name: true, role: true, username: true, faculty: true,
            mustChangePassword: true, active: true, passwordHash: true,
          },
        });
        if (!user || !user.active) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
          faculty: user.faculty ?? undefined,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.faculty = (user as any).faculty;
        token.mustChangePassword = (user as any).mustChangePassword;
      }
      // allow the change-password flow to clear the flag without a full re-login
      if (trigger === "update" && session?.mustChangePassword === false) {
        token.mustChangePassword = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).faculty = token.faculty;
        (session.user as any).mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
};
