import { chakra } from "@chakra-ui/react"
import { useId } from "react"

export const IconHeroCarouselBlockLeft = chakra(
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
          <path
            d="M49 61L2 61C0.895428 61 7.8281e-08 60.1046 1.74846e-07 59L5.07052e-06 3C5.16709e-06 1.89543 0.895437 0.999996 2.00001 0.999996L49 1L49 61Z"
            fill="#CECECE"
          />
          <rect x="56" y="12" width="22" height="7" rx="2" fill="#EBEBEB" />
          <rect x="56" y="23" width="34" height="7" rx="2" fill="#EBEBEB" />
          <rect
            x="56"
            y="41"
            width="7"
            height="16"
            rx="2"
            transform="rotate(-90 56 41)"
            fill="#EBEBEB"
          />
          <rect
            x="75"
            y="41"
            width="7"
            height="16"
            rx="2"
            transform="rotate(-90 75 41)"
            fill="#EBEBEB"
          />
          <path
            d="M59 50.5L57 52.5L59 54.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#EBEBEB"
          />
          <path
            d="M70 50.5L72 52.5L70 54.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#EBEBEB"
          />
          <circle cx="92" cy="52" r="4" fill="#EBEBEB" />
          <rect x="62" y="52" width="5" height="1" rx="0.5" fill="#EBEBEB" />
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
