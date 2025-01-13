export const GoogleTagManagerPreload = () => {
  return (
    <>
      <link
        // Establish an early connection
        rel="preconnect"
        href="https://www.googletagmanager.com"
        crossOrigin="anonymous" // required when making requests to a different origin
      />
      <link
        // Serve as a fallback for browsers that don't support preconnect
        // at least allowing early DNS resolution
        rel="dns-prefetch"
        href="https://www.googletagmanager.com"
      />
    </>
  )
}
