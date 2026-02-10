import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/health (Health check)
     * - auth/login (Login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (implied by avoiding common extensions if needed, but explicit exclusion is better)
     */
    "/((?!api/auth|api/health|auth/login|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
