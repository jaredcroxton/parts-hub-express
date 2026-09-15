import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
  // lib/catalogue.ts and lib/drawings.ts read data/ at runtime with computed file names, which file tracing cannot follow.
  // Ship the catalogue JSON and drawings with every server route (Vercel functions), never the local inbox.
  outputFileTracingIncludes: { "/**": ["./data/*.json", "./data/drawings/*.svg"] },
  outputFileTracingExcludes: { "/**": ["./data/inbox/**/*"] },
};

export default nextConfig;
