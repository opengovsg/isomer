/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  /** We run oxlint as a separate task in CI */
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  indexExtensions: ["index.tsx", "index.ts", "index.jsx", "index.js"],
  trailingSlash: true,
  turbo: {
    moduleIdStrategy: "deterministic",
  },
  // isomer-components → isomorphic-dompurify → jsdom. Declare those deps in package.json too so
  // Next resolves them the same from the app root as from the workspace package (pnpm); otherwise
  // Next may bundle jsdom and break __dirname (default-stylesheet.css ENOENT).
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
}

export default nextConfig
