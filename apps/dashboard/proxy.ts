import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const APP_BASE_PATH = '/app'
const PUBLIC_PATHS = [`${APP_BASE_PATH}/login`, `${APP_BASE_PATH}/signup`, `${APP_BASE_PATH}/api/`]

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          for (const { name, value } of cookiesToSet) {
            req.cookies.set(name, value)
          }
          res = NextResponse.next({ request: req })
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p))
  const isRoot = req.nextUrl.pathname === APP_BASE_PATH || req.nextUrl.pathname === `${APP_BASE_PATH}/`

  if (!user && !isPublic && !isRoot) {
    return NextResponse.redirect(new URL(`${APP_BASE_PATH}/login`, req.url))
  }

  return res
}

export const config = {
  matcher: ['/app/((?!_next/static|_next/image|favicon.ico).*)'],
}
