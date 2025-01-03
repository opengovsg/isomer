// The following links are included to improve SEO and Lighthouse performance by optimizing font loading.
// Preconnecting to fonts.gstatic.com allows the browser to establish a connection early, reducing latency
// when fetching fonts, which can lead to faster rendering and improved user experience.

export const FontPreload = () => {
  return (
    <>
      <link
        // Establish an early connection to fonts.gstatic.com
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous" // required when making requests to a different origin
      />
      <link
        // Serve as a fallback for browsers that don't support preconnect
        // at least allowing early DNS resolution
        rel="dns-prefetch"
        href="https://fonts.gstatic.com"
      />
    </>
  )
}
