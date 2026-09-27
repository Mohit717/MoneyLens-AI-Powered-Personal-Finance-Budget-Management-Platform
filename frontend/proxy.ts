import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for authentication tokens in cookies
  const token =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("refreshToken")?.value ||
    request.cookies.get("session")?.value;

  const isAuthenticated = Boolean(token);

  // Auth pages (login, register, verify-otp, forgot-password, reset-password)
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-otp" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // Protected main pages (root, dashboard)
  const isMainRoute =
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  // 1. If user is NOT logged in and tries to access main protected pages -> Redirect to /login
  if (!isAuthenticated && isMainRoute) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. If user IS logged in and tries to access auth pages -> Redirect to /dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

