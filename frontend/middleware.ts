import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Always allow auth callback
  if (req.nextUrl.pathname.startsWith("/auth/callback")) {
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Protect dashboard and tasks
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/tasks")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect logged-in users away from login
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/login",
    "/auth/callback",
  ],
};
