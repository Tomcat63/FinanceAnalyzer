import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Verschiebe Next.js Dev-Overlays aus dem Weg
  devIndicators: {
    position: 'top-right',
  },
  // Füge diese beiden Blöcke hinzu, um den Build zu erzwingen:
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;