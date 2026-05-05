import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/generate",
        destination: "/studio",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        pathname: "/storage/v1/object/public/generated-images/**",
      },
    ],
  },
};

export default nextConfig;
