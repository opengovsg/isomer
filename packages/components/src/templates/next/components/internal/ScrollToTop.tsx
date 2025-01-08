"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/*
  Fix with issue w/ "next/Link" not scrolling to the top when clicking on <Link />
  if we have a header with "sticky" that's not in its sticky position.
  Ref: https://github.com/vercel/next.js/issues/45187#issuecomment-1639518030
*/
export const ScrollToTop = () => {
  const pathname = usePathname()

  useEffect(() => {
    // Required because "window" is a browser-only API that's not available
    // during static site generation (SSG)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window) window.scroll(0, 0)
  }, [pathname])

  return <></>
}
