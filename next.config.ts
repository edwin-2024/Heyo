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
};

export default nextConfig;
