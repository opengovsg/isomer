import { chakra } from "@chakra-ui/react"

export const IconHeroCarouselGradient = chakra(
  (props: React.SVGProps<SVGSVGElement>) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="103"
        height="62"
        viewBox="0 0 103 62"
        fill="none"
        {...props}
      >
        <g clipPath="url(#clip0_hero_carousel_gradient)">
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
            opacity="0.3"
            d="M1 3C1 1.89543 1.89543 1 3 1H100C101.105 1 102 1.89543 102 3V59C102 60.1046 101.105 61 100 61H1V3Z"
            fill="url(#paint0_linear_hero_carousel_gradient)"
          />
          <circle cx="80" cy="52" r="4" fill="white" />
          <circle cx="9.5" cy="52.5" r="1.5" fill="#D9D9D9" />
          <circle cx="13.5" cy="52.5" r="1.5" fill="#D9D9D9" />
          <circle cx="17.5" cy="52.5" r="1.5" fill="#D9D9D9" />
          <circle cx="90" cy="52" r="4" fill="white" />
        </g>
        <defs>
          <linearGradient
            id="paint0_linear_hero_carousel_gradient"
            x1="36.5"
            y1="31"
            x2="104.02"
            y2="31"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#686868" />
          </linearGradient>
          <clipPath id="clip0_hero_carousel_gradient">
            <rect width="103" height="62" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
