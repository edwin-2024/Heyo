import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "br-orange-grass-b3v7tt3o.storage.c-4.ap-southeast-1.aws.neon.tech",
      },
      {
        protocol: "https",
        hostname: "*.storage.c-4.ap-southeast-1.aws.neon.tech",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/widget.js",
        headers: [
          { key: "Content-Type", value: "text/javascript; charset=utf-8" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS, HEAD" },
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=86400",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Timing-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
