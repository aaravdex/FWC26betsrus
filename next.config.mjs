/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app reads cookies on most pages, so routes are dynamic by nature.
  // Keep type/lint failures fatal so `next build` is a real verification gate.
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
