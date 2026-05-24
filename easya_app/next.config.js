/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Allow optimization and custom headers if needed */
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
