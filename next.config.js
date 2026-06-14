/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // P7: legacy route deprecation.
    // The Lifecycle IA (Block 2 P3) absorbed these surfaces into:
    //   /dashboard         → /home          (persona-routed)
    //   /portfolio         → /portfolio-tower
    //   /executive-brief   → /arc-pack
    // /control-command-center is deleted entirely (no replacement).
    return [
      // /dashboard is RESTORED — it's the External Risk Intelligence
      // surface (live news feed + decision intelligence + AI stress test).
      // Do NOT redirect it away.
      {
        source: '/portfolio',
        destination: '/portfolio-tower',
        permanent: false,
      },
      // /executive-brief + /control-command-center RESTORED — they were
      // wrongly deprecated. /executive-brief is the Board summary view;
      // /control-command-center is the ICOFR control catalog. Both stay.
    ]
  },
  async headers() {
    // Stop corporate proxies / browsers from serving STALE HTML — the
    // chronic "I deployed but can't see the update" problem. HTML pages and
    // API responses are marked no-store so every load fetches the latest
    // build; the immutable hashed /_next/static assets are excluded so they
    // keep their long-cache headers and performance is unaffected.
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
