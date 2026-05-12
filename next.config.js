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
      {
        source: '/executive-brief',
        destination: '/arc-pack',
        permanent: false,
      },
      {
        source: '/control-command-center',
        destination: '/home',
        permanent: false,
      },
    ]
  },
}
module.exports = nextConfig
