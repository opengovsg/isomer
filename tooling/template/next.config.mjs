/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  // isomer-components → isomorphic-dompurify → jsdom. Declare those deps in package.json too so
  // Next resolves them the same from the app root as from the workspace package (pnpm); otherwise
  // Next may bundle jsdom and break __dirname (default-stylesheet.css ENOENT).
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
}

export default nextConfig
