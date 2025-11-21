import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

/**
 * Next.js Middleware
 *
 * This middleware runs on every request and is responsible for:
 * - Refreshing Supabase auth sessions
 * - Protecting routes based on authentication
 * - Checking user permissions
 * - Redirecting users appropriately
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes (they handle auth separately)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
