import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rendering runs in-process through Remotion's Node APIs, which must stay
  // un-bundled so they can locate their native compositor binaries.
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-linux-x64-musl",
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    "esbuild",
  ],
  experimental: {
    serverActions: { bodySizeLimit: "512mb" },
  },
};

export default nextConfig;
