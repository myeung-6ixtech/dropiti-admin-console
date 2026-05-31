import type { NextConfig } from "next";
import path from "path";

function isNhostMediaBackend(): boolean {
  return process.env.NEXT_PUBLIC_MEDIA_STORAGE_BACKEND?.trim().toLowerCase() === "nhost";
}

/** CSP connect-src entries for browser PUT to S3 presigned URLs (S3 fallback upload only). */
function s3ConnectSrcAllowlist(): string {
  const entries: string[] = [];
  const region = process.env.S3_BUCKET_AWS_REGION?.trim() || "ap-northeast-2";
  entries.push(`https://*.s3.${region}.amazonaws.com`);
  entries.push(`https://s3.${region}.amazonaws.com`);

  const domainUrl = process.env.S3_BUCKET_DOMAIN_URL?.trim();
  if (domainUrl) {
    try {
      entries.push(new URL(domainUrl).origin);
    } catch {
      /* ignore invalid URL */
    }
  }

  return [...new Set(entries)].join(" ");
}

function nhostStorageRemotePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const sub = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN?.trim();
  const region = process.env.NEXT_PUBLIC_NHOST_REGION?.trim();
  if (sub && region) {
    return [
      {
        protocol: "https",
        hostname: `${sub}.storage.${region}.nhost.run`,
        pathname: "/v1/files/**",
      },
    ];
  }
  return [
    {
      protocol: "https",
      hostname: "**.storage.*.nhost.run",
      pathname: "/v1/files/**",
    },
  ];
}

function buildConnectSrc(): string {
  const parts = [
    "'self'",
    "https://*.airwallex.com",
    "https://*.airwallex-paymentpage.com",
    "https://*.airwallex.io",
    "wss://*.airwallex.com",
  ];
  if (!isNhostMediaBackend()) {
    parts.push(s3ConnectSrcAllowlist());
  }
  return parts.join(" ");
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.*.amazonaws.com",
      },
      ...nhostStorageRemotePatterns(),
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      "@dropiti/base/utils": path.resolve(__dirname, "src/lib/dropiti-stubs/base-utils.ts"),
      "@dropiti/sdk": path.resolve(__dirname, "src/lib/dropiti-stubs/sdk.ts"),
      "@dropiti/sdk/enums": path.resolve(__dirname, "src/lib/dropiti-stubs/sdk-enums.ts"),
    };

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io",
              "style-src 'self' 'unsafe-inline' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io",
              "frame-src 'self' https://*.airwallex.com https://*.airwallex-paymentpage.com https://*.airwallex.io",
              `connect-src ${buildConnectSrc()}`,
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
