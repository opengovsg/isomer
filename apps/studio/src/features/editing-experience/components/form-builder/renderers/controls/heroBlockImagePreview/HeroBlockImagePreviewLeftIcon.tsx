import { chakra } from "@chakra-ui/react"

export const HeroBlockImagePreviewLeftIcon = chakra(
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
      <g clipPath="url(#hero-block-position-left-clip)">
        <rect
          x="0.5"
          y="0.5"
          width="102"
          height="61"
          rx="3.5"
          fill="white"
          stroke="#E5E5E5"
        />
        <rect x="59" y="12" width="22" height="7" rx="2" fill="#EBEBEB" />
        <rect x="59" y="23" width="34" height="7" rx="2" fill="#EBEBEB" />
        <rect
          x="59"
          y="51"
          width="7"
          height="16"
          rx="2"
          transform="rotate(-90 59 51)"
          fill="#EBEBEB"
        />
        <rect
          x="78"
          y="51"
          width="7"
          height="16"
          rx="2"
          transform="rotate(-90 78 51)"
          fill="#EBEBEB"
        />
        <path
          d="M50 61L3 61C1.89543 61 1 60.1046 1 59L1.00001 3C1.00001 1.89543 1.89544 0.999996 3.00001 0.999996L50 1L50 61Z"
          fill="#CECECE"
        />
      </g>
      <defs>
        <clipPath id="hero-block-position-left-clip">
          <rect width="103" height="62" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
)
