import { chakra } from "@chakra-ui/react"

export const HeroBlockImagePreviewRightStraightIcon = chakra(
  (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="103"
      height="62"
      viewBox="0 0 103 62"
      fill="none"
      aria-hidden
      {...props}
    >
      <g clipPath="url(#hero-block-right-straight-clip)">
        <rect
          x="0.5"
          y="0.5"
          width="102"
          height="61"
          rx="3.5"
          fill="white"
          stroke="#E5E5E5"
        />
        <rect x="8" y="12" width="22" height="7" rx="2" fill="#EBEBEB" />
        <rect x="8" y="23" width="34" height="7" rx="2" fill="#EBEBEB" />
        <rect
          x="8"
          y="51"
          width="7"
          height="16"
          rx="2"
          transform="rotate(-90 8 51)"
          fill="#EBEBEB"
        />
        <rect
          x="27"
          y="51"
          width="7"
          height="16"
          rx="2"
          transform="rotate(-90 27 51)"
          fill="#EBEBEB"
        />
        <path
          d="M53 1H100C101.105 1 102 1.89543 102 3V59C102 60.1046 101.105 61 100 61H53V1Z"
          fill="#CECECE"
        />
      </g>
      <defs>
        <clipPath id="hero-block-right-straight-clip">
          <rect width="103" height="62" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
)
