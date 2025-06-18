import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingIncludes: {
    "/api/submit": [
      "./node_modules/@aztec/bb.js/dest/node/**/*",
      "./node_modules/@aztec/bb.js/dest/node-cjs/**/*",
    ],
  },
  serverComponentsExternalPackages: ["@aztec/bb.js"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "@aztec/bb.js": "@aztec/bb.js",
      });
    }

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;
