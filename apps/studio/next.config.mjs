/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
const { env } = await import("./src/env.mjs")

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
  font-src
    'self'
    https:
    data:
    https://js.intercomcdn.com
    https://fonts.intercomcdn.com
    ;
  form-action
    'self'
    https://intercom.help
    https://api-iam.intercom.io
    https://api-iam.eu.intercom.io
    https://api-iam.au.intercom.io
    ;
  frame-ancestors 'self';
  img-src * data: blob:;
  frame-src
    'self'
    https://intercom-sheets.com
    https://www.intercom-reporting.com
    https://fast.wistia.net
    https://www.google.com
    https://www.googletagmanager.com
    https://td.doubleclick.net
    https://www.onemap.gov.sg
    https://www.youtube-nocookie.com
    https://player.vimeo.com
    https://m.facebook.com
    https://www.facebook.com
    https://maps.gov.sg
    https://form.gov.sg
    ;
  object-src 'none';
  script-src
    'self'
    'unsafe-eval'
    https://*.wogaa.sg
    https://app.intercom.io
    https://widget.intercom.io
    https://js.intercomcdn.com
    ;
  style-src
    'self'
    https:
    'unsafe-inline'
    ;
  media-src
    https://js.intercomcdn.com
    https://downloads.intercomcdn.com
    https://downloads.intercomcdn.eu
    https://downloads.au.intercomcdn.com
    ;
  connect-src
    'self'
    https://browser-intake-datadoghq.com
    https://*.browser-intake-datadoghq.com
    https://vitals.vercel-insights.com
    https://*.amazonaws.com
    https://*.wogaa.sg
    https://placehold.co
    https://cdn.growthbook.io
    ${
      !!env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
        ? `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
        : "https://*.by.gov.sg"
    }
    https://via.intercom.io
    https://api.intercom.io
    https://api.au.intercom.io
    https://api.eu.intercom.io
    https://api-iam.intercom.io
    https://api-iam.eu.intercom.io
    https://api-iam.au.intercom.io
    https://api-ping.intercom.io
    https://nexus-websocket-a.intercom.io
    wss://nexus-websocket-a.intercom.io
    https://nexus-websocket-b.intercom.io
    wss://nexus-websocket-b.intercom.io
    https://nexus-europe-websocket.intercom.io
    wss://nexus-europe-websocket.intercom.io
    https://nexus-australia-websocket.intercom.io
    wss://nexus-australia-websocket.intercom.io
    https://uploads.intercomcdn.com
    https://uploads.intercomcdn.eu
    https://uploads.au.intercomcdn.com
    https://uploads.eu.intercomcdn.com
    https://uploads.intercomusercontent.com
    https://data.gov.sg
    https://*.data.gov.sg
    ;
  worker-src
    'self'
    blob:
    https://intercom-sheets.com
    https://www.intercom-reporting.com
    https://www.youtube.com
    https://player.vimeo.com
    https://fast.wistia.net
    ;
  ${env.NODE_ENV === "production" ? "upgrade-insecure-requests" : ""}
`

/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  reactStrictMode: true,
  // NOTE: this is required for datadog to work because
  // the trace/logs are initialised via the `instrumentation` file
  // https://nextjs.org/docs/14/app/api-reference/next-config-js/instrumentationHook
  experimental: {
    instrumentationHook: true,
  },
  /**
   * Dynamic configuration available for the browser and server.
   * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
   * @link https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
   */
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || []
      config.externals.push({
        // don't bundle `dd-trace` on the client side
        "dd-trace": "dd-trace",
      })
    }
  },
  transpilePackages: ["@sinclair/typebox"],
  /** We run eslint as a separate task in CI */
  eslint: { ignoreDuringBuilds: true },
  images: {
    domains: [env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME ?? ""].filter((d) => d),
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ],
      },
    ]
  },
}

export default config
