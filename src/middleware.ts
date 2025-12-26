import { NextResponse, userAgent } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { device } = userAgent(request)
    const url = request.nextUrl.clone()
    const { pathname } = url

    // Check for manual mobile preference (cookie)
    const forceMobile = request.cookies.get('pf-force-mobile')?.value === 'true'
    const isMobile = device.type === 'mobile' || device.type === 'tablet' || forceMobile

    // 1. Logic for Mobile users
    if (isMobile) {
        // If accessing the main dashboard, go to mobile version
        if (pathname === '/dashboard') {
            url.pathname = '/dashboard/mobile'
            return NextResponse.redirect(url)
        }

        // Map jobs routes
        if (pathname === '/dashboard/jobs') {
            url.pathname = '/dashboard/mobile/jobs'
            return NextResponse.redirect(url)
        }

        // Map job details
        if (pathname.startsWith('/dashboard/jobs/') && !pathname.includes('/edit') && !pathname.includes('/new')) {
            // Check if it's a specific job ID and not a sub-action
            const pathParts = pathname.split('/')
            if (pathParts.length === 4) { // /dashboard/jobs/[id]
                url.pathname = pathname.replace('/dashboard/jobs/', '/dashboard/mobile/jobs/')
                return NextResponse.redirect(url)
            }
        }

        // Map payroll routes
        if (pathname === '/dashboard/payroll') {
            url.pathname = '/dashboard/mobile/payroll'
            return NextResponse.redirect(url)
        }

        if (pathname.startsWith('/dashboard/payroll/')) {
            url.pathname = pathname.replace('/dashboard/payroll/', '/dashboard/mobile/payroll/')
            return NextResponse.redirect(url)
        }

        // Map finance routes
        if (pathname === '/dashboard/finance') {
            url.pathname = '/dashboard/mobile/finance'
            return NextResponse.redirect(url)
        }
    }

    // 2. Logic for Desktop users (only if NOT forcing mobile)
    else if (!forceMobile) {
        // If on a mobile route but NO mobile device detected, redirect back to normal version
        if (pathname === '/dashboard/mobile') {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        if (pathname.startsWith('/dashboard/mobile/jobs')) {
            url.pathname = pathname.replace('/dashboard/mobile/jobs', '/dashboard/jobs')
            return NextResponse.redirect(url)
        }

        if (pathname.startsWith('/dashboard/mobile/payroll')) {
            url.pathname = pathname.replace('/dashboard/mobile/payroll', '/dashboard/payroll')
            return NextResponse.redirect(url)
        }

        if (pathname.startsWith('/dashboard/mobile/finance')) {
            url.pathname = pathname.replace('/dashboard/mobile/finance', '/dashboard/finance')
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

// Only run on dashboard routes
export const config = {
    matcher: ['/dashboard/:path*'],
}
