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

async function checkUserPermission(
  supabase: any,
  userId: string,
  pathname: string
): Promise<boolean> {
  if (pathname === "/dashboard") return true

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single()

    if (profile?.is_admin) return true

    const requiredPermission = PROTECTED_ROUTES[pathname]
    if (!requiredPermission) return true

    const { data: permissions } = await supabase
      .from("user_permissions")
      .select("route_path")
      .eq("user_id", userId)

    if (!permissions || permissions.length === 0) return false

    const userRoutes = permissions.map((p: any) => p.route_path)
    return userRoutes.includes(pathname)
  } catch (error) {
    console.error("[v0] Error checking permissions:", error)
    return pathname === "/dashboard"
  }
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are not available in Edge Runtime, skip middleware auth
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase env vars not available in middleware, skipping auth check")
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()

    // FIX: Si hay error de refresh token inválido, limpiar sesión y redirigir
    if (error) {
      const errorMessage = error.message?.toLowerCase() || ""
      const isRefreshTokenError = 
        errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("invalid refresh token") ||
        error.status === 400

      if (isRefreshTokenError) {
        console.log("[v0] Invalid refresh token detected, clearing session")
        
        // Crear respuesta de redirect
        const redirectUrl = new URL("/auth/login", request.url)
        const redirectResponse = NextResponse.redirect(redirectUrl)
        
        // Limpiar todas las cookies de autenticación
        const cookiesToClear = [
          'sb-access-token',
          'sb-refresh-token',
          'supabase-auth-token'
        ]
        
        cookiesToClear.forEach(cookieName => {
          redirectResponse.cookies.set(cookieName, '', {
            maxAge: 0,
            path: '/',
          })
        })
        
        return redirectResponse
      }
      
      // Para otros errores, continuar sin usuario
      console.error("[v0] Error getting user in middleware:", error)
    }

    user = data?.user || null
  } catch (error) {
    console.error("[v0] Unexpected error in middleware:", error)
    // Continue without user if auth check fails
  }

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/auth/login" || pathname === "/auth/sign-up")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Handle root path
  if (pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  // Check permissions for protected routes
  if (user && !isPublicRoute && pathname !== "/") {
    const hasPermission = await checkUserPermission(supabase, user.id, pathname)
    if (!hasPermission) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
