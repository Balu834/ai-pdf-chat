/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, // ✅ Fix Turbopack vs Webpack conflict
};

module.exports = nextConfig;