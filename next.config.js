/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      'pg-native': false
    }
    return config
  },
}

module.exports = nextConfig
