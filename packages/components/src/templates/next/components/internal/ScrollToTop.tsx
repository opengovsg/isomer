"use client"

import { useEffect } from "react"

/*
  NOTE: This is a temporary fix until we have a better solution.

  Fix with issue w/ "next/Link" not scrolling to the top when clicking on <Link />
  if we have a header with "sticky" that's not in its sticky position.
  Ref: https://github.com/vercel/next.js/issues/45187#issuecomment-1639518030
*/
export const ScrollToTop = () => {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window) window.scrollTo(0, 0)
  }, [])

  return <></>
}
