import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("🔥 MIDDLEWARE RUNNING:", req.nextUrl.pathname);

  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/auth/callback")) {
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("🔥 SESSION EXISTS:", !!session);

  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    return session
      ? NextResponse.redirect(new URL("/dashboard", req.url))
      : NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/tasks")) {
    if (!session) {
      console.log("🚨 NO SESSION → REDIRECTING TO LOGIN");
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/tasks/:path*",
    "/login",
    "/auth/callback",
  ],
};