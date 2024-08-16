/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
const { env } = await import("./src/env.mjs")
const { S3_REGION, S3_ASSETS_BUCKET_NAME } = env

/*
TODO: Removing this CSP first
  // img-src 'self' data: blob: ${
  //   // For displaying images from R2
  //   env.R2_PUBLIC_HOSTNAME ? `https://${env.R2_PUBLIC_HOSTNAME}` : ''
  // };
  // script-src 'self' ${env.NODE_ENV === "production" ? "" : "'unsafe-eval'"};
*/

// TODO: Stricten the CSP for images
const ContentSecurityPolicy = `
  default-src 'none';
  base-uri 'self';
  font-src 'self' https: data:;
  form-action 'self';
  frame-ancestors 'self';
  img-src * data: blob:;
  frame-src 'self';
  object-src 'none';
  script-src 'self' 'unsafe-eval';
  style-src 'self' https: 'unsafe-inline';
  connect-src
    'self'
    https://schema.isomer.gov.sg
    https://browser-intake-datadoghq.com
    https://*.browser-intake-datadoghq.com
    https://vitals.vercel-insights.com/v1/vitals
    https://${S3_ASSETS_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com
    ;
  worker-src 'self' blob:;
  ${env.NODE_ENV === "production" ? "upgrade-insecure-requests" : ""}
`

/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  reactStrictMode: true,
  /**
   * Dynamic configuration available for the browser and server.
   * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
   * @link https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
   */
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  /** We run eslint as a separate task in CI */
  eslint: { ignoreDuringBuilds: true },
  images: {
    domains: [env.S3_ASSETS_DOMAIN_NAME ?? ""].filter((d) => d),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Origin-Agent-Cluster",
            value: "?1",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ]
  },
}

export default config
