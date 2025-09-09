"use client"

import { useEffect } from "react"

/*
  NOTE: This is a temporary fix until we have a better solution.

  Fix with issue w/ "next/Link" not scrolling to the top when clicking on <Link />
  if we have a header with "sticky" that's not in its sticky position.
  Ref: https://github.com/vercel/next.js/issues/45187#issuecomment-1639518030
*/
export const ScrollToTop = () => {
  // Ensures the component is mounted before executing scrollTo,
  // as Next.js may attempt it during static site generation when "window" is unavailable.
  // Ref: https://nextjs.org/docs/app/building-your-application/deploying/static-exports#browser-apis
  useEffect(() => {
    // Only scroll to top if there's no anchor in the URL
    if (window.location.hash) {
      return
    }
    window.scrollTo(0, 0)
  }, [])

  return <></>
}
