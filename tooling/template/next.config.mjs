const ContentSecurityPolicy = `
  default-src 'none';
  base-uri 'self';
  font-src
    'self'
    https:
    data:
    ;
  form-action
    'self'
    ;
  frame-ancestors 'self';
  img-src * data: blob:;
  frame-src
    'self'
    https://form.gov.sg/ 
    https://player.vimeo.com
    https://fast.wistia.net
    https://www.google.com
    https://www.youtube.com
    https://www.youtube-nocookie.com
    https://www.onemap.gov.sg
    https://www.facebook.com
    ;
  object-src 'none';
  script-src
    'self'
    'unsafe-eval'
    https://*.wogaa.sg
    ;
  style-src
    'self'
    https:
    'unsafe-inline'
    ;
  media-src
    ;
  connect-src
    'self'
    https://browser-intake-datadoghq.com
    https://*.browser-intake-datadoghq.com
    https://*.wogaa.sg
    https://cdn.growthbook.io
    "https://*.by.gov.sg"
    ;
  worker-src
    'self'
    blob:
    https://www.youtube.com
    https://player.vimeo.com
    ;
`

/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
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
  async headers() {
    return [
      {
        source: "/(*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ]
  },
}

export default nextConfig
