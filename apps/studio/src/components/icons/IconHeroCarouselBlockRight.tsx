import { chakra } from "@chakra-ui/react"
import { useId } from "react"

export const IconHeroCarouselBlockRight = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    // Also shown on Layout, so two copies cannot share one clip id.
    const clipId = useId().split(":").join("")

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="103"
        height="62"
        viewBox="0 0 103 62"
        fill="none"
        aria-hidden
        {...props}
      >
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M4 0.5H99C100.933 0.5 102.5 2.067 102.5 4V58C102.5 59.933 100.933 61.5 99 61.5H4C2.067 61.5 0.5 59.933 0.5 58V4C0.5 2.067 2.067 0.5 4 0.5Z"
            fill="white"
            stroke="#E5E5E5"
          />
          <rect x="8" y="12" width="22" height="7" rx="2" fill="#EBEBEB" />
          <rect x="8" y="23" width="34" height="7" rx="2" fill="#EBEBEB" />
          <rect
            x="8"
            y="41"
            width="7"
            height="16"
            rx="2"
            transform="rotate(-90 8 41)"
            fill="#EBEBEB"
          />
          <rect
            x="27"
            y="41"
            width="7"
            height="16"
            rx="2"
            transform="rotate(-90 27 41)"
            fill="#EBEBEB"
          />
          <path
            d="M53 1H100C101.105 1 102 1.89543 102 3V59C102 60.1046 101.105 61 100 61H53V1Z"
            fill="#CECECE"
          />
          <path
            d="M11 50.5L9 52.5L11 54.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#EBEBEB"
          />
          <path
            d="M22 50.5L24 52.5L22 54.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#EBEBEB"
          />
          <circle cx="44" cy="52" r="4" fill="#EBEBEB" />
          <rect x="14" y="52" width="5" height="1" rx="0.5" fill="#EBEBEB" />
        </g>
        <defs>
          <clipPath id={clipId}>
            <rect width="103" height="62" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
