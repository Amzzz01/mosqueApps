const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  publicExcludes: ['!firebase-messaging-sw.js'],
  buildExcludes: [
    /app-build-manifest\.json$/,
    /middleware-manifest\.json$/,
    /middleware-build-manifest\.js$/,
    /react-loadable-manifest\.json$/,
    /server\/.*\.js$/,
    /\.map$/,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
