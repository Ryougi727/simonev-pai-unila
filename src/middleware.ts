import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (token?.mustChangePassword && path !== "/change-password") {
      const res = NextResponse.redirect(new URL("/change-password", req.url));
      res.headers.set("Cache-Control", "no-store, must-revalidate");
      return res;
    }
    const res = NextResponse.next();
    // Without this, the browser's back/forward-cache (bfcache) can serve a stale
    // snapshot of an authenticated page after logout (looks "logged out" on back)
    // or a stale logged-in snapshot after a session actually changed (on forward).
    // no-store forces a fresh request on every back/forward navigation instead.
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

// protect everything under the authenticated app shell; leave /login, /scan,
// the NextAuth API, and static assets public.
export const config = {
  matcher: ["/dashboard/:path*", "/mentor/:path*", "/pj/:path*", "/admin/:path*", "/pengumuman/:path*", "/change-password"],
};