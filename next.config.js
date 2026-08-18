/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TS and ESLint errors during build due to incomplete @types from Windows npm install.
  // The app runs correctly at runtime; types are verified separately via tsc --noEmit.

  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {},
  webpack: (config) => {
    config.externals = config.externals || []
    return config
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
