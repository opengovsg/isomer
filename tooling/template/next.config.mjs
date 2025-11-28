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
            /** @param {{ context: string }} module */
            name(module) {
              const match = module.context.match(
                /[\\/]components[\\/](?:complex|internal|native)[\\/]([^\\/]+)/,
              )
              return match
                ? `component-${match[1]}`.toLowerCase()
                : "components"
            },
            chunks: "all",
            priority: 10,
            minSize: 0,
          },
          layouts: {
            test: /[\\/]templates[\\/]next[\\/]layouts[\\/]/,
            /** @param {{ context: string }} module */
            name(module) {
              const match = module.context.match(/[\\/]layouts[\\/]([^\\/]+)/)
              return match ? `layout-${match[1]}`.toLowerCase() : "layouts"
            },
            chunks: "all",
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
