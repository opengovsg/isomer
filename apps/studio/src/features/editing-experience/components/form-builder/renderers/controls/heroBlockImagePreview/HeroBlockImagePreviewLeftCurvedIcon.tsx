import { chakra } from "@chakra-ui/react"

export const HeroBlockImagePreviewLeftCurvedIcon = chakra(
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
      <g clipPath="url(#hero-block-left-curved-clip)">
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
        <mask
          id="hero-block-left-curved-mask"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="-47"
          y="-16"
          width="97"
          height="97"
        >
          <path
            d="M50 32.5C50 59.2858 28.2858 81 1.5 81C-25.2858 81 -47 59.2858 -47 32.5C-47 5.71418 -25.2858 -16 1.50001 -16C28.2858 -16 50 5.71419 50 32.5Z"
            fill="#CECECE"
          />
        </mask>
        <g mask="url(#hero-block-left-curved-mask)">
          <path
            d="M50 62L4 62C2.34314 62 1 60.6568 1 59L1.00001 4C1.00001 2.34314 2.34315 0.999996 4.00001 0.999996L50 1L50 62Z"
            fill="#CECECE"
          />
        </g>
      </g>
      <defs>
        <clipPath id="hero-block-left-curved-clip">
          <rect width="103" height="62" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
)
