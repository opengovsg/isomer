/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  /** We run eslint as a separate task in CI */
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  indexExtensions: ["index.tsx", "index.ts", "index.jsx", "index.js"],
  trailingSlash: true,
  turbo: {
    moduleIdStrategy: "deterministic",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          components: {
            test: /[\\/]templates[\\/]next[\\/]components[\\/]/,
            chunks: "all",
            maxSize: 25000,
            priority: 10,
            minSize: 0,
          },
          layouts: {
            test: /[\\/]templates[\\/]next[\\/]layouts[\\/]/,
            chunks: "all",
            maxSize: 25000,
            priority: 10,
            minSize: 0,
          },
        },
      }
    }
    return config
  },
}

export default nextConfig
