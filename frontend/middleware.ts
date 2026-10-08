import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware — no Supabase calls here.
 * Auth check is handled by each page individually.
 * This prevents Vercel Edge timeout issues.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth callback always
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // Check session cookie exists (set by Supabase after login)
  const token =
    req.cookies.get("sb-fbsemaocjhqjgzelploi-auth-token") ||
    req.cookies.get("sb-access-token") ||
    req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`);

  // Protect dashboard and tasks
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/tasks")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect logged-in users away from login
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/login",
  ],
};
