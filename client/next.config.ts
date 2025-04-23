import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://litegate.nantric.com/:path*',
      },
    ]
  },
};

export default nextConfig;
