import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local placeholder art is shipped as SVG in /public/images. next/image
    // refuses to optimize SVG unless explicitly allowed; these are our own
    // trusted files, served read-only under a strict CSP.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
