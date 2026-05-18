import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/industry-map-site",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;