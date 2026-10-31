import { chakra } from "@chakra-ui/react"

export const IconInfoCardsCarousel = chakra(
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
        <g clipPath="url(#clip0_25935_65744)">
          <path
            d="M4 0.5H99C100.933 0.5 102.5 2.067 102.5 4V58C102.5 59.933 100.933 61.5 99 61.5H4C2.067 61.5 0.5 59.933 0.5 58V4C0.5 2.067 2.067 0.5 4 0.5Z"
            fill="white"
            stroke="#E5E5E5"
          />
          <rect x="8" y="6" width="31" height="4" rx="2" fill="#EBEBEB" />
          <rect x="8" y="17" width="28" height="16" rx="2" fill="#EBEBEB" />
          <rect x="39" y="17" width="28" height="16" rx="2" fill="#EBEBEB" />
          <rect x="70" y="17" width="28" height="16" rx="2" fill="#EBEBEB" />
          <rect
            x="8"
            y="40"
            width="5"
            height="16"
            rx="2"
            transform="rotate(-90 8 40)"
            fill="#EBEBEB"
          />
          <rect
            x="39"
            y="40"
            width="5"
            height="16"
            rx="2"
            transform="rotate(-90 39 40)"
            fill="#EBEBEB"
          />
          <rect
            x="70"
            y="40"
            width="5"
            height="16"
            rx="2"
            transform="rotate(-90 70 40)"
            fill="#EBEBEB"
          />
          <circle cx="10" cy="52" r="2" fill="#EBEBEB" />
          <circle cx="16" cy="52" r="2" fill="#EBEBEB" />
          <circle cx="22" cy="52" r="2" fill="#EBEBEB" />
          <circle cx="81" cy="51" r="5" fill="#EBEBEB" />
          <circle cx="93" cy="51" r="5" fill="#EBEBEB" />
          <path
            d="M92.5 49.5L94 51L92.5 52.5"
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#B1B1B1"
          />
          <path
            d="M81.5 49.5L80 51L81.5 52.5"
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#B1B1B1"
          />
        </g>
        <defs>
          <clipPath id="clip0_25935_65744">
            <rect width="103" height="62" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
