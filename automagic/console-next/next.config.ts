import type { NextConfig } from "next";
import path from "node:path";

const API_URL = process.env.AUTOMAGIC_API_URL || "http://127.0.0.1:3100";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Proxy all /api/* requests from browser to the Express backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
