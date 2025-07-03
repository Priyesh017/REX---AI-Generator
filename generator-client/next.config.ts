import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "twixuweebafpkhdzejma.supabase.co",
        pathname: "/storage/v1/object/public/generated-images/**",
      },
    ],
  },
};

export default nextConfig;
