import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    domains: ['api-stage.bcfloorplans.com'], // Add your API host here
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Matches all hostnames
      },
    ],
  },
};

export default nextConfig;
