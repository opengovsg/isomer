// The following links are included to improve SEO and Lighthouse performance by optimizing preloading.
// Preconnecting to the provided URL allows the browser to establish a connection early, reducing latency
// when fetching them, which can lead to faster rendering and improved user experience.

export const PreloadHelper = ({ href }: { href: string }) => {
  // TODO: replace with ReactDom.preconnect and ReactDom.dnsPrefetch
  // However, note that they are only available in React 19 which is not yet supported by Next.js
  // Ref: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#resource-hints
  return (
    <>
      <link
        // Establish an early connection
        rel="preconnect"
        href={href}
        crossOrigin="anonymous" // required when making requests to a different origin
      />
      <link
        // Serve as a fallback for browsers that don't support preconnect
        // at least allowing early DNS resolution
        rel="dns-prefetch"
        href={href}
      />
    </>
  )
}
