import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/sell(.*)",
  "/checkout(.*)",
  "/api/projects(.*)",
  "/api/checkout(.*)",
  "/api/downloads(.*)",
  "/api/admin(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default clerkEnabled
  ? clerkHandler
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
