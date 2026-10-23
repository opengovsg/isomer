import { chakra } from "@chakra-ui/react"

export const IconHeroCarouselBlock = chakra(
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
        <g clipPath="url(#clip0_hero_carousel_block)">
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
            d="M53 1H100C101.105 1 102 1.89543 102 3V59C102 60.1046 101.105 61 100 61H53V1Z"
            fill="#CECECE"
          />
          <circle cx="34" cy="52" r="4" fill="#EBEBEB" />
          <circle cx="9.5" cy="52.5" r="1.5" fill="#EBEBEB" />
          <circle cx="13.5" cy="52.5" r="1.5" fill="#EBEBEB" />
          <circle cx="17.5" cy="52.5" r="1.5" fill="#EBEBEB" />
          <circle cx="44" cy="52" r="4" fill="#EBEBEB" />
        </g>
        <defs>
          <clipPath id="clip0_hero_carousel_block">
            <rect width="103" height="62" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  },
)
