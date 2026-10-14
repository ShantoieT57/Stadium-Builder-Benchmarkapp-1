import type { NextConfig } from 'next';

/**
 * The .NET API origin. Server-side only (never NEXT_PUBLIC_*): the browser calls
 * same-origin /api/* paths and Next.js proxies them here, so the HTTP-only
 * `session` cookie is first-party and no CORS preflight is needed.
 * Rewrites are resolved when the app is built/started — set API_PROXY_TARGET
 * in the environment of `next build` / `next dev`.
 */
const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET || 'http://localhost:8042'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // Emit a minimal, self-contained server bundle in `.next/standalone`
  // so the Docker runtime image only needs Node + the traced dependencies.
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
