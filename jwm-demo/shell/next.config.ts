import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse / pdfjs-dist rely on a worker file loaded from disk at runtime.
  // Bundling them breaks the worker resolution. Keep them external on the server.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Canonical menu paths per Chris Ball's 2026-04-19 spec (MENU_ORDER.md).
  // Physical pages still live at /estimator and /erf — redirects keep the
  // sidebar pointing at the persona-driven URLs without breaking internal
  // cross-links in existing pages. Revisit after Phase 2 once pages move.
  async redirects() {
    return [
      {
        source: "/arch/estimating",
        destination: "/estimator",
        permanent: false,
      },
      {
        source: "/arch/estimating/:path*",
        destination: "/estimator/:path*",
        permanent: false,
      },
      {
        source: "/arch/erf",
        destination: "/erf",
        permanent: false,
      },
      {
        source: "/arch/erf/:path*",
        destination: "/erf/:path*",
        permanent: false,
      },
      {
        source: "/processing/estimating/quick-quote",
        destination: "/estimator/quick-quote",
        permanent: false,
      },
      {
        source: "/processing/estimating/quick-quote/:path*",
        destination: "/estimator/quick-quote/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
