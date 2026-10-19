import { chakra } from "@chakra-ui/react"

export const HeroBlockImagePreviewLeftStraightIcon = chakra(
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
      <g clipPath="url(#hero-block-left-straight-clip)">
        <rect
          x="0.5"
          y="0.5"
          width="102"
          height="61"
          rx="3.5"
          fill="white"
          stroke="#E5E5E5"
        />
        <rect x="58" y="12" width="22" height="7" rx="2" fill="#EBEBEB" />
        <rect x="58" y="28" width="34" height="7" rx="2" fill="#EBEBEB" />
        <rect
          x="58"
          y="51"
          width="7"
          height="16"
          rx="2"
          transform="rotate(-90 58 51)"
          fill="#EBEBEB"
        />
        <rect
          x="77"
          y="51"
          width="7"
          height="16"
          rx="2"
          transform="rotate(-90 77 51)"
          fill="#EBEBEB"
        />
        <path
          d="M49 61L2 61C0.895428 61 7.8281e-08 60.1046 1.74846e-07 59L5.07052e-06 3C5.16709e-06 1.89543 0.895437 0.999996 2.00001 0.999996L49 1L49 61Z"
          fill="#CECECE"
        />
      </g>
      <defs>
        <clipPath id="hero-block-left-straight-clip">
          <rect width="103" height="62" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
)
