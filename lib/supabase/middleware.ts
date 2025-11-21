import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/auth/login", "/auth/sign-up", "/auth/callback"]

const PROTECTED_ROUTES: Record<string, string> = {
  "/dashboard": "dashboard",
  "/dashboard/users": "users",
  "/dashboard/partners": "partners",
  "/clientes": "clients",
  "/prestamos": "loans",
  "/dashboard/receipts": "receipts",
  "/cronogramas": "cronograma",
  "/gastos": "expenses",
  "/dashboard/followups": "followups",
  "/dashboard/resumen": "resumen",
  "/reportes": "reports",
  "/formulas": "formulas",
}

async function checkUserPermission(supabase: any, userId: string, pathname: string): Promise<boolean> {
  if (pathname === "/dashboard") return true

  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .abortSignal(controller.signal)
      .single()

    clearTimeout(timeoutId)

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      // On DB error, allow access to dashboard only
      return pathname === "/dashboard"
    }

    if (profile?.is_admin) return true

    const requiredPermission = PROTECTED_ROUTES[pathname]
    if (!requiredPermission) return true

    const { data: permissions, error: permError } = await supabase
      .from("user_permissions")
      .select("route_path")
      .eq("user_id", userId)

    if (permError) {
      console.error("Error fetching permissions:", permError)
      // On DB error, allow access to dashboard only
      return pathname === "/dashboard"
    }

    if (!permissions || permissions.length === 0) return false

    const userRoutes = permissions.map((p: any) => p.route_path)
    return userRoutes.includes(pathname)
  } catch (error) {
    console.error("Unexpected error checking permissions:", error)
    // Fallback: allow access to dashboard
    return pathname === "/dashboard"
  }
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""

  // If no credentials, allow access (development mode)
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Middleware] Missing Supabase credentials - allowing access")
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          try {
            request.cookies.set(name, value)
          } catch (e) {
            console.error(`Error setting cookie ${name}:`, e)
          }
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            supabaseResponse.cookies.set(name, value, options)
          } catch (e) {
            console.error(`Error setting response cookie ${name}:`, e)
          }
        })
      },
    },
  })

  let user = null
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser()
    user = fetchedUser
  } catch (error) {
    console.error("Error getting user:", error)
    const response = NextResponse.redirect(new URL("/auth/login", request.url))
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")
    return response
  }

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && (pathname === "/auth/login" || pathname === "/auth/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!user && pathname === "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (user && !isPublicRoute && pathname !== "/") {
    try {
      const hasPermission = await checkUserPermission(supabase, user.id, pathname)
      if (!hasPermission) {
        console.warn(`⚠️ Usuario ${user.email} sin permiso para ${pathname}`)
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error("Error checking permissions:", error)
    }
  }

  return supabaseResponse
}
