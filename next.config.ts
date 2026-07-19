import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const hostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: hostname
      ? [
          {
            protocol: "https",
            hostname,
            pathname: "/storage/v1/object/public/oc-images/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
