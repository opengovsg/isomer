import { chakra } from "@chakra-ui/react"

export const IconHeroCarouselGradientCenter = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
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
        <g clipPath="url(#clip-hero-carousel-gradient-center)">
          <path
            d="M4 0.5H99C100.933 0.5 102.5 2.067 102.5 4V58C102.5 59.933 100.933 61.5 99 61.5H4C2.067 61.5 0.5 59.933 0.5 58V4C0.5 2.067 2.067 0.5 4 0.5Z"
            fill="#D9D9D9"
            stroke="#E5E5E5"
          />
          <circle cx="90" cy="52" r="4" fill="white" />
          <rect x="36" y="12" width="32" height="7" rx="2" fill="white" />
          <rect x="27" y="23" width="49" height="7" rx="2" fill="white" />
          <rect
            x="34"
            y="41"
            width="7"
            height="16"
            rx="2"
            transform="rotate(-90 34 41)"
            fill="white"
          />
          <rect
            x="53"
            y="41"
            width="7"
            height="16"
            rx="2"
            transform="rotate(-90 53 41)"
            fill="white"
          />
          <path
            d="M45 50.5L43 52.5L45 54.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="white"
          />
          <path
            d="M56 50.5L58 52.5L56 54.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="white"
          />
          <rect x="48" y="52" width="5" height="1" rx="0.5" fill="white" />
        </g>
        <defs>
          <clipPath id="clip-hero-carousel-gradient-center">
            <rect width="103" height="62" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
