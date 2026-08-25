import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Marketing photography and demo/seed avatars. Everything a coach
    // actually uploads goes to Supabase Storage and is served from there.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
};

export default nextConfig;
