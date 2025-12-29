/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita el warning de configuración antigua y problemas con imágenes locales
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { dev }) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      'pg-native': false,
    }

    // En desarrollo, usa caché en memoria para evitar errores ENOENT al renombrar packs en Windows
    if (dev) {
      config.cache = { type: 'memory' }
    }

    return config
  },
}

module.exports = nextConfig
