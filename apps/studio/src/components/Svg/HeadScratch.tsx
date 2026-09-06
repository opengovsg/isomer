import type { SVGProps } from "react"

import { HeadScratchGraphic } from "./HeadScratchGraphic"

export const HeadScratch = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="320"
      height="378"
      viewBox="0 0 320 378"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <HeadScratchGraphic />
    </svg>
  )
}
