import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // If visiting login page, allow access
        if (req.nextUrl.pathname.startsWith('/admin/login')) {
          return true;
        }
        // Require token for other admin routes
        return !!token;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

export const config = {
  matcher: [
    "/admin/((?!login).*)",
    "/api/admin/:path*",
  ],
};
