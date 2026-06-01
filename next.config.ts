import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(self), geolocation=(self), payment=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
          "media-src 'self' blob:",
          "connect-src 'self' https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com https://api.open-meteo.com https://open.er-api.com https://api.dictionaryapi.dev https://translate.googleapis.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];

    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
