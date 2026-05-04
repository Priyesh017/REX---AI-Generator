import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",           // home / landing
  "/generate",   // generation page (auth encouraged but optional)
  "/buy",        // subscription/payment page
  "/u/(.*)",     // public creator profiles
  "/posts/(.*)", // public post detail pages
  "/explore",    // explore/discover (Phase 2)
]);

// Auth-required routes
const isAuthRoute = createRouteMatcher([
  "/studio(.*)",
  "/profile(.*)",
  "/notifications(.*)",
  "/settings(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Public routes: no auth check needed
  if (isPublicRoute(req)) return;

  // Auth-required routes: redirect to home if not signed in
  if (isAuthRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const url = new URL("/", req.url);
      return new Response(null, {
        status: 302,
        headers: { Location: url.toString() },
      });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
