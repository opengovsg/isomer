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
}

export default nextConfig
