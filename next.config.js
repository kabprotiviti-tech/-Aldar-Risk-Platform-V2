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
}
module.exports = nextConfig
