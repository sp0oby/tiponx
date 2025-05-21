import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withAuth } from 'next-auth/middleware'

// Middleware function to handle security headers
function addSecurityHeaders(response: NextResponse) {
  const headers = response.headers

  // Content Security Policy
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://pbs.twimg.com https://abs.twimg.com https://tiponx.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.coingecko.com https://api.etherscan.io https://solscan.io https://pbs.twimg.com https://*.solana.com https://api.mainnet-beta.solana.com https://api.devnet.solana.com https://api.testnet.solana.com https://*.helius-rpc.com https://*.helius.xyz wss://*.helius-rpc.com wss://*.helius.xyz;"
  )

  // XSS Protection
  headers.set('X-XSS-Protection', '1; mode=block')

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Frame Options
  headers.set('X-Frame-Options', 'DENY')

  // Permissions Policy
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  return response
}

export default function middleware(request: NextRequest) {
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

// Specify which paths this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
} 