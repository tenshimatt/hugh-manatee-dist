import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse / pdfjs-dist rely on a worker file loaded from disk at runtime.
  // Bundling them breaks the worker resolution. Keep them external on the server.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
