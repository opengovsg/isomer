// The following links are included to improve SEO and Lighthouse performance by optimizing preloading.
// Preconnecting to the provided URL allows the browser to establish a connection early, reducing latency
// when fetching them, which can lead to faster rendering and improved user experience.

export const PreloadHelper = ({ href }: { href: string }) => {
  // TODO: replace with ReactDom.preconnect and ReactDom.dnsPrefetch
  // They are only available in React 19, while this repository remains on
  // React 18 because some design-system dependencies still use findDOMNode.
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
