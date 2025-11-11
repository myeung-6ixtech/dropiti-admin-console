import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io",
              "style-src 'self' 'unsafe-inline' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io",
              "frame-src 'self' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io",
              "connect-src 'self' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io wss://*.airwallex.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
