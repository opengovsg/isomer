import { Head, Html, Main, NextScript } from "next/document"

/**
 * Custom document so we can load the OUI (Tailwind v4) stylesheet as a static
 * <link>. It's compiled separately by `build:oui-css` to /assets/css/oui.css and
 * served from `public/` — loaded this way (not imported in _app) so it bypasses
 * studio's Tailwind v3 PostCSS pipeline, which the two versions would otherwise break.
 */
export default function Document() {
  return (
    <Html>
      <Head>
        {/* Intentional manual <link>: the OUI stylesheet is a separate Tailwind v4
            build and must NOT be imported through Next's (v3) PostCSS pipeline. */}
        {/* oxlint-disable-next-line next/no-css-tags */}
        <link rel="stylesheet" href="/assets/css/oui.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
