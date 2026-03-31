/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false, // ✅ FIXES ERROR
    };

    return config;
  },
};

module.exports = nextConfig;