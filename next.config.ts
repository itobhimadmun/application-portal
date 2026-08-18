import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded documents are streamed through a route handler, so keep the
  // server action body limit generous enough for a typical form template.
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
