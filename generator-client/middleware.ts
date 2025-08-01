import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes explicitly
const isPublicRoute = createRouteMatcher(["/", "/generate", "/buy"]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without auth
  if (isPublicRoute(req)) return;

  // Await auth and check if user is authenticated
  const { userId } = await auth();

  if (!userId) {
    // Redirect unauthenticated users to /login
    const url = new URL("/", req.url); // or "/login" if you prefer
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
      },
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
