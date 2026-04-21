import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse / pdfjs-dist rely on a worker file loaded from disk at runtime.
  // Bundling them breaks the worker resolution. Keep them external on the server.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // JWM1451-63: physical pages moved to canonical parents 2026-04-21.
  //   /estimator/*                  → /arch/estimating/*          (rename, 1 file)
  //   /estimator/quick-quote/*      → /processing/estimating/quick-quote/*
  //   /erf/*                        → /arch/erf/*
  // These redirects preserve any bookmark / internal deep-link that still
  // uses the old URL. Not `permanent: true` yet because we're <1 week in.
  async redirects() {
    return [
      { source: "/estimator",                   destination: "/arch/estimating",                   permanent: false },
      { source: "/estimator/quick-quote",       destination: "/processing/estimating/quick-quote", permanent: false },
      { source: "/estimator/quick-quote/:path*",destination: "/processing/estimating/quick-quote/:path*", permanent: false },
      { source: "/erf",                         destination: "/arch/erf",                          permanent: false },
      { source: "/erf/:path*",                  destination: "/arch/erf/:path*",                   permanent: false },
    ];
  },
};

export default nextConfig;
