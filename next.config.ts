import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Matches all hostnames
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Add this rewrite section
  async rewrites() {
    return [
      {
        source: "/api/:path*",  // Frontend request path
        destination: "http://127.0.0.1:8000/api/:path*",  // Proxy to Laravel
      },
    ];
  },
};

export default nextConfig;
