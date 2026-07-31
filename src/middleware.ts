import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const isProduction = process.env.NODE_ENV === "production";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/sell(.*)",
  "/checkout(.*)",
  "/welcome(.*)",
]);

// API routes authenticate themselves (admin token / Clerk in-handler).
// Do not auth.protect() /api/* here — Clerk protect() returns HTML 404 on APIs
// and breaks admin/fetch JSON clients.

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.headers.set("X-XSS-Protection", "0");
  return res;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return withSecurityHeaders(NextResponse.next());
});

export default clerkEnabled
  ? clerkHandler
  : function middleware(req: NextRequest) {
      if (isProduction && isProtectedRoute(req)) {
        return withSecurityHeaders(
          NextResponse.json(
            {
              error:
                "Authentication is not configured. Set Clerk keys before going live.",
            },
            { status: 503 }
          )
        );
      }
      return withSecurityHeaders(NextResponse.next());
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
