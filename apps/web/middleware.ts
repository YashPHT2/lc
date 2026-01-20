import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/dojo(.*)',
    '/shop(.*)',
    '/leaderboard(.*)',
    '/settings(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
    // If the route is protected and user is not signed in, redirect to sign-in
    if (isProtectedRoute(request)) {
        const { userId } = await auth();
        if (!userId) {
            const signInUrl = new URL('/sign-in', request.url);
            return Response.redirect(signInUrl);
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
