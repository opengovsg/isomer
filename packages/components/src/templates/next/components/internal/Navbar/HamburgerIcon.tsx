import type { SVGProps } from "react"

export const HamburgerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={22}
    height={18}
    viewBox="0 0 22 18"
    fill="none"
    {...props}
  >
    <path fill="#333" d="M0 0h22v2H0zM0 8h22v2H0zM0 16h22v2H0z" />
  </svg>
)
