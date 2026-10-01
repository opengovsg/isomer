import { chakra } from "@chakra-ui/react"

export const HeroBlockImagePreviewRightCurvedIcon = chakra(
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
      <g clipPath="url(#hero-block-right-curved-clip)">
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
        <mask
          id="hero-block-right-curved-mask"
          style={{ maskType: "alpha" }}
          maskUnits="userSpaceOnUse"
          x="54"
          y="-18"
          width="97"
          height="97"
        >
          <path
            d="M54 30.5C54 3.71419 75.7142 -18 102.5 -18C129.286 -18 151 3.71419 151 30.5C151 57.2858 129.286 79 102.5 79C75.7142 79 54 57.2858 54 30.5Z"
            fill="#CECECE"
          />
        </mask>
        <g mask="url(#hero-block-right-curved-mask)">
          <path
            d="M54 1H100C101.657 1 103 2.34315 103 4V59C103 60.6569 101.657 62 100 62H54V1Z"
            fill="#CECECE"
          />
        </g>
      </g>
      <defs>
        <clipPath id="hero-block-right-curved-clip">
          <rect width="103" height="62" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
)
