import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded documents are streamed through a route handler, so keep the
  // server action body limit generous enough for a typical form template.
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },

  // The administrator entrance is deliberately not linked anywhere in the
  // public interface. Staff reach it through this unlisted path, which serves
  // the sign-in page without exposing /admin in the address bar.
  async rewrites() {
    return [{ source: "/member-login", destination: "/admin/login" }];
  },
};

export default nextConfig;
