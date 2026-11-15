import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get('dt_access');
  const hasValidSession = Boolean(
    sessionCookie?.value && sessionCookie.value.trim().length > 0,
  );

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // If user has a valid session and tries to visit login, redirect to dashboard
  if (hasValidSession && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is unauthenticated and visits protected path, redirect to login
  if (!hasValidSession && !isPublicPath) {
    const nextUrl = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?next=${nextUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, static svg/png images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
