import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fully static: no server features, so the site can be exported as plain HTML.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;